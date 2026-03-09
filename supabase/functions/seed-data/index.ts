import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ── Name pools ──────────────────────────────────────────────────────────
const firstNames = [
  'Ahmed','Ali','Hassan','Usman','Bilal','Hamza','Saad','Zain','Faisal','Tariq',
  'Omar','Kamran','Shahid','Imran','Asif','Nabeel','Junaid','Waqas','Adeel','Fahad',
  'Sara','Ayesha','Fatima','Zainab','Hira','Amna','Sana','Noor','Maryam','Khadija',
  'Rabia','Iqra','Mehwish','Sidra','Rimsha','Bushra','Alina','Maham','Laiba','Anum',
  'Danish','Rizwan','Kashif','Shoaib','Nasir','Sajid','Waseem','Arshad','Tahir','Nadeem',
]

const lastNames = [
  'Khan','Ali','Ahmed','Malik','Raza','Shah','Hussain','Butt','Iqbal','Javed',
  'Tariq','Siddiqui','Qureshi','Mirza','Chaudhry','Aslam','Noor','Rehman','Sheikh','Abbasi',
  'Usman','Farooq','Saeed','Baig','Hashmi','Zaidi','Durrani','Yousuf','Niazi','Riaz',
]

const teacherNames = [
  'Dr. Asim Shahzad','Dr. Nadia Malik','Prof. Kamran Iqbal','Dr. Saba Hussain','Prof. Tariq Mehmood',
  'Dr. Farah Ahmed','Prof. Zafar Ali','Dr. Amina Sheikh','Prof. Rashid Khan','Dr. Hina Butt',
]

// ── Course definitions by semester ──────────────────────────────────────
const coursesBySemester: Record<number, { code: string; name: string; credits: number; dept: string }[]> = {
  1: [
    { code: 'CS101', name: 'Introduction to Programming', credits: 3, dept: 'CS' },
    { code: 'MATH101', name: 'Calculus I', credits: 3, dept: 'MATH' },
    { code: 'PHY101', name: 'Applied Physics', credits: 3, dept: 'PHY' },
    { code: 'ENG101', name: 'English Composition', credits: 3, dept: 'ENG' },
    { code: 'CS102', name: 'Digital Logic Design', credits: 3, dept: 'CS' },
  ],
  2: [
    { code: 'CS103', name: 'Object Oriented Programming', credits: 3, dept: 'CS' },
    { code: 'MATH102', name: 'Calculus II', credits: 3, dept: 'MATH' },
    { code: 'PHY102', name: 'Physics II', credits: 3, dept: 'PHY' },
    { code: 'ENG102', name: 'Communication Skills', credits: 3, dept: 'ENG' },
    { code: 'CS104', name: 'Discrete Structures', credits: 3, dept: 'CS' },
  ],
  3: [
    { code: 'CS201', name: 'Data Structures', credits: 3, dept: 'CS' },
    { code: 'CS202', name: 'Computer Organization', credits: 3, dept: 'CS' },
    { code: 'MATH201', name: 'Linear Algebra', credits: 3, dept: 'MATH' },
    { code: 'CS203', name: 'Database Systems', credits: 3, dept: 'CS' },
    { code: 'STAT201', name: 'Probability & Statistics', credits: 3, dept: 'MATH' },
  ],
  4: [
    { code: 'CS301', name: 'Algorithms', credits: 3, dept: 'CS' },
    { code: 'CS302', name: 'Software Engineering', credits: 3, dept: 'CS' },
    { code: 'CS303', name: 'Assembly Language', credits: 3, dept: 'CS' },
    { code: 'MATH301', name: 'Differential Equations', credits: 3, dept: 'MATH' },
    { code: 'MGT301', name: 'Entrepreneurship', credits: 3, dept: 'MGT' },
  ],
  5: [
    { code: 'CS401', name: 'Operating Systems', credits: 3, dept: 'CS' },
    { code: 'CS402', name: 'Computer Networks', credits: 3, dept: 'CS' },
    { code: 'CS403', name: 'Artificial Intelligence', credits: 3, dept: 'CS' },
    { code: 'CS404', name: 'Theory of Automata', credits: 3, dept: 'CS' },
    { code: 'CS405', name: 'Information Security', credits: 3, dept: 'CS' },
  ],
  6: [
    { code: 'CS501', name: 'Compiler Construction', credits: 3, dept: 'CS' },
    { code: 'CS502', name: 'Machine Learning', credits: 3, dept: 'CS' },
    { code: 'CS503', name: 'Web Engineering', credits: 3, dept: 'CS' },
    { code: 'CS504', name: 'Parallel & Distributed Computing', credits: 3, dept: 'CS' },
    { code: 'HUM401', name: 'Professional Ethics', credits: 3, dept: 'HUM' },
  ],
  7: [
    { code: 'CS601', name: 'Final Year Project I', credits: 3, dept: 'CS' },
    { code: 'CS602', name: 'Deep Learning', credits: 3, dept: 'CS' },
    { code: 'CS603', name: 'Cloud Computing', credits: 3, dept: 'CS' },
    { code: 'CS604', name: 'Mobile App Development', credits: 3, dept: 'CS' },
    { code: 'MGT501', name: 'Project Management', credits: 3, dept: 'MGT' },
  ],
  8: [
    { code: 'CS701', name: 'Final Year Project II', credits: 3, dept: 'CS' },
    { code: 'CS702', name: 'Natural Language Processing', credits: 3, dept: 'CS' },
    { code: 'CS703', name: 'Computer Vision', credits: 3, dept: 'CS' },
    { code: 'CS704', name: 'Blockchain Technology', credits: 3, dept: 'CS' },
    { code: 'HUM501', name: 'Technical Writing', credits: 3, dept: 'HUM' },
  ],
}

