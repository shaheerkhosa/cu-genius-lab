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

Generate a study guide that is 800-1200 words, highly specific to the student's actual weak points.`;

    const model = 'llama3.2:latest';

    console.log('Generating study guide for subjects:', subjects.map((s: SubjectData) => s.code).join(', '));
    console.log('Using Ollama URL:', ollamaUrl);
    console.log('Using model:', model);

    // Add timeout to prevent edge function from hanging
    // Study guide generation can take time with Ollama, so allow 2 minutes
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 second timeout

    const startTime = Date.now();
    let ollamaResponse;
    try {
      console.log('Sending request to Ollama...');
      ollamaResponse = await fetch(`${ollamaUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { 
              role: 'system', 
              content: 'You are an expert academic study guide creator for university students. Always format responses in clear markdown with proper headings (##, ###), bullet points, numbered lists, and bold text for emphasis. Create comprehensive, actionable study guides.'
            },
            { role: 'user', content: prompt }
          ],
          stream: false,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const elapsedTime = Date.now() - startTime;
      console.log(`Ollama request completed in ${elapsedTime}ms`);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Ollama request timed out');
        return new Response(
          JSON.stringify({ error: 'Request to Ollama timed out. Please check your ngrok URL and ensure Ollama is running and responding.' }),
          { status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.error('Failed to connect to Ollama:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to connect to Ollama. Please verify your ngrok URL is correct and Ollama is running.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!ollamaResponse.ok) {
      const errorText = await ollamaResponse.text();
      console.error('Ollama error:', ollamaResponse.status, errorText);
      
      // Try to parse the error to give a more helpful message
      let errorMessage = 'Failed to connect to Ollama. Check your ngrok URL and ensure Ollama is running.';
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.includes('not found')) {
          errorMessage = `Model "${model}" not found in Ollama. Please run: ollama pull ${model}`;
        } else {
          errorMessage = errorJson.error || errorMessage;
        }
      } catch {
        // If we can't parse, use default message
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const ollamaData = await ollamaResponse.json();
    const studyGuide = ollamaData.message?.content;

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
