import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const THRESHOLDS = {
  AUTO_APPROVE: 70,
  FLAG_FOR_REVIEW: 40,
};

const DOCUMENT_TYPES = {
  matric_certificate: {
    name: 'Matric Certificate (SSC)',
    elements: ['Institution Logo', 'Board Name', 'Student Name', 'Roll Number', 'Grade Table', 'Official Stamp', 'Signature', 'Issue Date']
  },
  olevel_result: {
    name: 'O-Level Result',
    elements: ['Cambridge Logo', 'Candidate Name', 'Centre Number', 'Candidate Number', 'Subject Grades Table', 'Examination Period', 'Statement of Results Header']
  },
  alevel_result: {
    name: 'A-Level Result',
    elements: ['Cambridge Logo', 'Candidate Name', 'Centre Number', 'Candidate Number', 'Subject Grades Table', 'Examination Period', 'Statement of Results Header']
  },
  health_certificate: {
    name: 'Health/Medical Certificate',
    elements: ['Hospital/Clinic Letterhead', 'Doctor Name', 'Medical Registration Number', 'Patient Name', 'Diagnosis/Health Status', 'Doctor Signature', 'Hospital Stamp', 'Date']
  },
  character_certificate: {
    name: 'Character Certificate',
    elements: ['Institution Letterhead', 'Student Name', 'Character Assessment', 'Principal/Head Signature', 'Institution Stamp', 'Issue Date']
  },
  domicile: {
    name: 'Domicile Certificate',
    elements: ['Government Letterhead', 'Citizen Name', 'Father Name', 'District Name', 'Issue Authority', 'Official Stamp', 'Signature', 'Issue Date']
  },
  ibcc: {
    name: 'IBCC Equivalence Certificate',
    elements: ['IBCC Logo', 'Student Name', 'Foreign Qualification Details', 'Pakistani Equivalence', 'IBCC Seal', 'Signature', 'Certificate Number']
  },
  cnic: {
    name: 'CNIC (Computerized National Identity Card)',
    elements: ['NADRA Logo', 'Photograph', 'Name', 'Father Name', 'CNIC Number', 'Date of Birth', 'Issue Date', 'Hologram/Security Features']
  }
};

function determineStatus(score: number): string {
  if (score >= THRESHOLDS.AUTO_APPROVE) return 'verified';
  if (score >= THRESHOLDS.FLAG_FOR_REVIEW) return 'flagged';
  return 'rejected';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, documentType, documentId } = await req.json();

    if (!imageBase64 || !documentType || !documentId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: imageBase64, documentType, documentId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const docTypeInfo = DOCUMENT_TYPES[documentType as keyof typeof DOCUMENT_TYPES];
    if (!docTypeInfo) {
      return new Response(
        JSON.stringify({ error: 'Invalid document type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Call Lovable AI for document analysis
    const prompt = `You are an expert document verification system for Pakistani educational and official documents.

Analyze this ${docTypeInfo.name} and verify its authenticity by checking for the following elements:
${docTypeInfo.elements.map((el, i) => `${i + 1}. ${el}`).join('\n')}

For each element:
- Determine if it is present (true/false)
- Estimate confidence (0.0 to 1.0)
- Note any quality issues

Also assess:
- Overall document quality (poor/fair/good/excellent)
- Any signs of tampering or forgery
- Image clarity and resolution
- Whether text is readable

Return a verification score from 0-100 where:
- 70-100: Document appears authentic and meets quality standards
- 40-69: Document has concerns that require manual review
- 0-39: Document appears fraudulent or has critical quality issues

Format your response as JSON with this structure:
{
  "score": <number 0-100>,
  "document_type_match": <boolean>,
  "elements_found": [
    {"name": "<element name>", "found": <boolean>, "confidence": <0-1>}
  ],
  "quality_assessment": "<poor|fair|good|excellent>",
  "issues": [
    {"type": "<warning|error>", "message": "<description>"}
  ],
  "recommendation": "<brief explanation>"
}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a document verification AI. Always respond with valid JSON only.' },
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageBase64 } }
            ]
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your Lovable AI workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'AI verification failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content;
    
    if (!aiContent) {
      throw new Error('No content in AI response');
    }

    // Parse JSON from AI response
    let verificationResult;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        verificationResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in AI response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent);
      throw new Error('Failed to parse AI verification result');
    }

    const status = determineStatus(verificationResult.score);
    const flaggedReason = status === 'flagged' 
      ? `Score: ${verificationResult.score}/100. Issues: ${verificationResult.issues?.map((i: any) => i.message).join(', ')}`
      : status === 'rejected'
      ? `Document rejected: Score ${verificationResult.score}/100. ${verificationResult.recommendation}`
      : null;

    // Update document in database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: updateError } = await supabase
      .from('documents')
      .update({
        verification_status: status,
        verification_score: verificationResult.score,
        verification_details: verificationResult,
        flagged_at: status === 'flagged' ? new Date().toISOString() : null,
        flagged_reason: flaggedReason,
      })
      .eq('id', documentId);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw updateError;
    }

    console.log(`Document ${documentId} verified with status: ${status}, score: ${verificationResult.score}`);

    return new Response(
      JSON.stringify({
        success: true,
        status,
        score: verificationResult.score,
        details: verificationResult
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Verification error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
