// COMSATS University Islamabad AI assistant — tool-using Claude agent.
//
// The model has access to a vector-searchable knowledge base (handbook,
// policies, FAQs, course catalog) plus typed query tools over the seeded
// COMSATS dataset (faculty, rooms, dining, events, clubs, library).
// It runs a tool loop until it produces a final answer, then returns the
// answer along with the citations it consulted.
//
// Caller identity (student/teacher) is resolved from the user's JWT in the
// Authorization header so the assistant can scope its replies to the user's
// role and refuse cross-role data leaks.

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
//
// Tools without a `roles` array are available to everyone (including
// unauthenticated callers). Personal-data tools (the `get_my_*` family) are
// gated to the caller whose data they return — students get their own
// academic records, teachers get the courses they teach. The tool list shown
// to the model is filtered per-request based on `caller.role`.

type ToolDef = {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
  roles?: Array<"student" | "teacher" | "admin" | "anonymous">;
};

const TOOLS: ToolDef[] = [
  {
    name: "search_knowledge_base",
    description:
      "Search the COMSATS University Islamabad prose knowledge base (handbook, policies, FAQs, course catalog, services pages, academic calendar) for any policy/process/services question. Returns the top-k most relevant passages with citations. Use for questions about rules, fees, scholarships, registration, exams, integrity, dining info, library services, etc.",
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
      "Search COMSATS faculty by name (partial match), department, or college. Returns id, name, title, email, college, dept, research areas, office room, phone extension.",
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
      "Look up dining menus and items at COMSATS outlets. Filter by outlet name (Main Cafeteria, Cha Bar, Library Café), day_of_week (0=Sunday … 6=Saturday), meal_type (breakfast/lunch/dinner/snack). Returns menu items with prices in PKR (price_pkr) and nutrition.",
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
      "List upcoming COMSATS events. Filter by category and/or date range.",
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
      "List COMSATS clubs and societies, optionally filtered by category or partial name.",
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

  // ─── Personal student data ────────────────────────────────────────────────
  {
    name: "get_my_courses",
    description:
      "Return the courses the *signed-in student* is currently enrolled in. Use this whenever the user asks about their schedule, classes, courses they're taking, registered courses, etc.",
    input_schema: { type: "object", properties: {} },
    roles: ["student"],
  },
  {
    name: "get_my_attendance",
    description:
      "Return the signed-in student's attendance summary across their enrolled courses (total classes, presents, absents, lates, percentage). Optionally filter to one course.",
    input_schema: {
      type: "object",
      properties: {
        course_code: { type: "string", description: "Optional course code (e.g. 'DES301'). Omit to get a summary for all enrolled courses." },
      },
    },
    roles: ["student"],
  },
  {
    name: "get_my_marks",
    description:
      "Return the signed-in student's graded and ungraded assessments with marks obtained vs total marks. Use for questions like 'how am I doing in X?' or 'what's my grade in CS101?'.",
    input_schema: {
      type: "object",
      properties: {
        course_code: { type: "string", description: "Optional course code filter." },
      },
    },
    roles: ["student"],
  },
  {
    name: "get_my_assignments",
    description:
      "Return assignments for the signed-in student's enrolled courses with derived status (due, submitted, overdue, graded). Use for 'what's due', 'pending assignments', 'what did I miss', etc.",
    input_schema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["due", "submitted", "overdue", "graded", "all"], description: "Default 'all'." },
        course_code: { type: "string" },
      },
    },
    roles: ["student"],
  },
  {
    name: "get_my_schedule",
    description:
      "Return the signed-in student's weekly class timetable (course, day, time, room) across enrolled courses. Optionally filter to one weekday (0=Sunday … 6=Saturday).",
    input_schema: {
      type: "object",
      properties: {
        day_of_week: { type: "integer", minimum: 0, maximum: 6 },
      },
    },
    roles: ["student"],
  },

  // ─── Personal teacher data ────────────────────────────────────────────────
  {
    name: "get_my_taught_courses",
    description:
      "Return the courses the *signed-in teacher* teaches. Use for 'my courses', 'classes I teach'.",
    input_schema: { type: "object", properties: {} },
    roles: ["teacher"],
  },
  {
    name: "get_class_marks_summary",
    description:
      "Return aggregate marks statistics (count submitted, average, min, max) per assessment for a course the signed-in teacher teaches. Refuses if the caller does not own the course.",
    input_schema: {
      type: "object",
      properties: {
        course_code: { type: "string" },
      },
      required: ["course_code"],
    },
    roles: ["teacher"],
  },
];

