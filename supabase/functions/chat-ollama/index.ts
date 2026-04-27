// Northbridge AI assistant — tool-using Claude agent.
//
// The model has access to a vector-searchable knowledge base (handbook,
// policies, FAQs, course catalog) plus typed query tools over the seeded
// Northbridge dataset (faculty, rooms, dining, events, clubs, library).
// It runs a tool loop until it produces a final answer, then returns the
// answer along with the citations it consulted.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MODEL = "claude-sonnet-4-6";
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings";
const MAX_TOOL_TURNS = 6;

// ─── Env / helpers ──────────────────────────────────────────────────────────
function envOrThrow(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`${name} is not configured`);
  return v;
}

const SUPABASE_URL = envOrThrow("SUPABASE_URL");
const SERVICE_KEY  = envOrThrow("SUPABASE_SERVICE_ROLE_KEY");

async function sbGet(path: string): Promise<unknown> {
  const r = await fetch(`${SUPABASE_URL}${path}`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  });
  if (!r.ok) throw new Error(`Supabase ${path} → ${r.status}: ${await r.text()}`);
  return r.json();
}

async function sbRpc(fn: string, body: Record<string, unknown>): Promise<unknown> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`Supabase rpc/${fn} → ${r.status}: ${await r.text()}`);
  return r.json();
}

async function embedQuery(text: string): Promise<number[]> {
  const apiKey = envOrThrow("VOYAGE_API_KEY");
  const r = await fetch(VOYAGE_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ input: [text], model: "voyage-3", input_type: "query" }),
  });
  if (!r.ok) throw new Error(`Voyage error ${r.status}: ${await r.text()}`);
  const j = await r.json();
  return j.data[0].embedding;
}

function vectorLiteral(v: number[]): string {
  return "[" + v.map((n) => n.toFixed(6)).join(",") + "]";
}

// ─── Tool definitions ───────────────────────────────────────────────────────
const TOOLS = [
  {
    name: "search_knowledge_base",
    description:
      "Search Northbridge's prose knowledge base (handbook, policies, FAQs, course catalog, services pages, academic calendar) for any policy/process/services question. Returns the top-k most relevant passages with citations. Use for questions about rules, fees, scholarships, registration, exams, integrity, dining info, library services, etc.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "A focused natural-language question, e.g. 'what is the attendance requirement to sit a final exam?'" },
        top_k: { type: "integer", description: "Number of passages to retrieve (default 5, max 10)", minimum: 1, maximum: 10 },
        source: {
          type: "string",
          description: "Optional source filter to narrow retrieval",
          enum: ["handbook", "faq", "policy", "course_catalog", "academic_calendar", "services", "about"],
        },
      },
      required: ["query"],
    },
  },
  {
    name: "find_faculty",
    description:
      "Search Northbridge faculty by name (partial match), department, or college. Returns id, name, title, email, college, dept, research areas, office room, phone extension.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Partial faculty name (case-insensitive)" },
        department: { type: "string", description: "Exact department name, e.g. 'Computer Science'" },
        college: { type: "string", description: "Exact college name, e.g. 'College of Computing'" },
        limit: { type: "integer", description: "Max rows (default 10, max 25)", minimum: 1, maximum: 25 },
      },
    },
  },
  {
    name: "get_office_hours",
    description:
      "Get a faculty member's weekly office hours, including the room. Pass either faculty_id (preferred) or faculty_name (partial match — uses the first match).",
    input_schema: {
      type: "object",
      properties: {
        faculty_id: { type: "string", description: "Exact faculty UUID from find_faculty" },
        faculty_name: { type: "string", description: "Partial faculty name if you don't have the id" },
      },
    },
  },
  {
    name: "find_rooms",
    description:
      "Look up rooms by building code (e.g. 'COC', 'LIB', 'AUD') and/or room type ('lecture','lab','seminar','office','study','common','dining','library','auditorium','other'). Useful for 'where is the auditorium' or 'list CS labs'.",
    input_schema: {
      type: "object",
      properties: {
        building_code: { type: "string", description: "Three-letter building code" },
        room_type: { type: "string" },
        limit: { type: "integer", default: 10, minimum: 1, maximum: 25 },
      },
    },
  },
  {
    name: "get_dining_menu",
    description:
      "Look up dining menus and items at Northbridge outlets. Filter by outlet name (Main Cafeteria, Cha Bar, Library Café), day_of_week (0=Sunday … 6=Saturday), meal_type (breakfast/lunch/dinner/snack). Returns menu items with prices in PKR (price_pkr) and nutrition.",
    input_schema: {
      type: "object",
      properties: {
        outlet: { type: "string" },
        day_of_week: { type: "integer", minimum: 0, maximum: 6 },
        meal_type: { type: "string", enum: ["breakfast", "lunch", "dinner", "snack"] },
      },
    },
  },
  {
    name: "get_events",
    description:
      "List upcoming Northbridge events. Filter by category and/or date range.",
    input_schema: {
      type: "object",
      properties: {
        category: { type: "string", enum: ["academic", "career", "cultural", "sports", "club", "workshop", "other"] },
        after_date: { type: "string", description: "ISO date (YYYY-MM-DD); only events starting on/after this date" },
        limit: { type: "integer", default: 10, minimum: 1, maximum: 25 },
      },
    },
  },
  {
    name: "find_clubs",
    description:
      "List Northbridge clubs and societies, optionally filtered by category or partial name.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Partial club name (case-insensitive)" },
        category: { type: "string", enum: ["academic", "cultural", "sports", "community", "professional", "arts", "other"] },
        limit: { type: "integer", default: 10, minimum: 1, maximum: 25 },
      },
    },
  },
  {
    name: "get_library_info",
    description:
      "Return Quaid Central Library opening hours by day and a sample of available resources.",
    input_schema: { type: "object", properties: {} },
  },
];

