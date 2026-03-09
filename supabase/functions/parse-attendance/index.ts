import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const studentList = enrolled_students.map((s: any) => `- ${s.student_name} (${s.student_email})`).join("\n");

    const systemPrompt = `You are an attendance extraction agent. You will receive a screenshot from an online class (Zoom, Google Meet, Microsoft Teams, or similar).

Your task:
1. Look at the screenshot and identify all participant names visible in the meeting.
2. Match them against the enrolled student list provided below.
3. For each enrolled student, determine if they are "present" (their name appears in the screenshot) or "absent" (not visible).
4. Use fuzzy matching - if a participant's display name is similar to a student's name or email, consider them present.

Enrolled students:
${studentList}

You MUST call the mark_attendance function with your results. Only include students from the enrolled list.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Here is the screenshot from the online class. Please identify which enrolled students are present and which are absent.",
              },
              {
                type: "image_url",
                image_url: { url: `data:image/png;base64,${image_base64}` },
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "mark_attendance",
              description: "Mark attendance for enrolled students based on the screenshot analysis",
              parameters: {
                type: "object",
                properties: {
                  attendance: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        student_id: { type: "string", description: "The student's ID" },
                        student_name: { type: "string", description: "The student's name" },
                        status: { type: "string", enum: ["present", "absent"], description: "Whether the student was found in the screenshot" },
                        matched_name: { type: "string", description: "The name from the screenshot that matched this student, or null if absent" },
                      },
                      required: ["student_id", "student_name", "status"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["attendance"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "mark_attendance" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "AI did not return structured attendance data" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const attendanceData = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(attendanceData), {
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
