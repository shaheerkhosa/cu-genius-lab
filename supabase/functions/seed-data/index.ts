import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    // 1. Create Sir Asim teacher account
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: 'shaheeraurhasankidharhain@gmail.com',
      password: 'Teacher@123',
      email_confirm: true,
      user_metadata: { username: 'Sir Asim', portal_type: 'teacher' }
    })

    let teacherId: string
    if (userError) {
      // User might already exist
      const { data: { users } } = await supabase.auth.admin.listUsers()
      const existing = users.find((u: any) => u.email === 'shaheeraurhasankidharhain@gmail.com')
      if (!existing) {
        return new Response(JSON.stringify({ error: 'Could not create or find teacher', detail: userError.message }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      teacherId = existing.id
    } else {
      teacherId = userData.user.id
    }

    // 2. Ensure teacher role exists (trigger should handle this, but just in case)
    await supabase.from('user_roles').upsert({ user_id: teacherId, role: 'teacher' }, { onConflict: 'user_id,role' })

    // 3. Create sample assessments for each course
    const courses = [
      { code: 'CS403', name: 'Computer Networks' },
      { code: 'CS401', name: 'Software Engineering' },
      { code: 'CS402', name: 'Operating Systems' },
      { code: 'CS404', name: 'Artificial Intelligence' },
    ]

    const students = [
      { name: 'Ahmed Khan', roll: 'SP22-BCS-001' },
      { name: 'Sara Ali', roll: 'SP22-BCS-002' },
      { name: 'Usman Tariq', roll: 'SP22-BCS-003' },
      { name: 'Fatima Zahra', roll: 'SP22-BCS-004' },
      { name: 'Hassan Raza', roll: 'SP22-BCS-005' },
      { name: 'Ayesha Noor', roll: 'SP22-BCS-006' },
      { name: 'Bilal Saeed', roll: 'SP22-BCS-007' },
      { name: 'Zainab Malik', roll: 'SP22-BCS-008' },
    ]

    // Delete existing assessments for this teacher to avoid duplicates
    await supabase.from('assessments').delete().eq('teacher_id', teacherId)

    const allAssessments: any[] = []

    for (const course of courses) {
      // Create 4 quizzes and 3 assignments per course
      const assessmentDefs = [
        { type: 'quiz', title: 'Quiz 1', marks: 10, weekOffset: -7 },
        { type: 'quiz', title: 'Quiz 2', marks: 10, weekOffset: -5 },
        { type: 'quiz', title: 'Quiz 3', marks: 15, weekOffset: -3 },
        { type: 'quiz', title: 'Quiz 4', marks: 15, weekOffset: -1 },
        { type: 'assignment', title: 'Assignment 1', marks: 20, weekOffset: -6 },
        { type: 'assignment', title: 'Assignment 2', marks: 20, weekOffset: -4 },
        { type: 'assignment', title: 'Assignment 3', marks: 25, weekOffset: -2 },
        { type: 'midterm', title: 'Midterm Exam', marks: 30, weekOffset: -3 },
      ]

      for (const def of assessmentDefs) {
        const createdDate = new Date()
        createdDate.setDate(createdDate.getDate() + (def.weekOffset * 7))

        const { data: assessment, error: aErr } = await supabase.from('assessments').insert({
          teacher_id: teacherId,
          course_code: course.code,
          course_name: course.name,
          assessment_type: def.type,
          title: def.title,
          total_marks: def.marks,
          is_online_quiz: false,
          is_marks_finalized: def.type === 'midterm',
          created_at: createdDate.toISOString(),
        }).select().single()

        if (aErr) {
          console.error('Assessment insert error:', aErr)
          continue
        }

        allAssessments.push(assessment)

        // Create marks for each student with realistic random scores
        const markRows = students.map(s => {
          // Generate realistic marks - vary by course difficulty
          const difficultyFactor = course.code === 'CS402' ? 0.65 : course.code === 'CS403' ? 0.7 : course.code === 'CS401' ? 0.8 : 0.75
          const baseScore = def.marks * difficultyFactor
          const variation = def.marks * 0.25
          const score = Math.min(def.marks, Math.max(0, Math.round(baseScore + (Math.random() - 0.5) * variation * 2)))

          return {
            assessment_id: assessment.id,
            student_name: s.name,
            student_roll_number: s.roll,
            marks_obtained: score,
            remarks: null,
          }
        })

        await supabase.from('student_marks').insert(markRows)
      }
    }

    return new Response(JSON.stringify({
      success: true,
      teacher_id: teacherId,
      assessments_created: allAssessments.length,
      message: 'Sir Asim account created with sample data. Login: shaheeraurhasankidharhain@gmail.com / Teacher@123'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})