// ─── Tool execution ─────────────────────────────────────────────────────────
type Citation = { slug: string; title: string; source: string };
type ToolResult = { result: unknown; citations?: Citation[] };

async function runTool(name: string, args: Record<string, unknown>): Promise<ToolResult> {
  switch (name) {
    case "search_knowledge_base": {
      const query = String(args.query ?? "");
      const top_k = Math.min(10, Math.max(1, Number(args.top_k ?? 5)));
      const source = args.source ? String(args.source) : null;
      const vec = await embedQuery(query);
      const rows = await sbRpc("match_kb_chunks", {
        query_embedding: vectorLiteral(vec),
        match_count: top_k,
        filter_source: source,
      }) as Array<Record<string, unknown>>;
      const citations: Citation[] = [];
      const seen = new Set<string>();
      for (const r of rows) {
        const slug = String(r.document_slug);
        if (!seen.has(slug)) {
          seen.add(slug);
          citations.push({ slug, title: String(r.document_title), source: String(r.document_source) });
        }
      }
      return {
        result: rows.map((r) => ({
          title: r.document_title,
          source: r.document_source,
          slug: r.document_slug,
          similarity: Number((r as { similarity: number }).similarity).toFixed(3),
          content: r.content,
        })),
        citations,
      };
    }

    case "find_faculty": {
      const params = new URLSearchParams();
      params.set("select", "id,full_name,title,email,college,department,research_areas,phone_extension,office_room_id");
      if (args.name)       params.append("full_name",  `ilike.%${escapeLike(String(args.name))}%`);
      if (args.department) params.append("department", `eq.${args.department}`);
      if (args.college)    params.append("college",    `eq.${args.college}`);
      params.set("limit", String(Math.min(25, Number(args.limit ?? 10))));
      const rows = await sbGet(`/rest/v1/faculty?${params}`);
      return { result: rows };
    }

    case "get_office_hours": {
      let facultyId = args.faculty_id ? String(args.faculty_id) : null;
      let facultyName: string | null = null;
      if (!facultyId && args.faculty_name) {
        const found = await sbGet(
          `/rest/v1/faculty?select=id,full_name&full_name=ilike.%25${encodeURIComponent(escapeLike(String(args.faculty_name)))}%25&limit=1`,
        ) as Array<{ id: string; full_name: string }>;
        if (found.length === 0) return { result: { hours: [], note: "No matching faculty found." } };
        facultyId = found[0].id;
        facultyName = found[0].full_name;
      }
      if (!facultyId) return { result: { hours: [], note: "Provide faculty_id or faculty_name." } };
      const hours = await sbGet(
        `/rest/v1/office_hours?select=day_of_week,start_time,end_time,notes,location_room_id&faculty_id=eq.${facultyId}&order=day_of_week`,
      );
      return { result: { faculty_id: facultyId, faculty_name: facultyName, hours } };
    }

    case "find_rooms": {
      const params = new URLSearchParams();
      params.set("select", "id,room_number,floor,room_type,capacity,av_equipment,notes,buildings(code,name)");
      if (args.building_code) {
        // join filter via buildings.code
        params.append("buildings.code", `eq.${args.building_code}`);
      }
      if (args.room_type)     params.append("room_type", `eq.${args.room_type}`);
      params.set("limit", String(Math.min(25, Number(args.limit ?? 10))));
      const rows = await sbGet(`/rest/v1/rooms?${params}`);
      return { result: rows };
    }

    case "get_dining_menu": {
      const params = new URLSearchParams();
      params.set("select", "day_of_week,meal_type,dining_outlets(name),dining_items(name,description,price_cents,calories,allergens,tags)");
      if (args.outlet)       params.append("dining_outlets.name", `eq.${args.outlet}`);
      if (args.day_of_week !== undefined) params.append("day_of_week", `eq.${args.day_of_week}`);
      if (args.meal_type)    params.append("meal_type", `eq.${args.meal_type}`);
      params.set("limit", "20");
      const menus = await sbGet(`/rest/v1/dining_menus?${params}`) as Array<Record<string, unknown>>;
      // Convert price_cents → price_pkr for clarity
      for (const m of menus) {
        const items = (m.dining_items as Array<Record<string, unknown>>) ?? [];
        for (const it of items) {
          if (typeof it.price_cents === "number") {
            it.price_pkr = it.price_cents / 100;
            delete it.price_cents;
          }
        }
      }
      return { result: menus };
    }

    case "get_events": {
      const params = new URLSearchParams();
      params.set("select", "title,description,category,start_at,end_at,location_text,organizer,rsvp_required,capacity");
      if (args.category)   params.append("category", `eq.${args.category}`);
      if (args.after_date) params.append("start_at", `gte.${args.after_date}`);
      params.set("order", "start_at.asc");
      params.set("limit", String(Math.min(25, Number(args.limit ?? 10))));
      const rows = await sbGet(`/rest/v1/events?${params}`);
      return { result: rows };
    }

    case "find_clubs": {
      const params = new URLSearchParams();
      params.set("select", "name,description,category,meeting_day,meeting_time,member_count,contact_email");
      if (args.name)     params.append("name", `ilike.%${escapeLike(String(args.name))}%`);
      if (args.category) params.append("category", `eq.${args.category}`);
      params.set("order", "member_count.desc");
      params.set("limit", String(Math.min(25, Number(args.limit ?? 10))));
      const rows = await sbGet(`/rest/v1/clubs?${params}`);
      return { result: rows };
    }

    case "get_library_info": {
      const [hours, sample] = await Promise.all([
        sbGet("/rest/v1/library_hours?select=day_of_week,start_time,end_time,notes&order=day_of_week"),
        sbGet("/rest/v1/library_resources?select=title,resource_type,location,is_reservable&limit=10"),
      ]);
      return { result: { hours, sample_resources: sample } };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function escapeLike(s: string): string {
  return s.replace(/[%_]/g, (c) => "\\" + c);
}

// ─── Anthropic call ─────────────────────────────────────────────────────────
async function callClaude(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const apiKey = envOrThrow("ANTHROPIC_API_KEY");
  const r = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`Anthropic ${r.status}: ${await r.text()}`);
  return r.json();
}

// ─── System prompt ──────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are the Northbridge University AI assistant. Northbridge is a HEC-recognized private university in Karachi, Pakistan, founded in 1962 with eight colleges (Computing, Engineering, Business, Sciences, Humanities, Arts, Health Sciences, Law).

Today's date is ${new Date().toISOString().slice(0, 10)}. The current term is Spring 2026 (20 January – 30 May 2026).

You answer student, faculty, and visitor questions about Northbridge by retrieving information from two sources:
- A vector-searchable prose knowledge base (handbooks, policies, FAQs, course catalog, services, academic calendar) — use \`search_knowledge_base\`.
- Structured tables for faculty, rooms, office hours, dining menus, events, clubs, and library info — use the dedicated find_/get_ tools.

Operating principles:
1. Always ground answers in retrieved data — call the appropriate tool before answering anything that isn't trivial small-talk. For policies/processes use \`search_knowledge_base\`. For "who/where/when does X happen" use the structured tools.
2. Prefer combining tools: e.g. for "what are Dr. Ahmed's office hours?", call \`find_faculty\` then \`get_office_hours\`.
3. If the tools return nothing relevant, say so plainly — don't fabricate. Suggest who/where the user could ask instead (Registrar, Office of Student Affairs, etc.).
4. Be concise and direct. Use Pakistani Rupees (PKR) for amounts; use 24-hour times when timetables are involved.
5. Never invent faculty names, course codes, room numbers, or policies. Quote verbatim from retrieved passages when stating specific rules or numbers.`;

type ChatMessage = { role: "user" | "assistant"; content: string };

// ─── Server ─────────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, summary, generateSummary } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return json({ error: "messages[] is required" }, 400);
    }

    // Path 1 — rolling-summary generation (cheap, no tools).
    if (generateSummary) {
      const conversationText = messages
        .map((m: ChatMessage) => `${m.role}: ${m.content}`)
        .join("\n");
      const data = await callClaude({
        model: MODEL,
        max_tokens: 256,
        system: "You summarize conversations concisely.",
        messages: [
          {
            role: "user",
            content: `Summarize this conversation in 2-3 short sentences, capturing key topics and important facts.\n\n${conversationText}`,
          },
        ],
      });
      const summaryContent = (data.content as Array<{ text?: string }>)?.[0]?.text ?? "";
      return json({ summary: summaryContent });
    }

    // Path 2 — main agent loop.
    const recent = (messages as ChatMessage[]).slice(-6).map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    }));
    if (recent[0]?.role !== "user") {
      recent.unshift({ role: "user", content: "(continuing)" });
    }

    const sys = summary
      ? `${SYSTEM_PROMPT}\n\nPrior conversation summary: ${summary}`
      : SYSTEM_PROMPT;

    // Build the running message thread for the tool loop.
    type AnthropicContent = unknown;
    const thread: Array<{ role: string; content: AnthropicContent }> = [...recent];

    const allCitations: Citation[] = [];
    let finalText = "";

    for (let turn = 0; turn < MAX_TOOL_TURNS; turn++) {
      const data = await callClaude({
        model: MODEL,
        max_tokens: 1500,
        system: sys,
        tools: TOOLS,
        messages: thread,
      }) as { content: Array<Record<string, unknown>>; stop_reason: string };

      // Append the assistant's response to the thread (verbatim — needed for tool_use IDs).
      thread.push({ role: "assistant", content: data.content });

      if (data.stop_reason !== "tool_use") {
        // Extract text block(s)
        finalText = data.content
          .filter((b) => b.type === "text")
          .map((b) => String(b.text ?? ""))
          .join("\n")
          .trim();
        break;
      }

      // Run any tool_use blocks and assemble tool_result content for the next user turn.
      const toolUses = data.content.filter((b) => b.type === "tool_use") as Array<{
        id: string;
        name: string;
        input: Record<string, unknown>;
      }>;

      const toolResults: Array<Record<string, unknown>> = [];
      for (const tu of toolUses) {
        try {
          const { result, citations } = await runTool(tu.name, tu.input);
          if (citations) {
            for (const c of citations) {
              if (!allCitations.some((x) => x.slug === c.slug)) allCitations.push(c);
            }
          }
          toolResults.push({
            type: "tool_result",
            tool_use_id: tu.id,
            content: JSON.stringify(result).slice(0, 12000),
          });
        } catch (err) {
          toolResults.push({
            type: "tool_result",
            tool_use_id: tu.id,
            is_error: true,
            content: err instanceof Error ? err.message : String(err),
          });
        }
      }

      thread.push({ role: "user", content: toolResults });
    }

    if (!finalText) {
      finalText = "Sorry — I couldn't finish that lookup. Please try rephrasing your question.";
    }

    return json({
      message: { content: finalText, citations: allCitations },
      done: true,
    });
  } catch (error) {
    console.error("chat-ollama error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return json({ error: errorMessage }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
