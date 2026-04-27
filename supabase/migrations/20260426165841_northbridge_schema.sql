-- ============================================================================
-- Northbridge University reference dataset (Session 1: structured tables)
--
-- These tables hold the seeded fictional-university data the RAG chatbot
-- queries. They are decoupled from auth.users so seed rows can exist without
-- creating Supabase Auth accounts; an optional auth_user_id links a real
-- logged-in user to a seeded record when needed.
-- ============================================================================

-- People ---------------------------------------------------------------------

CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  roll_number TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  program TEXT NOT NULL,
  college TEXT NOT NULL,
  department TEXT NOT NULL,
  year_of_study INTEGER NOT NULL CHECK (year_of_study BETWEEN 1 AND 6),
  enrollment_year INTEGER NOT NULL,
  gpa NUMERIC(3,2),
  date_of_birth DATE,
  hometown TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_students_program ON public.students(program);
CREATE INDEX idx_students_year ON public.students(year_of_study);
CREATE INDEX idx_students_college ON public.students(college);

CREATE TABLE public.faculty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  title TEXT NOT NULL CHECK (title IN ('Lecturer','Assistant Professor','Associate Professor','Professor','Distinguished Professor','Dean')),
  email TEXT NOT NULL UNIQUE,
  college TEXT NOT NULL,
  department TEXT NOT NULL,
  research_areas TEXT[] NOT NULL DEFAULT '{}',
  bio TEXT,
  office_room_id UUID,
  joined_year INTEGER,
  phone_extension TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_faculty_college ON public.faculty(college);
CREATE INDEX idx_faculty_dept ON public.faculty(department);

-- Facilities -----------------------------------------------------------------

CREATE TABLE public.buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  floors INTEGER NOT NULL,
  year_built INTEGER,
  address TEXT,
  description TEXT,
  has_elevator BOOLEAN NOT NULL DEFAULT true,
  has_wheelchair_access BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  room_number TEXT NOT NULL,
  floor INTEGER NOT NULL,
  room_type TEXT NOT NULL CHECK (room_type IN ('lecture','lab','seminar','office','study','common','dining','library','auditorium','other')),
  capacity INTEGER,
  av_equipment TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(building_id, room_number)
);

CREATE INDEX idx_rooms_building ON public.rooms(building_id);
CREATE INDEX idx_rooms_type ON public.rooms(room_type);

ALTER TABLE public.faculty
  ADD CONSTRAINT faculty_office_fk
  FOREIGN KEY (office_room_id) REFERENCES public.rooms(id) ON DELETE SET NULL;

CREATE TABLE public.office_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id UUID NOT NULL REFERENCES public.faculty(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location_room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  notes TEXT,
  CHECK (end_time > start_time)
);

CREATE INDEX idx_office_hours_faculty ON public.office_hours(faculty_id);

-- Dining ---------------------------------------------------------------------

CREATE TABLE public.dining_outlets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  building_id UUID REFERENCES public.buildings(id) ON DELETE SET NULL,
  description TEXT,
  cuisine_type TEXT,
  opening_hours JSONB NOT NULL DEFAULT '{}'::jsonb,
  accepts_meal_plan BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.dining_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id UUID NOT NULL REFERENCES public.dining_outlets(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast','lunch','dinner','snack')),
  UNIQUE(outlet_id, day_of_week, meal_type)
);

CREATE TABLE public.dining_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id UUID NOT NULL REFERENCES public.dining_menus(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL,
  calories INTEGER,
  protein_g NUMERIC(5,1),
  carbs_g NUMERIC(5,1),
  fat_g NUMERIC(5,1),
  allergens TEXT[] NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  source_fdc_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_dining_items_menu ON public.dining_items(menu_id);

-- Campus life ----------------------------------------------------------------

CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('academic','career','cultural','sports','club','workshop','other')),
  start_at TIMESTAMP WITH TIME ZONE NOT NULL,
  end_at TIMESTAMP WITH TIME ZONE NOT NULL,
  location_room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  location_text TEXT,
  organizer TEXT,
  rsvp_required BOOLEAN NOT NULL DEFAULT false,
  capacity INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CHECK (end_at > start_at)
);

CREATE INDEX idx_events_start ON public.events(start_at);

CREATE TABLE public.clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('academic','cultural','sports','community','professional','arts','other')),
  faculty_advisor_id UUID REFERENCES public.faculty(id) ON DELETE SET NULL,
  meeting_room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  meeting_day INTEGER CHECK (meeting_day BETWEEN 0 AND 6),
  meeting_time TIME,
  founded_year INTEGER,
  member_count INTEGER NOT NULL DEFAULT 0,
  contact_email TEXT
);

CREATE TABLE public.club_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('president','vice_president','secretary','treasurer','member')),
  joined_at DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE(club_id, student_id)
);

-- Library --------------------------------------------------------------------

CREATE TABLE public.library_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('book','journal','database','equipment','study_room','other')),
  description TEXT,
  location TEXT,
  is_reservable BOOLEAN NOT NULL DEFAULT false,
  quantity INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE public.library_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week INTEGER NOT NULL UNIQUE CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  notes TEXT
);

-- Read-only public access for chatbot retrieval ------------------------------
-- Writes are restricted; service role bypasses RLS for seeding.

ALTER TABLE public.students          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buildings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.office_hours      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dining_outlets    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dining_menus      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dining_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_members      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_hours     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read" ON public.students          FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read" ON public.faculty           FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read" ON public.buildings         FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read" ON public.rooms             FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read" ON public.office_hours      FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read" ON public.dining_outlets    FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read" ON public.dining_menus      FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read" ON public.dining_items      FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read" ON public.events            FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read" ON public.clubs             FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read" ON public.club_members      FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read" ON public.library_resources FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read" ON public.library_hours     FOR SELECT TO authenticated USING (true);