// ─── Tool execution ─────────────────────────────────────────────────────────
type Citation = { slug: string; title: string; source: string };
type ToolResult = { result: unknown; citations?: Citation[] };

async function runTool(
  name: string,
  args: Record<string, unknown>,
  caller: CallerContext,
): Promise<ToolResult> {
  // Defense in depth: even if the model somehow calls a tool outside the
  // filtered list, refuse if the caller's role isn't allowed.
  const def = TOOLS.find((t) => t.name === name);
  if (def?.roles && !def.roles.includes(caller.role)) {
    return {
      result: {
        error: `${name} requires ${def.roles.join(" or ")} role; caller is ${caller.role}.`,
      },
    };
  }

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

    // ─── Personal student data ─────────────────────────────────────────────
    case "get_my_courses": {
      const userId = requireUserId(caller);
      const enrollments = await sbGet(
        `/rest/v1/course_enrollments?select=course_code,enrolled_at&student_id=eq.${userId}`,
      ) as Array<{ course_code: string; enrolled_at: string }>;
      if (enrollments.length === 0) return { result: { courses: [] } };
      const codes = enrollments.map((e) => e.course_code);
      const courses = await sbGet(
        `/rest/v1/courses?select=course_code,course_name,credits,department,semester_number&course_code=in.(${codes.map(encodeURIComponent).join(",")})`,
      );
      return { result: { courses } };
    }

    case "get_my_attendance": {
      const userId = requireUserId(caller);
      const filter = args.course_code ? `&course_code=eq.${encodeURIComponent(String(args.course_code))}` : "";
      const rows = await sbGet(
        `/rest/v1/attendance?select=course_code,date,status&student_id=eq.${userId}${filter}&order=date.desc`,
      ) as Array<{ course_code: string; date: string; status: string }>;
      const summaryMap = new Map<string, { total: number; present: number; absent: number; late: number }>();
      for (const r of rows) {
        const s = summaryMap.get(r.course_code) ?? { total: 0, present: 0, absent: 0, late: 0 };
        s.total += 1;
        if (r.status === "present") s.present += 1;
        else if (r.status === "absent") s.absent += 1;
        else if (r.status === "late") s.late += 1;
        summaryMap.set(r.course_code, s);
      }
      const summary = Array.from(summaryMap.entries()).map(([course_code, s]) => ({
        course_code,
        total: s.total,
        present: s.present,
        absent: s.absent,
        late: s.late,
        percentage: s.total ? Math.round((s.present / s.total) * 1000) / 10 : 0,
      }));
      return { result: { summary, recent: rows.slice(0, 10) } };
    }

    case "get_my_marks": {
      const userId = requireUserId(caller);
      const filter = args.course_code ? `&assessments.course_code=eq.${encodeURIComponent(String(args.course_code))}` : "";
      const rows = await sbGet(
        `/rest/v1/student_marks?select=marks_obtained,remarks,assessments(course_code,course_name,assessment_type,title,total_marks,is_marks_finalized)&student_id=eq.${userId}${filter}`,
      ) as Array<{
        marks_obtained: number | null;
        remarks: string | null;
        assessments: { course_code: string; course_name: string; assessment_type: string; title: string; total_marks: number; is_marks_finalized: boolean } | null;
      }>;
      const flat = rows
        .filter((r) => r.assessments)
        .map((r) => ({
          course_code: r.assessments!.course_code,
          course_name: r.assessments!.course_name,
          assessment_type: r.assessments!.assessment_type,
          title: r.assessments!.title,
          total_marks: r.assessments!.total_marks,
          marks_obtained: r.marks_obtained,
          finalized: r.assessments!.is_marks_finalized,
          remarks: r.remarks,
        }));
      return { result: { marks: flat } };
    }

    case "get_my_assignments": {
      const userId = requireUserId(caller);
      const enrollments = await sbGet(
        `/rest/v1/course_enrollments?select=course_code&student_id=eq.${userId}`,
      ) as Array<{ course_code: string }>;
      if (enrollments.length === 0) return { result: { assignments: [] } };
      const codes = enrollments.map((e) => e.course_code);
      const courseFilter = args.course_code
        ? `course_code=eq.${encodeURIComponent(String(args.course_code))}`
        : `course_code=in.(${codes.map(encodeURIComponent).join(",")})`;
      const assessments = await sbGet(
        `/rest/v1/assessments?select=id,course_code,course_name,assessment_type,title,total_marks,schedule_start,schedule_end,is_marks_finalized&is_online_quiz=eq.false&${courseFilter}&order=schedule_end.desc`,
      ) as Array<{
        id: string; course_code: string; course_name: string; assessment_type: string;
        title: string; total_marks: number; schedule_start: string | null;
        schedule_end: string | null; is_marks_finalized: boolean;
      }>;
      const marks = await sbGet(
        `/rest/v1/student_marks?select=assessment_id,marks_obtained,submission_file_path&student_id=eq.${userId}`,
      ) as Array<{ assessment_id: string; marks_obtained: number | null; submission_file_path: string | null }>;
      const marksByAssessment = new Map(marks.map((m) => [m.assessment_id, m]));
      const now = Date.now();
      const items = assessments.map((a) => {
        const mark = marksByAssessment.get(a.id);
        let status: "due" | "submitted" | "overdue" | "graded";
        if (mark && mark.marks_obtained !== null) status = "graded";
        else if (mark) status = "submitted";
        else if (a.schedule_end && new Date(a.schedule_end).getTime() < now) status = "overdue";
        else status = "due";
        return {
          course_code: a.course_code,
          course_name: a.course_name,
          assessment_type: a.assessment_type,
          title: a.title,
          total_marks: a.total_marks,
          due_at: a.schedule_end,
          status,
          marks_obtained: mark?.marks_obtained ?? null,
        };
      });
      const wantedStatus = String(args.status ?? "all");
      const filtered = wantedStatus === "all" ? items : items.filter((it) => it.status === wantedStatus);
      return { result: { assignments: filtered } };
    }

    case "get_my_schedule": {
      const userId = requireUserId(caller);
      const enrollments = await sbGet(
        `/rest/v1/course_enrollments?select=course_code&student_id=eq.${userId}`,
      ) as Array<{ course_code: string }>;
      if (enrollments.length === 0) return { result: { schedule: [] } };
      const codes = enrollments.map((e) => e.course_code);
      let q = `/rest/v1/timetable?select=course_code,course_name,day_of_week,start_time,end_time,room&course_code=in.(${codes.map(encodeURIComponent).join(",")})&order=day_of_week.asc,start_time.asc`;
      if (args.day_of_week !== undefined) q += `&day_of_week=eq.${Number(args.day_of_week)}`;
      const rows = await sbGet(q);
      return { result: { schedule: rows } };
    }

    // ─── Personal teacher data ─────────────────────────────────────────────
    case "get_my_taught_courses": {
      const userId = requireUserId(caller);
      const rows = await sbGet(
        `/rest/v1/teacher_courses?select=course_code,course_name&teacher_id=eq.${userId}`,
      );
      return { result: { courses: rows } };
    }

    case "get_class_marks_summary": {
      const userId = requireUserId(caller);
      const courseCode = String(args.course_code ?? "");
      if (!courseCode) return { result: { error: "course_code is required." } };
      // Verify the caller actually teaches this course.
      const taught = await sbGet(
        `/rest/v1/teacher_courses?select=course_code&teacher_id=eq.${userId}&course_code=eq.${encodeURIComponent(courseCode)}&limit=1`,
      ) as Array<unknown>;
      if (taught.length === 0) {
        return { result: { error: `You don't teach ${courseCode}.` } };
      }
      const assessments = await sbGet(
        `/rest/v1/assessments?select=id,title,assessment_type,total_marks&course_code=eq.${encodeURIComponent(courseCode)}&teacher_id=eq.${userId}`,
      ) as Array<{ id: string; title: string; assessment_type: string; total_marks: number }>;
      const ids = assessments.map((a) => a.id);
      if (ids.length === 0) return { result: { summary: [] } };
      const marks = await sbGet(
        `/rest/v1/student_marks?select=assessment_id,marks_obtained&assessment_id=in.(${ids.map(encodeURIComponent).join(",")})`,
      ) as Array<{ assessment_id: string; marks_obtained: number | null }>;
      const summary = assessments.map((a) => {
        const submitted = marks.filter((m) => m.assessment_id === a.id);
        const graded = submitted.filter((m) => m.marks_obtained !== null) as Array<{ assessment_id: string; marks_obtained: number }>;
        const scores = graded.map((m) => Number(m.marks_obtained));
        const avg = scores.length ? scores.reduce((s, n) => s + n, 0) / scores.length : null;
        return {
          assessment_id: a.id,
          title: a.title,
          assessment_type: a.assessment_type,
          total_marks: a.total_marks,
          submitted_count: submitted.length,
          graded_count: graded.length,
          average: avg !== null ? Math.round(avg * 10) / 10 : null,
          min: scores.length ? Math.min(...scores) : null,
          max: scores.length ? Math.max(...scores) : null,
        };
      });
      return { result: { summary } };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function escapeLike(s: string): string {
  return s.replace(/[%_]/g, (c) => "\\" + c);
}

function requireUserId(caller: CallerContext): string {
  if (!caller.userId) {
    throw new Error("This tool requires an authenticated caller.");
  }
  return caller.userId;
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
function buildSystemPrompt(caller: CallerContext): string {
  const who = caller.role === "anonymous"
    ? "an unauthenticated visitor"
    : `a signed-in ${caller.role}${caller.username ? ` (${caller.username})` : ""}`;

  const roleScope = caller.role === "teacher"
    ? `The caller is a teacher. You have personal-data tools for them: \`get_my_taught_courses\`, \`get_class_marks_summary\`. You may also use the campus tools. Do NOT reveal an individual student's private grades or submissions verbatim — only aggregate summaries via \`get_class_marks_summary\`. If the caller asks for one student's record, decline and direct them to the teacher portal's gradebook view.`
    : caller.role === "student"
      ? `The caller is a student. You have personal-data tools that ALWAYS scope to this caller's own records: \`get_my_courses\`, \`get_my_schedule\`, \`get_my_attendance\`, \`get_my_marks\`, \`get_my_assignments\`. CALL these tools whenever the user asks about their courses, schedule, attendance, marks, or assignments — never say "I don't have access" without trying the relevant tool first. Do NOT reveal other students' records or any teacher-only information. If asked, decline and explain those views are restricted to staff.`
      : caller.role === "admin"
        ? `The caller is an admin. Answer their questions normally, but still avoid fabricating details that aren't in the knowledge base.`
        : `The caller is unauthenticated. Stick to public information about the university — admissions, fees published in the handbook, campus facilities, public events. Decline anything that requires a logged-in identity. You do NOT have access to any personal academic data here.`;

  return `You are the COMSATS University Islamabad student-portal AI assistant. COMSATS University Islamabad (CUI) is an HEC-recognized public-sector university in Pakistan with multiple campuses (Islamabad, Abbottabad, Lahore, Attock, Vehari, Sahiwal, Wah, and the Virtual campus). The user is currently using the COMSATS Student Portal app.

Today's date is ${new Date().toISOString().slice(0, 10)}.

Caller: you are talking to ${who}. ${roleScope}

You answer questions about COMSATS by retrieving information from three sources:
- A vector-searchable prose knowledge base (handbooks, policies, FAQs, course catalog, services, academic calendar) — use \`search_knowledge_base\`.
- Structured tables for faculty, rooms, office hours, dining menus, events, clubs, and library info — use the dedicated find_/get_ tools.
- The caller's *own* academic record (only available when signed in) — use the role-scoped \`get_my_*\` tools described above.

Operating principles:
1. Always ground answers in retrieved data — call the appropriate tool before answering anything that isn't trivial small-talk. For policies/processes use \`search_knowledge_base\`. For "who/where/when does X happen" use the structured tools. For "my courses / my marks / what's due / my schedule" call the matching \`get_my_*\` tool first; do not refuse with "I don't have access" before attempting the tool.
2. Prefer combining tools: e.g. for "what are Dr. Ahmed's office hours?", call \`find_faculty\` then \`get_office_hours\`. For "how am I doing in Design Studio?", call \`get_my_marks\` and \`get_my_attendance\` with the matching course code.
3. If the tools return nothing relevant, say so plainly — don't fabricate. Suggest who/where the user could ask instead (Registrar, Office of Student Affairs, etc.).
4. Be concise and direct. Use Pakistani Rupees (PKR) for amounts; use 24-hour times when timetables are involved.
5. Never invent faculty names, course codes, room numbers, or policies. Quote verbatim from retrieved passages when stating specific rules or numbers.
6. Never use emojis, decorative icons, or emoji-bullet lists in your replies. Plain prose and standard markdown bullets ("-") only.
7. Refer to the institution as "COMSATS" or "COMSATS University Islamabad" — never as "Northbridge" or any other name. If a knowledge-base passage still says "Northbridge", silently treat it as a stale label for COMSATS and present the information under the correct name.
8. Respect the role-scoping rules above. If a request would require revealing data outside the caller's role, refuse politely and point them at the appropriate portal view.`;
}

type ChatMessage = { role: "user" | "assistant"; content: string };

// ─── Caller identity ────────────────────────────────────────────────────────
type Role = "student" | "teacher" | "admin" | "anonymous";
type CallerContext = { role: Role; userId?: string; username?: string };

async function resolveCaller(req: Request): Promise<CallerContext> {
  const auth = req.headers.get("Authorization");
  if (!auth || !auth.toLowerCase().startsWith("bearer ")) {
    return { role: "anonymous" };
  }
  // Validate the JWT against Supabase Auth — this returns 200 only for a real user.
  const userResp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SERVICE_KEY, Authorization: auth },
  });
  if (!userResp.ok) return { role: "anonymous" };
  const user = await userResp.json() as {
    id?: string;
    user_metadata?: { username?: string; portal_type?: string };
  };
  if (!user?.id) return { role: "anonymous" };

  // Look up the authoritative role from user_roles. Fall back to user_metadata.portal_type.
  let role: Role = "student";
  try {
    const rolesResp = await fetch(
      `${SUPABASE_URL}/rest/v1/user_roles?user_id=eq.${user.id}&select=role`,
      { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } },
    );
    if (rolesResp.ok) {
      const rows = await rolesResp.json() as Array<{ role: string }>;
      const r = rows.map((x) => x.role);
      if (r.includes("admin")) role = "admin";
      else if (r.includes("teacher")) role = "teacher";
      else if (r.includes("user") || r.length === 0) role = "student";
    }
  } catch { /* fall through to metadata fallback */ }

  if (role === "student" && user.user_metadata?.portal_type === "teacher") {
    role = "teacher";
  }

  return { role, userId: user.id, username: user.user_metadata?.username };
}

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

    const caller = await resolveCaller(req);
    const basePrompt = buildSystemPrompt(caller);
    const sys = summary
      ? `${basePrompt}\n\nPrior conversation summary: ${summary}`
      : basePrompt;

    // Filter the tool list down to what this caller's role is allowed to
    // call. Strip the local `roles` field before handing the list to Claude.
    const allowedTools = TOOLS
      .filter((t) => !t.roles || t.roles.includes(caller.role))
      .map(({ roles: _roles, ...t }) => t);

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
        tools: allowedTools,
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
          const { result, citations } = await runTool(tu.name, tu.input, caller);
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
