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

async function batchInsert(supabase: any, table: string, rows: any[], size = 50) {
  for (let i = 0; i < rows.length; i += size) {
    const chunk = rows.slice(i, i + size)
    const { error } = await supabase.from(table).insert(chunk)
    if (error) console.error(`Insert error on ${table} chunk ${i}:`, error.message)
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────
async function getTestUsers(supabase: any) {
  // List all users and filter test ones
  const allUsers: any[] = []
  let page = 1
  while (true) {
    const { data: { users }, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (error || !users || users.length === 0) break
    allUsers.push(...users)
    if (users.length < 1000) break
    page++
  }
  return allUsers.filter((u: any) => u.email?.endsWith(TEST_DOMAIN))
}

// ═════════════════════════════════════════════════════════════════════════
// PHASE: USERS — Create teacher and student auth accounts
// ═════════════════════════════════════════════════════════════════════════
async function phaseUsers(supabase: any) {
  console.log('=== PHASE: USERS ===')
  
  // Check what already exists
  const existingTestUsers = await getTestUsers(supabase)
  const existingEmails = new Set(existingTestUsers.map((u: any) => u.email))
  console.log(`Found ${existingTestUsers.length} existing test users`)

  let teachersCreated = 0
  let studentsCreated = 0

  // Create teachers
  for (let i = 0; i < 10; i++) {
    const email = `teacher${i + 1}${TEST_DOMAIN}`
    if (existingEmails.has(email)) continue
    const { error } = await supabase.auth.admin.createUser({
      email,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: { username: teacherNames[i], portal_type: 'teacher' },
    })
    if (error) { console.error(`Teacher error ${email}:`, error.message); continue }
    teachersCreated++
  }
  console.log(`Created ${teachersCreated} new teachers`)

  // Create students batch by batch
  for (const batch of batches) {
    let created = 0
    for (let i = 1; i <= STUDENTS_PER_BATCH; i++) {
      const email = `${batch.prefix.toLowerCase()}bcs${pad(i)}${TEST_DOMAIN}`
      if (existingEmails.has(email)) continue
      const roll = `${batch.label}-${pad(i)}`
      const name = `${pick(firstNames)} ${pick(lastNames)}`
      const { error } = await supabase.auth.admin.createUser({
        email,
        password: TEST_PASSWORD,
        email_confirm: true,
        user_metadata: { username: name, portal_type: 'student' },
      })
      if (error) { console.error(`Student error ${email}:`, error.message); continue }
      created++
    }
    studentsCreated += created
    console.log(`Batch ${batch.label}: created ${created} new students`)
  }

  return { teachersCreated, studentsCreated, totalExisting: existingTestUsers.length }
}

// ═════════════════════════════════════════════════════════════════════════
// PHASE: DATA — Generate courses, enrollments, assessments, marks, etc.
// ═════════════════════════════════════════════════════════════════════════
async function phaseData(supabase: any) {
  console.log('=== PHASE: DATA ===')

  // Get all test users
  const testUsers = await getTestUsers(supabase)
  const teachers = testUsers.filter((u: any) => u.email?.startsWith('teacher'))
  const teacherIds = teachers.map((u: any) => u.id)

  if (teacherIds.length === 0) {
    throw new Error('No teachers found. Run with phase=users first.')
  }

  // Build student map by batch
  const studentsByBatch: Record<string, { id: string; roll: string; name: string }[]> = {}
  for (const batch of batches) {
    const prefix = batch.prefix.toLowerCase()
    const batchStudents = testUsers
      .filter((u: any) => u.email?.startsWith(`${prefix}bcs`))
      .map((u: any, idx: number) => {
        const num = parseInt(u.email.replace(`${prefix}bcs`, '').replace(TEST_DOMAIN, ''))
        return {
          id: u.id,
          roll: `${batch.label}-${pad(num)}`,
          name: u.user_metadata?.username || `Student ${num}`,
        }
      })
    studentsByBatch[batch.prefix] = batchStudents
    console.log(`Found ${batchStudents.length} students for ${batch.label}`)
  }

  // ── Clean existing academic data for test users ──
  console.log('Cleaning existing academic data...')
  const allTestIds = testUsers.map((u: any) => u.id)
  
  // Delete in correct order for FK constraints
  for (const tid of teacherIds) {
    // Get assessment IDs for this teacher
    const { data: teacherAssessments } = await supabase.from('assessments').select('id').eq('teacher_id', tid)
    const assessmentIds = (teacherAssessments || []).map((a: any) => a.id)
    if (assessmentIds.length > 0) {
      for (let i = 0; i < assessmentIds.length; i += 50) {
        const chunk = assessmentIds.slice(i, i + 50)
        await supabase.from('quiz_responses').delete().in('assessment_id', chunk)
        await supabase.from('quiz_attempts').delete().in('assessment_id', chunk)
        await supabase.from('quiz_questions').delete().in('assessment_id', chunk)
        await supabase.from('student_marks').delete().in('assessment_id', chunk)
      }
    }
    await supabase.from('assessments').delete().eq('teacher_id', tid)
    await supabase.from('attendance').delete().eq('teacher_id', tid)
    await supabase.from('timetable').delete().eq('teacher_id', tid)
    await supabase.from('teacher_courses').delete().eq('teacher_id', tid)
  }
  for (const sid of allTestIds) {
    await supabase.from('course_enrollments').delete().eq('student_id', sid)
  }
  // Clean courses table
  await supabase.from('courses').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  console.log('Academic data cleaned')

  // ── Insert courses ──
  const allCourseRows: any[] = []
  for (const [sem, courses] of Object.entries(coursesBySemester)) {
    for (const c of courses) {
      allCourseRows.push({
        course_code: c.code, course_name: c.name,
        credits: c.credits, department: c.dept, semester_number: parseInt(sem),
      })
    }
  }
  await batchInsert(supabase, 'courses', allCourseRows)
  console.log(`Inserted ${allCourseRows.length} courses`)

  // ── Assign teachers to courses (round-robin) ──
  const allCourses = Object.values(coursesBySemester).flat()
  const courseTeacher: Record<string, string> = {}
  allCourses.forEach((c, idx) => { courseTeacher[c.code] = teacherIds[idx % teacherIds.length] })

  // ── Insert teacher_courses mappings ──
  const teacherCourseRows = allCourses.map(c => ({
    teacher_id: courseTeacher[c.code],
    course_code: c.code,
    course_name: c.name,
  }))
  await batchInsert(supabase, 'teacher_courses', teacherCourseRows)
  console.log(`Inserted ${teacherCourseRows.length} teacher-course mappings`)

  // ── Generate data per batch ──
  let totalEnrollments = 0, totalAssessments = 0, totalMarks = 0, totalAttendance = 0, totalTimetable = 0

  for (const batch of batches) {
    const students = studentsByBatch[batch.prefix]
    if (!students || students.length === 0) { console.log(`Skipping ${batch.label} - no students`); continue }

    const semesterCourses = coursesBySemester[batch.currentSemester] || []
    console.log(`Processing ${batch.label}: ${students.length} students, ${semesterCourses.length} courses`)

    // Enrollments
    const enrollmentRows = students.flatMap(s => semesterCourses.map(c => ({ student_id: s.id, course_code: c.code })))
    await batchInsert(supabase, 'course_enrollments', enrollmentRows, 100)
    totalEnrollments += enrollmentRows.length

    for (const course of semesterCourses) {
      const teacherId = courseTeacher[course.code] || teacherIds[0]

      // Assessments
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
          course_code: course.code, course_name: course.name,
          assessment_type: def.type, title: def.title, total_marks: def.marks,
          is_online_quiz: false, is_marks_finalized: def.type === 'midterm',
        }).select('id').single()

        if (aErr || !assessment) { console.error(`Assessment err ${course.code} ${def.title}:`, aErr?.message); continue }
        totalAssessments++

        // Marks
        const markRows = students.map(s => ({
          assessment_id: assessment.id, student_id: s.id,
          student_name: s.name, student_roll_number: s.roll,
          marks_obtained: randomScore(def.marks), remarks: null,
        }))
        await batchInsert(supabase, 'student_marks', markRows, 100)
        totalMarks += markRows.length
      }

      // Attendance (20 sessions)
      const attendanceRows: any[] = []
      for (let day = 0; day < 20; day++) {
        const date = new Date()
        date.setDate(date.getDate() - (20 - day) * 2)
        const dateStr = date.toISOString().split('T')[0]
        for (const s of students) {
          attendanceRows.push({
            student_id: s.id, teacher_id: courseTeacher[course.code] || teacherIds[0],
            course_code: course.code, date: dateStr,
            status: Math.random() > 0.15 ? 'present' : (Math.random() > 0.5 ? 'absent' : 'late'),
          })
        }
      }
      await batchInsert(supabase, 'attendance', attendanceRows, 200)
      totalAttendance += attendanceRows.length

      // Timetable (3 slots)
      const days = [1, 3, 5]
      const startHour = 8 + (allCourses.findIndex(c => c.code === course.code) % 6)
      const timetableRows = days.map(d => ({
        teacher_id: courseTeacher[course.code] || teacherIds[0],
        course_code: course.code, course_name: course.name,
        day_of_week: d,
        start_time: `${String(startHour).padStart(2, '0')}:00`,
        end_time: `${String(startHour + 1).padStart(2, '0')}:30`,
        room: `R-${100 + Math.floor(Math.random() * 20)}`,
      }))
      await batchInsert(supabase, 'timetable', timetableRows)
      totalTimetable += timetableRows.length
    }
  }

  return { courses: allCourseRows.length, enrollments: totalEnrollments, assessments: totalAssessments, marks: totalMarks, attendance: totalAttendance, timetable: totalTimetable }
}

// ═════════════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═════════════════════════════════════════════════════════════════════════
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    const url = new URL(req.url)
    const phase = url.searchParams.get('phase') || 'all'

    let result: any = {}

    if (phase === 'users' || phase === 'all') {
      result.users = await phaseUsers(supabase)
    }
    if (phase === 'data' || phase === 'all') {
      result.data = await phaseData(supabase)
    }

    result.success = true
    result.login_info = {
      teachers: `teacher1${TEST_DOMAIN} through teacher10${TEST_DOMAIN}`,
      students: `fa22bcs001${TEST_DOMAIN}, sp23bcs001${TEST_DOMAIN}, etc.`,
      password: TEST_PASSWORD,
    }

    console.log('Seed complete!', JSON.stringify(result))
    return new Response(JSON.stringify(result, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Seed error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