// ── Batch definitions ───────────────────────────────────────────────────
const batches = [
  { prefix: 'FA22', label: 'FA22-BCS', currentSemester: 7 },
  { prefix: 'SP23', label: 'SP23-BCS', currentSemester: 6 },
  { prefix: 'FA23', label: 'FA23-BCS', currentSemester: 5 },
  { prefix: 'SP24', label: 'SP24-BCS', currentSemester: 4 },
  { prefix: 'FA24', label: 'FA24-BCS', currentSemester: 3 },
]

const STUDENTS_PER_BATCH = 50
const TEST_DOMAIN = '@test.edu'
const TEST_PASSWORD = 'Test@123'

function pad(n: number, len = 3) { return String(n).padStart(len, '0') }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }
function randomScore(total: number, difficulty = 0.72) {
  const base = total * difficulty
  const vary = total * 0.25
  return Math.min(total, Math.max(0, Math.round(base + (Math.random() - 0.5) * vary * 2)))
}

// Batch insert helper
async function batchInsert(supabase: any, table: string, rows: any[], size = 50) {
  for (let i = 0; i < rows.length; i += size) {
    const chunk = rows.slice(i, i + size)
    const { error } = await supabase.from(table).insert(chunk)
    if (error) console.error(`Insert error on ${table} chunk ${i}:`, error.message)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    // ════════════════════════════════════════════════════════════════════
    // PHASE 1: CLEANUP — Remove all @test.edu users and their data
    // ════════════════════════════════════════════════════════════════════
    console.log('Phase 1: Cleaning up existing test data...')
    const { data: { users: existingUsers } } = await supabase.auth.admin.listUsers({ perPage: 1000 })
    const testUsers = (existingUsers || []).filter((u: any) => u.email?.endsWith(TEST_DOMAIN))
    const testUserIds = testUsers.map((u: any) => u.id)

    if (testUserIds.length > 0) {
      // Delete dependent data first (order matters due to FK constraints)
      for (const uid of testUserIds) {
        await supabase.from('quiz_responses').delete().eq('student_id', uid)
        await supabase.from('quiz_attempts').delete().eq('student_id', uid)
        await supabase.from('attendance').delete().or(`student_id.eq.${uid},teacher_id.eq.${uid}`)
        await supabase.from('student_marks').delete().eq('student_id', uid)
        await supabase.from('course_enrollments').delete().eq('student_id', uid)
        await supabase.from('assessments').delete().eq('teacher_id', uid)
        await supabase.from('timetable').delete().eq('teacher_id', uid)
        await supabase.from('notifications').delete().eq('user_id', uid)
        await supabase.from('messages').delete().in('conversation_id',
          (await supabase.from('conversations').select('id').eq('user_id', uid)).data?.map((c: any) => c.id) || []
        )
        await supabase.from('conversations').delete().eq('user_id', uid)
        await supabase.from('documents').delete().eq('user_id', uid)
        await supabase.from('user_roles').delete().eq('user_id', uid)
        await supabase.from('profiles').delete().eq('id', uid)
      }
      // Delete auth users
      for (const uid of testUserIds) {
        await supabase.auth.admin.deleteUser(uid)
      }
      console.log(`Cleaned up ${testUserIds.length} test users`)
    }

    // Clean courses table (we'll re-insert)
    await supabase.from('courses').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // ════════════════════════════════════════════════════════════════════
    // PHASE 2: INSERT COURSES
    // ════════════════════════════════════════════════════════════════════
    console.log('Phase 2: Inserting courses...')
    const allCourseRows: any[] = []
    for (const [sem, courses] of Object.entries(coursesBySemester)) {
      for (const c of courses) {
        allCourseRows.push({
          course_code: c.code,
          course_name: c.name,
          credits: c.credits,
          department: c.dept,
          semester_number: parseInt(sem),
        })
      }
    }
    await batchInsert(supabase, 'courses', allCourseRows)
    console.log(`Inserted ${allCourseRows.length} courses`)

    // ════════════════════════════════════════════════════════════════════
    // PHASE 3: CREATE TEACHERS
    // ════════════════════════════════════════════════════════════════════
    console.log('Phase 3: Creating teachers...')
    const teacherIds: string[] = []
    for (let i = 0; i < 10; i++) {
      const email = `teacher${i + 1}${TEST_DOMAIN}`
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password: TEST_PASSWORD,
        email_confirm: true,
        user_metadata: { username: teacherNames[i], portal_type: 'teacher' },
      })
      if (error) {
        console.error(`Teacher create error ${email}:`, error.message)
        continue
      }
      teacherIds.push(data.user.id)
    }
    console.log(`Created ${teacherIds.length} teachers`)

    // Assign each teacher 3-4 courses (round-robin across all semesters)
    const allCourses = Object.values(coursesBySemester).flat()
    const teacherCourseMap: Record<string, typeof allCourses> = {}
    allCourses.forEach((course, idx) => {
      const tid = teacherIds[idx % teacherIds.length]
      if (!teacherCourseMap[tid]) teacherCourseMap[tid] = []
      teacherCourseMap[tid].push(course)
    })

    // ════════════════════════════════════════════════════════════════════
    // PHASE 4: CREATE STUDENTS
    // ════════════════════════════════════════════════════════════════════
    console.log('Phase 4: Creating students...')
    const studentsByBatch: Record<string, { id: string; roll: string; name: string }[]> = {}

    for (const batch of batches) {
      studentsByBatch[batch.prefix] = []
      for (let i = 1; i <= STUDENTS_PER_BATCH; i++) {
        const roll = `${batch.label}-${pad(i)}`
        const email = `${batch.prefix.toLowerCase()}bcs${pad(i)}${TEST_DOMAIN}`
        const name = `${pick(firstNames)} ${pick(lastNames)}`

        const { data, error } = await supabase.auth.admin.createUser({
          email,
          password: TEST_PASSWORD,
          email_confirm: true,
          user_metadata: { username: name, portal_type: 'student' },
        })
        if (error) {
          console.error(`Student create error ${email}:`, error.message)
          continue
        }
        studentsByBatch[batch.prefix].push({ id: data.user.id, roll, name })
      }
      console.log(`Created ${studentsByBatch[batch.prefix].length} students for ${batch.label}`)
    }

    // ════════════════════════════════════════════════════════════════════
    // PHASE 5: ENROLLMENTS, ASSESSMENTS, MARKS, ATTENDANCE, TIMETABLE
    // ════════════════════════════════════════════════════════════════════
    console.log('Phase 5: Generating academic data...')
    let totalEnrollments = 0
    let totalAssessments = 0
    let totalMarks = 0
    let totalAttendance = 0
    let totalTimetable = 0

    for (const batch of batches) {
      const students = studentsByBatch[batch.prefix]
      if (!students || students.length === 0) continue

      const semesterCourses = coursesBySemester[batch.currentSemester] || []

      // ── Enrollments ──
      const enrollmentRows = students.flatMap(s =>
        semesterCourses.map(c => ({
          student_id: s.id,
          course_code: c.code,
        }))
      )
      await batchInsert(supabase, 'course_enrollments', enrollmentRows, 100)
      totalEnrollments += enrollmentRows.length

      // ── For each course, create assessments ──
      for (const course of semesterCourses) {
        // Find the teacher for this course
        const teacherId = Object.entries(teacherCourseMap).find(
          ([, courses]) => courses.some(c => c.code === course.code)
        )?.[0] || teacherIds[0]

        const assessmentDefs = [
          { type: 'quiz', title: 'Quiz 1', marks: 10 },
          { type: 'quiz', title: 'Quiz 2', marks: 10 },
          { type: 'quiz', title: 'Quiz 3', marks: 15 },
          { type: 'assignment', title: 'Assignment 1', marks: 20 },
          { type: 'assignment', title: 'Assignment 2', marks: 25 },
          { type: 'midterm', title: 'Midterm Exam', marks: 30 },
        ]

        for (const def of assessmentDefs) {
          const { data: assessment, error: aErr } = await supabase.from('assessments').insert({
            teacher_id: teacherId,
            course_code: course.code,
            course_name: course.name,
            assessment_type: def.type,
            title: def.title,
            total_marks: def.marks,
            is_online_quiz: false,
            is_marks_finalized: def.type === 'midterm',
          }).select('id').single()

          if (aErr || !assessment) {
            console.error(`Assessment error ${course.code} ${def.title}:`, aErr?.message)
            continue
          }
          totalAssessments++

          // ── Student marks ──
          const markRows = students.map(s => ({
            assessment_id: assessment.id,
            student_id: s.id,
            student_name: s.name,
            student_roll_number: s.roll,
            marks_obtained: randomScore(def.marks),
            remarks: null,
          }))
          await batchInsert(supabase, 'student_marks', markRows, 100)
          totalMarks += markRows.length
        }

        // ── Attendance (20 sessions per course) ──
        const attendanceRows: any[] = []
        for (let day = 0; day < 20; day++) {
          const date = new Date()
          date.setDate(date.getDate() - (20 - day) * 2) // every other day going back
          const dateStr = date.toISOString().split('T')[0]

          for (const s of students) {
            attendanceRows.push({
              student_id: s.id,
              teacher_id: Object.entries(teacherCourseMap).find(
                ([, courses]) => courses.some(c => c.code === course.code)
              )?.[0] || teacherIds[0],
              course_code: course.code,
              date: dateStr,
              status: Math.random() > 0.15 ? 'present' : (Math.random() > 0.5 ? 'absent' : 'late'),
            })
          }
        }
        await batchInsert(supabase, 'attendance', attendanceRows, 200)
        totalAttendance += attendanceRows.length

        // ── Timetable (3 slots per course) ──
        const days = [1, 3, 5] // Mon, Wed, Fri
        const startHour = 8 + (allCourses.indexOf(course) % 6) // stagger times
        const timetableRows = days.map(d => ({
          teacher_id: Object.entries(teacherCourseMap).find(
            ([, courses]) => courses.some(c => c.code === course.code)
          )?.[0] || teacherIds[0],
          course_code: course.code,
          course_name: course.name,
          day_of_week: d,
          start_time: `${String(startHour).padStart(2, '0')}:00`,
          end_time: `${String(startHour + 1).padStart(2, '0')}:30`,
          room: `R-${100 + Math.floor(Math.random() * 20)}`,
        }))
        await batchInsert(supabase, 'timetable', timetableRows)
        totalTimetable += timetableRows.length
      }
    }

    const totalStudents = Object.values(studentsByBatch).reduce((sum, s) => sum + s.length, 0)

    const summary = {
      success: true,
      teachers: teacherIds.length,
      students: totalStudents,
      courses: allCourseRows.length,
      enrollments: totalEnrollments,
      assessments: totalAssessments,
      marks: totalMarks,
      attendance: totalAttendance,
      timetable: totalTimetable,
      login_info: {
        teachers: `teacher1${TEST_DOMAIN} through teacher10${TEST_DOMAIN}`,
        students: `fa22bcs001${TEST_DOMAIN}, sp23bcs001${TEST_DOMAIN}, etc.`,
        password: TEST_PASSWORD,
      },
    }

    console.log('Seeding complete!', JSON.stringify(summary))

    return new Response(JSON.stringify(summary, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('Seed error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
