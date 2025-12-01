import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CLO {
  cloNumber: number;
  description: string;
  score: number;
}

interface SubjectData {
  code: string;
  name: string;
  overallPerformance: number;
  grade: string;
  weakCLOs: CLO[];
  allCLOs: CLO[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subjects, focusArea } = await req.json();

    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return new Response(
        JSON.stringify({ error: 'At least one subject is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build comprehensive prompt
    const subjectAnalysis = subjects.map((s: SubjectData) => {
      const weakCLOsList = s.weakCLOs.map(clo => 
        `  - CLO ${clo.cloNumber}: ${clo.description} (Current: ${clo.score}%)`
      ).join('\n');

      return `
**${s.name} (${s.code})**
- Current Grade: ${s.grade} (${Math.round(s.overallPerformance)}%)
- Weak Areas (CLOs scoring <60%):
${weakCLOsList || '  (None - performing well)'}
`;
    }).join('\n');

    const prompt = `You are an expert academic advisor and study guide creator for university students.

Generate a comprehensive, personalized study guide for a student based on their performance analysis:

${subjectAnalysis}

${focusArea ? `**Special Focus:** ${focusArea}` : ''}

Create a detailed study guide that:

1. **Prioritizes weak areas**: Focus heavily on CLOs and subjects where the student scored below 60%
2. **Provides actionable strategies**: Give specific, practical study techniques for each weak CLO
3. **Includes resources**: Suggest textbooks, online resources, practice problems, and tutorials
4. **Sets goals**: Define clear, measurable learning objectives
5. **Creates a timeline**: Suggest a realistic study schedule (e.g., "Week 1-2: Focus on X")
6. **Addresses root causes**: Identify why the student might be struggling (conceptual gaps, practice needs, etc.)

For each weak CLO, provide:
- Clear explanation of what mastery looks like
- 3-5 specific study activities
- Recommended resources (be specific - name actual books, websites, YouTube channels)
- Self-assessment questions
- Estimated time to improve

Format the guide with:
- Clear headings and sections
- Bullet points for easy reading
- Priority levels (High/Medium/Low)
- Checkboxes for tracking progress

Keep the tone motivating and supportive. Include encouragement and realistic expectations.

Generate a study guide that is 1500-2500 words, highly specific to the student's actual weak points.`;

    console.log('Generating study guide for subjects:', subjects.map((s: SubjectData) => s.code).join(', '));

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an expert academic study guide creator. Always format responses in clear markdown with proper headings, lists, and structure.' },
          { role: 'user', content: prompt }
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
        JSON.stringify({ error: 'AI generation failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const studyGuide = aiData.choices?.[0]?.message?.content;

    if (!studyGuide) {
      throw new Error('No content in AI response');
    }

    console.log('Study guide generated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        studyGuide,
        metadata: {
          generatedAt: new Date().toISOString(),
          subjectsAnalyzed: subjects.length,
          totalWeakCLOs: subjects.reduce((sum: number, s: SubjectData) => sum + s.weakCLOs.length, 0),
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Study guide generation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
