import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MODEL = "claude-sonnet-4-6";
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

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

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

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
- 0-39: Document appears fraudulent or has critical quality issues`;

    // Parse image — accept both raw base64 and data URLs
    let mediaType = "image/jpeg";
    let imageData = imageBase64;
    const dataUrlMatch = /^data:(image\/[a-zA-Z+]+);base64,(.+)$/.exec(imageBase64);
    if (dataUrlMatch) {
      mediaType = dataUrlMatch[1];
      imageData = dataUrlMatch[2];
    }

    const aiResponse = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2048,
        system: 'You are a document verification AI. Always respond with valid JSON only — no preamble, no markdown fences.',
        tools: [
          {
            name: "report_verification",
            description: "Report the verification result for the document",
            input_schema: {
              type: "object",
              properties: {
                score: { type: "number", description: "Verification score 0-100" },
                document_type_match: { type: "boolean" },
                elements_found: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      found: { type: "boolean" },
                      confidence: { type: "number" },
                    },
                    required: ["name", "found", "confidence"],
                  },
                },
                quality_assessment: {
                  type: "string",
                  enum: ["poor", "fair", "good", "excellent"],
                },
                issues: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: { type: "string", enum: ["warning", "error"] },
                      message: { type: "string" },
                    },
                    required: ["type", "message"],
                  },
                },
                recommendation: { type: "string" },
              },
              required: ["score", "document_type_match", "elements_found", "quality_assessment", "issues", "recommendation"],
            },
          },
        ],
        tool_choice: { type: "tool", name: "report_verification" },
        messages: [
          {
            role: 'user',
            content: [
              { type: "image", source: { type: "base64", media_type: mediaType, data: imageData } },
              { type: "text", text: prompt },
            ],
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Anthropic API error:', aiResponse.status, errorText);
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ error: 'AI verification failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const toolUseBlock = aiData.content?.find((b: { type: string }) => b.type === "tool_use");

    if (!toolUseBlock?.input) {
      throw new Error('AI did not return a verification result');
    }

    const verificationResult = toolUseBlock.input;
    const status = determineStatus(verificationResult.score);
    const flaggedReason = status === 'flagged'
      ? `Score: ${verificationResult.score}/100. Issues: ${verificationResult.issues?.map((i: { message: string }) => i.message).join(', ')}`
      : status === 'rejected'
      ? `Document rejected: Score ${verificationResult.score}/100. ${verificationResult.recommendation}`
      : null;

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
