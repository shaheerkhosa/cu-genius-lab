import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MODEL = "claude-sonnet-4-6";
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

interface EnrolledStudent {
  student_id?: string;
  student_name: string;
  student_email: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { image_base64, enrolled_students } = await req.json();

    if (!image_base64 || !enrolled_students || !Array.isArray(enrolled_students)) {
      return new Response(JSON.stringify({ error: "image_base64 and enrolled_students[] are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const studentList = enrolled_students
      .map((s: EnrolledStudent) => `- ${s.student_name} (${s.student_email})`)
      .join("\n");

    const systemPrompt = `You are an attendance extraction agent. You will receive a screenshot from an online class (Zoom, Google Meet, Microsoft Teams, or similar).

Your task:
1. Look at the screenshot and identify all participant names visible in the meeting.
2. Match them against the enrolled student list provided below.
3. For each enrolled student, determine if they are "present" (their name appears in the screenshot) or "absent" (not visible).
4. Use fuzzy matching - if a participant's display name is similar to a student's name or email, consider them present.

Enrolled students:
${studentList}

You MUST call the mark_attendance tool with your results. Only include students from the enrolled list.`;

    // image_base64 may arrive as either a raw base64 string or a data URL.
    let mediaType = "image/png";
    let imageData = image_base64;
    const dataUrlMatch = /^data:(image\/[a-zA-Z+]+);base64,(.+)$/.exec(image_base64);
    if (dataUrlMatch) {
      mediaType = dataUrlMatch[1];
      imageData = dataUrlMatch[2];
    }

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
        system: systemPrompt,
        tools: [
          {
            name: "mark_attendance",
            description: "Mark attendance for enrolled students based on the screenshot analysis",
            input_schema: {
              type: "object",
              properties: {
                attendance: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      student_id: { type: "string", description: "The student's ID" },
                      student_name: { type: "string", description: "The student's name" },
                      status: {
                        type: "string",
                        enum: ["present", "absent"],
                        description: "Whether the student was found in the screenshot",
                      },
                      matched_name: {
                        type: "string",
                        description: "The name from the screenshot that matched this student, or empty if absent",
                      },
                    },
                    required: ["student_id", "student_name", "status"],
                  },
                },
              },
              required: ["attendance"],
            },
          },
        ],
        tool_choice: { type: "tool", name: "mark_attendance" },
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: mediaType, data: imageData },
              },
              {
                type: "text",
                text: "Here is the screenshot from the online class. Please identify which enrolled students are present and which are absent.",
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Anthropic API error:", response.status, text);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const toolUseBlock = result.content?.find((b: { type: string }) => b.type === "tool_use");

    if (!toolUseBlock?.input) {
      return new Response(JSON.stringify({ error: "AI did not return structured attendance data" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(toolUseBlock.input), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-attendance error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
