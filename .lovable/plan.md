

## 4.6 Deployment and Testing Environment

Here's the documentation written for your webapp, matching the tone and structure of the sample:

---

### 4.6.1 Deployment Environment

- Lovable cloud platform used for development, testing, and hosting the complete system.
- Web application tested through browser preview (desktop and mobile viewports).
- Backend functions tested via Supabase Edge Function logs and direct invocation.

### 4.6.2 Frontend (Web Application)

- **Framework:** React 18.3 with TypeScript
- **Build Tool:** Vite 5.x (SWC-based compilation)
- **Styling:** Tailwind CSS 3.x with shadcn/ui component library
- **Routing:** React Router DOM 6.x
- **State Management:** TanStack React Query 5.x
- **Testing Environment:**
  - Lovable preview sandbox (live hot-reload)
  - Browser DevTools (Chrome/Edge)
  - Responsive testing via viewport simulation
- **Preview URL:** Served via Lovable's cloud preview infrastructure with instant deployment on each change.

### 4.6.3 Backend

- **Platform:** Supabase (managed via Lovable Cloud)
- **Runtime:** Deno (Supabase Edge Functions)
- **Database:** PostgreSQL (managed instance, Supabase-hosted)
- **Authentication:** Supabase Auth with email/password, role-based access via `user_roles` table
- **AI/ML Inference:**
  - Google Gemini 2.5 Flash (vision model) accessed via Lovable AI Gateway
  - Used for document verification and attendance screenshot parsing
  - No local model hosting required — inference handled through managed API endpoints
- **Edge Functions:**
  - `verify-document` — AI-powered document authenticity verification
  - `parse-attendance` — Vision-based attendance extraction from meeting screenshots
  - `generate-study-guide` — AI-generated study material
  - `generate-teacher-guide` — AI-generated teaching guides
  - `chat-ollama` — Conversational AI assistant
  - `seed-data` — Database seeding utility
- **Row-Level Security (RLS):** Enforced on all tables with role-based policies (`admin`, `teacher`, `user`)

### 4.6.4 Server Configuration

- Frontend and backend are hosted on the same cloud platform (Lovable Cloud) with automatic integration.
- CORS headers configured on all Edge Functions to allow cross-origin requests.
- AI models accessed remotely through the Lovable AI Gateway (`ai.gateway.lovable.dev`) — no local model storage or GPU required.
- Database tables created and managed through versioned SQL migrations in `supabase/migrations/`.
- JWT-based authentication enforced on most Edge Functions; `parse-attendance` configured for open access.

### 4.6.5 Cloud Hosting

- The system is fully cloud-hosted on Lovable Cloud (powered by Supabase infrastructure).
- No separate AWS, Azure, Firebase, or Render deployment required.
- The architecture supports future scaling through:
  - Supabase's managed PostgreSQL with automatic backups
  - Edge Function auto-scaling (Deno Deploy)
  - Supabase Storage for file/document uploads
  - Custom domain configuration for production deployment

### 4.6.6 Software Stack

**Frontend:**
- React 18.3 + TypeScript
- Vite 5.x (build tooling)
- Tailwind CSS 3.x
- shadcn/ui (Radix-based component library)
- React Router DOM 6.x
- TanStack React Query 5.x
- Recharts (data visualization)
- GSAP (animations)

**Backend:**
- Deno Runtime (Edge Functions)
- Supabase (PostgreSQL, Auth, Storage, Realtime)
- Lovable AI Gateway (Gemini 2.5 Flash)
- Row-Level Security policies
- SQL migrations (version-controlled)

**Tools & Dependencies:**
- Lovable Platform (development, preview, deployment)
- Git / GitHub (version control)
- Browser DevTools (debugging and testing)
- ESLint + TypeScript (code quality)
- Zod (runtime schema validation)
- React Hook Form (form management)

---

This is documentation only — no code changes needed. You can copy this directly into your report.

