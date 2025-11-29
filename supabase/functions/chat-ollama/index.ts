import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, ollamaUrl } = await req.json();

    if (!ollamaUrl) {
      return new Response(JSON.stringify({ error: "Ollama URL is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const model = "llama2:7b";

    console.log("Connecting to Ollama at:", ollamaUrl);
    console.log("Using model:", model);
    console.log("Messages:", messages);

    // Convert messages to a single prompt for /api/generate
    const prompt = messages
      .map((msg: { role: string; content: string }) => {
        if (msg.role === "user") return `[INST] ${msg.content} [/INST]`;
        if (msg.role === "assistant") return msg.content;
        return msg.content;
      })
      .join("\n");

    console.log("Formatted prompt:", prompt);

    // Call Ollama API using /api/generate endpoint
    const ollamaResponse = await fetch(`${ollamaUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
    console.log("Ollama response:", data);

    // Return the response in a format the frontend expects
    return new Response(JSON.stringify({
      message: {
        content: data.response || ""
      },
      done: data.done
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in chat-ollama function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
