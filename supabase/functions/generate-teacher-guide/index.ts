import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MODEL = "claude-sonnet-4-6";
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

const SYSTEM_PROMPT = `You are an expert academic curriculum designer helping university instructors create study materials. Format responses in clear markdown with proper headings (##, ###), bullet points, numbered lists, and bold text. Create comprehensive, distributable study guides.

For each weak CLO you receive, provide:
- A clear, student-friendly explanation of the concept
- 3-5 practice activities or exercises
- Recommended resources (specific books, websites, YouTube channels)
- Self-check questions students can use to test their understanding
- Estimated study time needed

Format the guide with clear headings, bullet points, priority levels (High/Medium/Low) based on class performance gaps, and checkboxes for student progress tracking. The tone should be clear, professional, and encouraging — suitable for distribution to university students. Aim for 800-1200 words targeted at the specific weak points identified in the class data.`;

interface CLO {
  cloNumber: number;
  description: string;
  score: number;
  assessmentType: string;
}

interface SubjectData {
  code: string;
  name: string;
  classAverage: number;
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
        `  - CLO ${clo.cloNumber}: ${clo.description} (Class Average: ${Math.round(clo.score)}%)`
      ).join('\n');

      return `
**${s.name} (${s.code})**
- Class Average: ${Math.round(s.classAverage)}%
- Weak Areas (CLOs where the class averages below 60%):
${weakCLOsList || '  (None - class is performing well)'}
`;
    }).join('\n');

    const userPrompt = `Based on the following class performance data, generate a comprehensive study guide that the teacher can distribute to students:

${subjectAnalysis}
${focusArea ? `\n**Special Focus:** ${focusArea}` : ''}

The guide should:
1. Target class-wide weak areas (CLOs where the class average is below 60%)
2. Break down difficult concepts into digestible sections
3. Suggest exercises, sample problems, and self-assessment questions
4. Recommend textbooks, online materials, video tutorials, and reference materials
5. Organize content from foundational to advanced
6. Include brief teaching notes for the instructor on how to present each topic`;

    console.log('Generating teacher study guide for:', subjects.map((s: SubjectData) => s.code).join(', '));

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

    if (!studyGuide) throw new Error('No content in AI response');

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
    console.error('Teacher study guide error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
