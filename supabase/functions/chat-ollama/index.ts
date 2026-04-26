import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MODEL = "claude-sonnet-4-6";
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

interface Message {
  role: string;
  content: string;
}

async function callClaude(body: Record<string, unknown>) {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${errorText}`);
  }

  return await response.json();
}

function normalizeRole(role: string): "user" | "assistant" {
  return role === "assistant" ? "assistant" : "user";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, summary, generateSummary } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages[] is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (generateSummary) {
      const conversationText = messages
        .map((m: Message) => `${m.role}: ${m.content}`)
        .join("\n");

      const data = await callClaude({
        model: MODEL,
        max_tokens: 256,
        system: "You are a helpful assistant that summarizes conversations concisely.",
        messages: [
          {
            role: "user",
            content:
              `Summarize this conversation in 2-3 short sentences, capturing the key topics and any important facts mentioned. Be concise.\n\nConversation:\n${conversationText}`,
          },
        ],
      });

      const summaryContent = data.content?.[0]?.text ?? "";
      return new Response(JSON.stringify({ summary: summaryContent }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const recent = messages.slice(-2).map((m: Message) => ({
      role: normalizeRole(m.role),
      content: m.content,
    }));

    if (recent[0]?.role !== "user") {
      recent.unshift({ role: "user", content: "(continuing)" });
    }

    const systemPrompt = summary
      ? `You are a helpful assistant. Previous conversation context: ${summary}`
      : "You are a helpful assistant.";

    const data = await callClaude({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: recent,
    });

    const responseContent = data.content?.[0]?.text ?? "";

    return new Response(
      JSON.stringify({
        message: { content: responseContent },
        done: data.stop_reason === "end_turn",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("chat-ollama error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
