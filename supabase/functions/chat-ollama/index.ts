import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Message {
  role: string;
  content: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, ollamaUrl, summary, generateSummary } = await req.json();

    if (!ollamaUrl) {
      return new Response(JSON.stringify({ error: "Ollama URL is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const model = "llama3.2:latest";

    // If we're generating a summary, use a special prompt
    if (generateSummary) {
      console.log("Generating summary for conversation...");
      
      const summaryPrompt = `Summarize this conversation in 2-3 short sentences, capturing the key topics and any important facts mentioned. Be concise.

Conversation:
${messages.map((m: Message) => `${m.role}: ${m.content}`).join("\n")}

Summary:`;

      const summaryResponse = await fetch(`${ollamaUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: model,
          prompt: summaryPrompt,
          stream: false,
        }),
      });

      if (!summaryResponse.ok) {
        const errorText = await summaryResponse.text();
        console.error("Summary generation error:", errorText);
        return new Response(JSON.stringify({ error: `Summary error: ${errorText}` }), {
          status: summaryResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const summaryData = await summaryResponse.json();
      console.log("Generated summary:", summaryData.response);

      return new Response(
        JSON.stringify({ summary: summaryData.response || "" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normal chat - use summary + last 2 messages only
    console.log("Connecting to Ollama at:", ollamaUrl);
    console.log("Using model:", model);
    console.log("Summary:", summary || "None");
    console.log("Messages count:", messages.length);

    // Build context-efficient prompt
    let prompt = "";
    
    // Add summary as context if available
    if (summary) {
      prompt += `[Previous conversation context: ${summary}]\n\n`;
    }
    
    // Only use last 2 messages (1 exchange) for speed
    const recentMessages = messages.slice(-2);
    console.log("Using last", recentMessages.length, "messages");
    
    prompt += recentMessages
      .map((msg: Message) => {
        if (msg.role === "user") return `[INST] ${msg.content} [/INST]`;
        if (msg.role === "assistant") return msg.content;
        return msg.content;
      })
      .join("\n");

    console.log("Final prompt length:", prompt.length, "chars");

    const ollamaResponse = await fetch(`${ollamaUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        stream: false,
      }),
    });

    if (!ollamaResponse.ok) {
      const errorText = await ollamaResponse.text();
      console.error("Ollama API error:", errorText);
      return new Response(JSON.stringify({ error: `Ollama API error: ${errorText}` }), {
        status: ollamaResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await ollamaResponse.json();
    console.log("Ollama response received, length:", data.response?.length || 0);

    return new Response(
      JSON.stringify({
        message: { content: data.response || "" },
        done: data.done,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in chat-ollama function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
