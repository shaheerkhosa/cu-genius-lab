import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MODEL = "claude-sonnet-4-6";
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

const SYSTEM_PROMPT = `You are an expert academic advisor and study guide creator for university students. Always format responses in clear markdown with proper headings (##, ###), bullet points, numbered lists, and bold text for emphasis. Create comprehensive, actionable, personalized study guides.

For each weak CLO you receive, provide:
- A clear explanation of what mastery looks like
- 3-5 specific study activities
- Recommended resources (be specific — name actual books, websites, YouTube channels)
- Self-assessment questions
- Estimated time to improve

Format the guide with clear headings, bullet points, priority levels (High/Medium/Low), and checkboxes for tracking progress. Keep the tone motivating and supportive. Aim for 800-1200 words highly specific to the student's actual weak points.`;

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

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY is not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    const userPrompt = `Generate a comprehensive, personalized study guide for a student based on this performance analysis:

${subjectAnalysis}
${focusArea ? `\n**Special Focus:** ${focusArea}` : ''}

The guide should:
1. Prioritize CLOs and subjects below 60%
2. Provide specific, practical study techniques per weak CLO
3. Suggest concrete resources (textbooks, online resources, practice problems, tutorials)
4. Define clear, measurable goals
5. Include a realistic study timeline (e.g., "Week 1-2: Focus on X")
6. Address root causes (conceptual gaps, practice needs, etc.)`;

    console.log('Generating study guide for:', subjects.map((s: SubjectData) => s.code).join(', '));

    const startTime = Date.now();
    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        system: [
          { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
        ],
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    console.log(`Anthropic request completed in ${Date.now() - startTime}ms`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: `AI generation failed: ${errorText}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const studyGuide = data.content?.[0]?.text;

    if (!studyGuide) {
      throw new Error('No content in AI response');
    }

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
