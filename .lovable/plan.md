

## Seed Database: 5 Batches × 50 Students with FA/SP Convention

### Batch Structure

Each academic year has two intakes: Fall (FA) and Spring (SP).

```text
Batch           Roll Format          Current Semester   Status
────────────────────────────────────────────────────────────────
FA22-BCS        FA22-BCS-001..050    7th (Fall 25)      Senior
SP23-BCS        SP23-BCS-001..050    6th (Spring 26)    Senior
FA23-BCS        FA23-BCS-001..050    5th (Fall 25)      Mid
SP24-BCS        SP24-BCS-001..050    4th (Spring 26)    Mid
FA24-BCS        FA24-BCS-001..050    3rd (Fall 25)      Junior
```

FA22 enrolled Fall 2022 (semester 1), now in semester 7. SP23 enrolled Spring 2023 (semester 1), now in semester 6. And so on.

### Courses by Semester Level

- **Semesters 1-2** (FA24): Intro Programming, Calculus, Physics, English, DLD
- **Semesters 3-4** (SP24): DSA, Discrete Math, OOP, Linear Algebra, DB Systems
- **Semesters 5-6** (FA23, SP23): OS, Networks, AI, SE, Algorithms, Statistics
- **Semesters 7-8** (FA22): Compiler, FYP, Distributed Systems, Machine Learning, Electives

### Database Changes

**1. New migration — `courses` table**

```sql
CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_code text UNIQUE NOT NULL,
  course_name text NOT NULL,
  credits integer NOT NULL DEFAULT 3,
  department text NOT NULL DEFAULT 'CS',
  semester_number integer NOT NULL,
  created_at timestamptz DEFAULT now()
);
-- RLS: authenticated SELECT only
```

**2. Rewrite `seed-data` edge function**

- Delete all `@test.edu` users and cascading data
- Create 10 teachers (`teacher1@test.edu` ... `teacher10@test.edu`, password `Test@123`)
- Create 250 students across 5 batches (50 each), emails like `fa22bcs001@test.edu`
- Insert ~30 courses, enrollments, assessments (5 per course), marks, attendance (20 sessions/course), and timetable entries
- Batch inserts to avoid timeouts

### Data Volume

| Entity | Count |
|--------|-------|
| Teachers | 10 |
| Students | 250 |
| Courses | ~30 |
| Enrollments | ~1,250 |
| Assessments | ~150 |
| Student marks | ~6,250 |
| Attendance | ~25,000 |
| Timetable | ~90 |

### No frontend changes needed

Existing pages query the same tables and will display seeded data automatically.

