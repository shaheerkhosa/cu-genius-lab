import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

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
    const { subjects, focusArea, ollamaUrl } = await req.json();

    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return new Response(
        JSON.stringify({ error: 'At least one subject is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!ollamaUrl) {
      return new Response(
        JSON.stringify({ error: 'Ollama URL is not configured. Please set your ngrok URL in settings.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build teacher-oriented prompt
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

    const prompt = `You are an expert academic curriculum designer and teaching assistant helping a university instructor prepare study materials for their class.

Based on the following class performance data, generate a comprehensive study guide that the teacher can distribute to students:

${subjectAnalysis}

${focusArea ? `**Special Focus:** ${focusArea}` : ''}

Create a study guide that:

1. **Targets class-wide weak areas**: Focus on CLOs where the class average is below 60%
2. **Provides clear explanations**: Break down difficult concepts into digestible sections
3. **Includes practice materials**: Suggest exercises, sample problems, and self-assessment questions
4. **Recommends resources**: Textbooks, online materials, video tutorials, and reference materials
5. **Structures content logically**: Organize from foundational concepts to advanced applications
6. **Includes teaching notes**: Brief suggestions for the instructor on how to present each topic

For each weak CLO, provide:
- A clear, student-friendly explanation of the concept
- 3-5 practice activities or exercises
- Recommended resources (specific books, websites, YouTube channels)
- Self-check questions students can use to test their understanding
- Estimated study time needed

Format the guide with:
- Clear headings and sections using markdown
- Bullet points for easy reading
- Priority levels (High/Medium/Low) based on class performance gaps
- Checkboxes for student progress tracking

The tone should be clear, professional, and encouraging — suitable for distribution to university students.

Generate a study guide that is 800-1200 words, targeted at the specific weak points identified in the class data.`;

    const model = 'llama3.2:1b';

    console.log('Generating teacher study guide for:', subjects.map((s: SubjectData) => s.code).join(', '));
    console.log('Using Ollama URL:', ollamaUrl);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    let ollamaResponse;
    try {
      ollamaResponse = await fetch(`${ollamaUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert academic curriculum designer helping university instructors create study materials. Format responses in clear markdown with proper headings (##, ###), bullet points, numbered lists, and bold text. Create comprehensive, distributable study guides.'
            },
            { role: 'user', content: prompt }
          ],
          stream: false,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        return new Response(
          JSON.stringify({ error: 'Request timed out. Please check your ngrok URL and ensure Ollama is running.' }),
          { status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ error: 'Failed to connect to Ollama. Verify your ngrok URL is correct and Ollama is running.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!ollamaResponse.ok) {
      const errorText = await ollamaResponse.text();
      console.error('Ollama error:', ollamaResponse.status, errorText);
      let errorMessage = 'Failed to connect to Ollama.';
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.includes('not found')) {
          errorMessage = `Model "${model}" not found. Please run: ollama pull ${model}`;
        } else {
          errorMessage = errorJson.error || errorMessage;
        }
      } catch { /* use default */ }
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const ollamaData = await ollamaResponse.json();
    const studyGuide = ollamaData.message?.content;

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
