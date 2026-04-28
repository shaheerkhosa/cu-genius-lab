// COMSATS University Islamabad knowledge-base corpus.
// Hand-authored prose covering the canonical sections a student or staff member
// would consult: handbook, policies, services, FAQs, course catalog, calendar.
//
// Each document is later chunked (~300-500 tokens) and embedded for RAG.

export const CORPUS = [
  // ───────── About / institutional ─────────
  {
    slug: 'about-northbridge',
    title: 'About COMSATS University Islamabad',
    source: 'about',
    category: 'institutional',
    body: `COMSATS University Islamabad (NU) is a HEC-recognized private university located in Karachi, Pakistan, founded in 1962. The university serves approximately 6,800 undergraduate students and 1,200 postgraduate students across eight colleges: Computing, Engineering, Business, Sciences, Humanities, Arts, Health Sciences, and Law.

The main campus spans 65 acres in Gulshan-e-Iqbal, Karachi, and is organized around twelve principal buildings — including the College of Computing Block, the Iqbal Business Centre, the Quaid Central Library, the Jinnah Auditorium, and the Sports Complex. The university operates on a two-semester academic year (Spring: late January through May; Fall: August through December) with an optional summer term in June and July.

COMSATS's mission is to deliver rigorous, research-informed education that prepares Pakistani students for global careers while remaining grounded in local industry, culture, and values. The university's motto is "Knowledge across the bridge." Degrees are recognized by the Higher Education Commission (HEC) of Pakistan and accepted across the GCC, UK, and North America for further study and employment.`,
  },
  {
    slug: 'leadership-and-governance',
    title: 'Leadership & Governance',
    source: 'about',
    category: 'institutional',
    body: `COMSATS University Islamabad is governed by a Board of Trustees that meets quarterly and reports to the Higher Education Commission (HEC). The Vice Chancellor is the chief academic and administrative officer of the university and chairs the Academic Council. Each of the eight colleges is led by a Dean, who reports to the Vice Chancellor and is supported by department heads.

Day-to-day administration is handled from the Administration Building (ADM), which houses the Office of the Vice Chancellor, the Registrar, Finance, Human Resources, and the Deans' offices. The Office of the Registrar is the authoritative source for transcripts, degree verification, course registration, and grade appeals. The Vice Chancellor maintains open office hours every Wednesday afternoon by appointment via the Registrar's office.`,
  },

  // ───────── Academic calendar ─────────
  {
    slug: 'academic-calendar-2026',
    title: 'Academic Calendar — Spring 2026',
    source: 'academic_calendar',
    category: 'calendar',
    body: `Spring 2026 semester runs from Tuesday 20 January 2026 to Saturday 30 May 2026.

Key dates:
- Course registration opens: Monday 5 January 2026
- Registration closes: Friday 16 January 2026 (late registration with fee until 23 January)
- Add/Drop period: 20 January – 31 January 2026
- Withdrawal deadline (with 'W' grade): Friday 13 March 2026
- Mid-term examinations: 9 March – 20 March 2026
- Spring break: 23 March – 27 March 2026 (no classes)
- Eid-ul-Fitr holidays: tentative 14 March – 17 March 2026 (subject to moon sighting)
- Pakistan Day holiday: Monday 23 March 2026
- Final project submissions due: Friday 15 May 2026
- Final examinations: 18 May – 30 May 2026
- Result declaration: by Friday 12 June 2026
- Convocation (graduating batch): Saturday 27 June 2026 at Jinnah Auditorium

The summer term (optional, two compressed sessions) runs from 8 June to 25 July 2026. Fall 2026 begins on Monday 17 August 2026.`,
  },

  // ───────── Admissions ─────────
  {
    slug: 'admissions-undergraduate',
    title: 'Undergraduate Admissions Handbook',
    source: 'handbook',
    category: 'admissions',
    body: `COMSATS admits undergraduate students for both Spring and Fall semesters. Applications are submitted through the COMSATS Online Admissions Portal at admissions.nu.edu.pk.

Eligibility (general): a candidate must have completed either the HSSC/Intermediate (FSc, FA, ICS, ICom, or equivalent) with at least 50% marks, or A-Levels/IB Diploma with grades equivalency from the Inter-Board Committee of Chairmen (IBCC). Engineering and Computing programs require a minimum of 60% in HSSC pre-engineering, pre-medical with mathematics, or A-Level passes including Mathematics. Health Sciences requires pre-medical or equivalent with biology and chemistry.

Required documents:
- Matric (SSC) result card or O-Level statement of results
- HSSC/Intermediate result card or A-Level statement of results
- IBCC equivalence certificate (for foreign qualifications)
- Original CNIC or B-Form
- Two passport-sized photographs
- Domicile certificate (for provincial quotas)

COMSATS Admission Test (NAT-NU) is held twice a year — in November (for Spring intake) and in May (for Fall intake) — and covers English, Mathematics, and a subject-specific section. Engineering applicants must additionally submit a valid ECAT score; computing applicants may submit either NAT-NU or ECAT. Test waivers are granted for SAT 1300+ or A-Level AAB or higher.

Admission fee at the time of acceptance is PKR 25,000 (non-refundable). Annual tuition ranges from PKR 320,000 (Humanities, Arts) to PKR 580,000 (Computing, Engineering, Pharmacy). Need-based and merit scholarships are described in the Financial Aid policy.`,
  },
  {
    slug: 'admissions-graduate',
    title: 'Graduate Admissions Handbook',
    source: 'handbook',
    category: 'admissions',
    body: `Graduate admissions at COMSATS cover MS, MPhil, and PhD programs across all eight colleges. Applications open twice a year, with deadlines on 30 November (Spring) and 30 June (Fall).

For MS/MPhil programs, applicants must hold a 16-year (4-year BS or BS Honours) degree with CGPA 2.5/4.0 or 60% in the annual system. For PhD programs, applicants need an MS/MPhil with CGPA 3.0/4.0 and a research proposal of 1,500–2,500 words. All graduate applicants take the COMSATS Graduate Test (GAT-NU) or submit a valid HEC GAT-General/Subject score.

Graduate students are required to maintain a CGPA of 3.0/4.0 to remain in good standing. PhD students are admitted into a research group at the time of admission and assigned a primary supervisor; the supervisor change request process is described in the PhD Handbook.`,
  },

  // ───────── Core academic policies ─────────
  {
    slug: 'grading-policy',
    title: 'Grading Policy',
    source: 'policy',
    category: 'academics',
    body: `COMSATS uses a 4.0 GPA scale. Letter grades, percentage ranges, and grade points:

- A   90–100   4.00
- A-  85–89    3.67
- B+  80–84    3.33
- B   75–79    3.00
- B-  70–74    2.67
- C+  65–69    2.33
- C   60–64    2.00
- C-  55–59    1.67
- D+  50–54    1.33
- D   45–49    1.00
- F   below 45 0.00
- W   withdrawn (no grade points)
- I   incomplete (must be cleared within 4 weeks of next semester start)
- AU  audit (no grade points; transcript shows AU)

GPA is calculated as the sum of (grade points × credit hours) divided by total credit hours attempted. CGPA is the cumulative running average across all completed semesters. A grade below C (less than 2.0) in a major-required course must be repeated. The "best-of" policy applies — when a course is repeated, only the higher of the two grades counts toward CGPA, but both attempts appear on the transcript.

A student whose semester GPA falls below 2.0 is placed on academic probation. Two consecutive probation semesters result in academic dismissal, subject to appeal to the Academic Council.`,
  },
  {
    slug: 'attendance-policy',
    title: 'Attendance Policy',
    source: 'policy',
    category: 'academics',
    body: `Class attendance at COMSATS is mandatory. A student must attend at least 80% of scheduled classes in each course to be eligible to sit the final examination of that course.

A student whose attendance falls below 80% but is at least 70% may submit a written appeal with documentary evidence (medical certificate from a registered hospital, bereavement, or university-authorized travel) to the course instructor and the department head. Appeals below 70% attendance are not entertained except in exceptional circumstances ratified by the Academic Council.

Three consecutive late arrivals (more than 10 minutes after class start) count as one absence. Faculty record attendance via the campus learning management system; students can verify their attendance record at any time by logging into the portal. Disputes must be raised within two weeks of the class in question — late disputes are not addressed.`,
  },
  {
    slug: 'examinations-policy',
    title: 'Examinations Policy',
    source: 'policy',
    category: 'academics',
    body: `Each course at COMSATS is assessed through a combination of continuous assessment (assignments, quizzes, projects, lab work) and formal examinations. The standard weighting is: 30% continuous assessment, 30% mid-term examination, 40% final examination — though departments may adjust within bounds approved by the Academic Council.

Mid-term examinations are held in week 7–8 of the semester. Final examinations are held in the last two weeks. The detailed examination schedule is published by the Office of the Controller of Examinations at least three weeks before the exam period begins.

Students must arrive at the examination hall 15 minutes before the start time with their student ID card. Mobile phones, smart watches, and unauthorized notes are strictly prohibited. Use of unfair means is treated as misconduct under the Academic Integrity policy and may result in suspension or expulsion. A student who misses an examination for documented medical or compassionate reasons may apply for a make-up examination within 7 days of the missed paper.`,
  },
  {
    slug: 'academic-integrity',
    title: 'Academic Integrity & Plagiarism',
    source: 'policy',
    category: 'academics',
    body: `COMSATS enforces a strict academic integrity standard. The following are considered misconduct: copying another student's work; allowing another student to copy your work; using unauthorized notes, devices, or external help during quizzes or exams; presenting AI-generated text as one's own without disclosure; ghost-writing; falsifying data in lab reports; and any form of plagiarism.

All written submissions are screened against the university's plagiarism detection software. A similarity index above 19% (excluding references and properly quoted material) is flagged and reviewed. Verified misconduct results in:

- First offence: zero on the assignment, written warning, and a permanent note in the student's academic file.
- Second offence: F grade in the course and one-semester suspension.
- Third offence: expulsion from the university.

Disclosure of AI assistance: students may use AI tools for brainstorming, code review, or grammar checking unless the instructor explicitly disallows it. Any AI-assisted work must be disclosed in a footnote describing what was used and how. Submitting unmodified AI-generated work as one's own is a misconduct violation.`,
  },
  {
    slug: 'course-registration',
    title: 'Course Registration & Withdrawal',
    source: 'policy',
    category: 'academics',
    body: `All students must register for courses each semester through the student portal at portal.nu.edu.pk. Registration opens approximately two weeks before the start of the semester and closes one day before classes begin. Late registration is permitted in the first week with a late fee of PKR 5,000.

Standard course load is 15–18 credit hours per semester. Underloading (below 12 credit hours) requires advisor approval and a written justification. Overloading (above 18 credit hours) is permitted only for students with CGPA ≥ 3.5 and requires both advisor and department head sign-off.

The add/drop period is the first two weeks of the semester. During add/drop, courses can be added or dropped without academic penalty and without the course appearing on the transcript. After add/drop, dropping a course is treated as a withdrawal: the course appears on the transcript with a 'W' grade until the official withdrawal deadline (week 8). After the withdrawal deadline, dropping a course is not permitted; the student must complete it or receive an F.`,
  },
  {
    slug: 'graduation-requirements',
    title: 'Graduation Requirements',
    source: 'policy',
    category: 'academics',
    body: `To graduate with a COMSATS undergraduate degree, a student must:

1. Complete all credit-hour requirements of the program (typically 130–144 credits, depending on the degree).
2. Achieve a final CGPA of at least 2.0/4.0.
3. Earn a grade of C or better in every major-required course.
4. Complete at least 50% of the major's credit hours at COMSATS (residency requirement).
5. Complete the senior year project / capstone with a passing grade.
6. Clear all financial dues with the Finance office.
7. Submit a clearance form signed by the library, hostel (if applicable), department, and Finance.
8. Apply for graduation through the Office of the Registrar at least one semester before the intended graduation date.

Honors are awarded as: Summa Cum Laude (CGPA ≥ 3.85), Magna Cum Laude (3.65–3.84), Cum Laude (3.40–3.64). The convocation is held annually in late June, and degrees are conferred by the Vice Chancellor on behalf of the Board of Trustees.`,
  },

  // ───────── Conduct & campus life ─────────
  {
    slug: 'student-conduct',
    title: 'Student Code of Conduct',
    source: 'policy',
    category: 'student_life',
    body: `COMSATS expects all students to conduct themselves with integrity, respect, and responsibility. The following are prohibited on campus and at university-organized events:

- Possession or use of alcohol, narcotics, or other intoxicants
- Smoking inside academic buildings (designated outdoor smoking areas exist)
- Harassment of any kind (sexual, racial, religious, or otherwise) — handled under the Anti-Harassment Policy with formal complaint mechanisms via the Anti-Harassment Committee
- Physical violence or threats
- Damage to university property
- Unauthorized political gatherings on campus
- Wearing inappropriate or offensive clothing — modest dress is required (see Dress Code)

Disciplinary actions range from written warnings, fines, and community service to suspension or expulsion, depending on severity. The Disciplinary Committee, chaired by the Dean of Students, hears all formal complaints and meets weekly during the semester. Students have the right to representation and appeal.`,
  },
  {
    slug: 'dress-code',
    title: 'Dress Code',
    source: 'policy',
    category: 'student_life',
    body: `COMSATS maintains a smart-modest dress code in keeping with Pakistani cultural norms. Students may wear shalwar kameez, kurta with trousers, or formal Western attire. The following are not permitted on campus:

- Sleeveless tops, shorts, or transparent clothing
- Slippers or hawai chappal (closed shoes or formal sandals are required)
- Clothing with offensive slogans or imagery
- T-shirts during examinations or formal events

Engineering and science labs require closed-toe shoes and full-length trousers/shalwar at all times, regardless of dress code. The Sports Complex and the Visual Arts studios have specific attire requirements posted at the entrance.`,
  },

  // ───────── Library & services ─────────
  {
    slug: 'library-services',
    title: 'Quaid Central Library — Services & Hours',
    source: 'services',
    category: 'library',
    body: `The Quaid Central Library (LIB building, north end of campus) is the principal library of the university. It holds 285,000 print volumes, subscribes to 18,000 electronic journals, and provides on-site access to JSTOR, IEEE Xplore, ACM Digital Library, ScienceDirect, SpringerLink, EBSCO, HEC Digital Library, and the National Digital Library of Pakistan.

Hours:
- Monday–Friday: 8:00 AM to 11:00 PM
- Saturday: 9:00 AM to 8:00 PM
- Sunday and public holidays: closed
- Examination weeks: Monday–Saturday 8:00 AM to 1:00 AM (extended hours)

Services: book borrowing (undergraduates may borrow up to 5 items for 14 days; postgraduates up to 8 items for 21 days), inter-library loan with HEC partner libraries, study room reservations (60 study rooms — book up to 3 days in advance via the library portal), printing and scanning, thesis binding, and reference assistance from subject librarians during weekday hours.

Late return fines are PKR 10 per day per item. Lost books require replacement at current market price plus a PKR 500 processing fee. The library hosts research workshops every other Saturday on topics including citation management with Zotero, systematic literature review, and academic writing.`,
  },
  {
    slug: 'sports-complex',
    title: 'Sports Complex Facilities',
    source: 'services',
    category: 'sports',
    body: `The COMSATS Sports Complex (SPT building) provides facilities for indoor and outdoor sports. The complex is open to all currently enrolled students, faculty, and staff with a valid ID card.

Facilities:
- 25-meter indoor swimming pool (men's hours 6–9 AM and 5–8 PM; women's hours 9 AM–noon and 3–5 PM; co-ed family hour Sundays)
- Modern gymnasium with cardio and strength equipment
- Indoor courts for badminton, basketball, table tennis
- Outdoor cricket nets and a full-size cricket ground
- Outdoor football/hockey turf
- Squash courts (4)
- Yoga and aerobics studio

Hours: 6:00 AM to 10:00 PM, every day except public holidays. Equipment rental (rackets, balls, mats) is free with student ID. Personal training sessions are available for PKR 1,500/session. The university supports varsity teams in cricket, football, basketball, volleyball, badminton, table tennis, and squash, which compete in the HEC Inter-University tournaments.`,
  },
  {
    slug: 'health-services',
    title: 'Student Health Services',
    source: 'services',
    category: 'health',
    body: `The COMSATS Health Centre is located on the ground floor of the Student Centre (STU building). It provides primary healthcare to all students, faculty, and staff free of charge.

Services include: general consultation, basic diagnostics (BP, blood sugar, ECG), first aid, minor wound care, vaccinations (Hepatitis B, tetanus, seasonal flu), women's health consultations, and mental health screening. A registered female physician is available three days per week. Two qualified nurses are on duty during all opening hours.

Hours: Monday–Friday 9:00 AM to 6:00 PM; Saturday 9:00 AM to 1:00 PM. After-hours emergencies are handled by the campus security control room (extension 1999), which can call an ambulance and arrange transfer to the partner hospital, Aga Khan University Hospital, where COMSATS maintains a referral arrangement.

All students are required to carry student health insurance as part of their semester fee — claims and reimbursements are handled by the Finance office.`,
  },
  {
    slug: 'counseling-services',
    title: 'Counseling & Wellbeing',
    source: 'services',
    category: 'health',
    body: `The Counseling and Wellbeing Office offers confidential mental health support to students. Services include individual counseling sessions, group therapy, exam stress workshops, and 24/7 crisis support.

Three full-time counselors are available — two female and one male — covering individual sessions, academic stress management, family/relationship issues, anxiety and depression, and grief support. Sessions are 50 minutes and can be booked through wellbeing.nu.edu.pk or by calling extension 2240.

All sessions are confidential and not recorded in the academic file. Students in immediate crisis may call the 24/7 helpline at +92-300-NU-CRISIS (628-2747) or walk into the office during hours (Mon–Fri 9 AM to 7 PM, Sat 10 AM to 2 PM). The counseling office is located on the second floor of the Student Centre, room S-205.`,
  },
  {
    slug: 'career-services',
    title: 'Career Services & Internships',
    source: 'services',
    category: 'career',
    body: `The Career Services Office helps students prepare for the job market and connects them with internship and graduate opportunities. Services are open from the second year onward and are free for all enrolled students and alumni up to two years post-graduation.

Services include: resume and cover letter review, mock interviews, LinkedIn profile reviews, employer information sessions, and on-campus placement drives. The Annual COMSATS Career Fair is held every March in the Sports Complex and brings 80+ employers including Engro, Systems Limited, P&G Pakistan, Unilever, MCB, Habib Bank, S&P Global, 10Pearls, Afiniti, Bazaar Technologies, Daraz, KE, and several MNCs and start-ups.

Internships: a credit-bearing internship is required for most undergraduate programs (typically 6–8 weeks during the summer between third and fourth year). The Career Services portal lists vetted internship openings continuously. Students should consult their academic advisor about whether their internship qualifies for credit.`,
  },
  {
    slug: 'it-services',
    title: 'IT Services, Wi-Fi & Lab Access',
    source: 'services',
    category: 'it',
    body: `COMSATS provides campus-wide Wi-Fi (SSID: NU-Student) accessible with student portal credentials. Faculty and staff use NU-Faculty. A guest network (NU-Guest) is available for visitors with daily voucher codes obtainable from the front desk of any building.

Every enrolled student receives:
- A nu.edu.pk email account with 50 GB Google Workspace storage
- Access to the campus learning management system (lms.nu.edu.pk)
- Microsoft 365 license (Word, Excel, PowerPoint, Teams)
- GitHub Education Pack (Computing students)
- Google Cloud educational credits (Computing/DS students)

Computer labs are available in COC, COE, COS, CHS, and the Library. The COC 24/7 Coding Lounge (COC building, basement) is accessible to Computing students with extended-hours access enabled on their ID card. Students may request access via the COC reception during office hours.

For password resets, account issues, or hardware support, contact the IT Help Desk in room ADM-103 (Mon–Fri 9 AM to 6 PM) or email helpdesk@nu.edu.pk.`,
  },

  // ───────── Financial ─────────
  {
    slug: 'tuition-fee-structure',
    title: 'Tuition & Fee Structure',
    source: 'policy',
    category: 'finance',
    body: `Tuition at COMSATS is charged per credit hour, with annual ceilings depending on the program. Spring 2026 fees (per semester):

- Computing & Engineering programs: PKR 280,000–290,000
- Health Sciences (Pharmacy, Public Health, Nutrition): PKR 270,000–290,000
- Sciences: PKR 220,000–235,000
- Business: PKR 230,000–245,000
- Humanities, Arts, Law: PKR 160,000–185,000

Additional charges: security deposit (refundable, PKR 25,000, paid once at admission), examination fee (PKR 8,000/semester), library and IT services (PKR 6,000/semester), student health insurance (PKR 4,500/semester), hostel (if availed; PKR 70,000/semester for shared room, PKR 110,000 for single room).

Fees may be paid in full at the start of the semester or in two equal installments (first installment by week 1; second by week 8). Late payment incurs a surcharge of PKR 500/day up to a maximum of PKR 15,000. Payments are made through HBL, MCB, or Bank Alfalah branches via the COMSATS fee challan, or online through portal.nu.edu.pk.`,
  },
  {
    slug: 'financial-aid-scholarships',
    title: 'Financial Aid & Scholarships',
    source: 'policy',
    category: 'finance',
    body: `COMSATS offers both need-based financial aid and merit-based scholarships. Approximately 28% of undergraduate students receive some form of financial assistance.

Merit scholarships (renewable each semester subject to CGPA):
- Vice Chancellor's Honor Scholarship: 100% tuition waiver for top 5 students per intake (CGPA ≥ 3.85 to renew).
- Dean's Merit Scholarship: 50% tuition waiver for top 10% of each college (CGPA ≥ 3.65 to renew).
- Achievement Scholarship: 25% tuition waiver based on standardized test scores at admission.

Need-based aid: the COMSATS Financial Assistance Programme (NFAP) supports students from families earning under PKR 200,000/month with up to 80% tuition waiver, evaluated by the Financial Aid Committee on the basis of family income statements, asset declarations, and a personal interview. Applications are submitted by 1 December for Spring and by 1 July for Fall.

External scholarships: HEC Need-Based, USAID Merit and Need-Based, Pakistan Bait-ul-Mal, Akhuwat Education Programme, and various provincial endowments are facilitated by the Office of Student Affairs. Applications and deadlines are announced through the campus portal.`,
  },

  // ───────── Hostels & residence ─────────
  {
    slug: 'hostel-residence',
    title: 'Hostels & Residential Life',
    source: 'handbook',
    category: 'residence',
    body: `COMSATS operates two on-campus hostels: the Iqbal Hostel for male students (capacity 320) and the Fatima Hostel for female students (capacity 280). Hostel admission is on a first-come, first-served basis, with priority given to out-of-Karachi students.

Rooms are double-occupancy with attached or shared bathrooms; a limited number of single rooms are available at higher fees. Each hostel has a common room with TV and WiFi, a study hall open until 1 AM, a small canteen, and a prayer hall.

Hostel rules: visiting hours for the same gender are 6 PM to 10 PM in the common areas only — guests are not permitted in private rooms. Cooking in rooms is prohibited (rice cookers and kettles are allowed). Curfew is 11:00 PM for residents to be back in the hostel; departures after 8 PM require sign-out at the front desk. Two-night absences require parental authorization on file.

Hostel fees include three meals per day from a fixed-menu mess. Special dietary requirements (medical, allergy) must be registered with the warden at the start of the semester.`,
  },

  // ───────── Dining ─────────
  {
    slug: 'dining-meal-plan',
    title: 'Dining & Meal Plan Information',
    source: 'services',
    category: 'dining',
    body: `Three dining outlets serve the COMSATS community: the Main Cafeteria in the Student Centre (STU), the Library Café in the Quaid Central Library, and Cha Bar near the College of Computing. All outlets are halal-certified and accept the COMSATS meal plan card and cash payments.

Main Cafeteria hours: Monday–Friday 7:30 AM to 9:00 PM; weekends 9:00 AM to 7:00 PM. Daily menus rotate weekly and include desi staples (biryani, nihari, daal chawal, chicken karahi, qeema, pulao), continental options (sandwiches, pastas, burgers, salads), and breakfast items (paratha-anda, halwa puri, omelette, paratha-chai). A vegetarian counter operates daily.

The Library Café focuses on light meals — sandwiches, wraps, soups, samosas, pakoras — and a strong selection of teas and coffee. Open during library hours.

Cha Bar is a 24/7 self-service tea and coffee station with packaged snacks, popular with students working late in the COC labs.

Meal plan: students may purchase a semester meal plan that provides credit at all three outlets at a 12% discount versus pay-as-you-go. Plans are available in three tiers (PKR 25,000 / 45,000 / 70,000 per semester) and can be topped up at the Finance office or online. Allergens, calorie counts, and nutrition information are posted at each outlet and on the COMSATS dining portal.`,
  },

  // ───────── Clubs ─────────
  {
    slug: 'clubs-and-societies',
    title: 'Student Clubs & Societies',
    source: 'services',
    category: 'student_life',
    body: `COMSATS has 20 active student-run clubs and societies covering academic, professional, cultural, sports, community service, and arts interests. Each club is led by an elected president and has a faculty advisor; members can hold roles as vice president, secretary, treasurer, or general member.

Major clubs include the COMSATS Computing Society (NUCS), the IEEE Student Branch, the Entrepreneurship Society, the Debating Society, the Dramatics Society, the Music Society, the Photography Club, the Adventure & Trekking Club, the Community Service Society, the Literary Society, and the Astronomy Club.

Joining: the annual Club Fair is held in the second week of each semester at the Student Centre lawn. Students may join by signing up at the club booth or online through portal.nu.edu.pk/clubs. Most clubs have no joining fee; some (Adventure Club, Photography Club) charge nominal annual fees to cover equipment.

Club events: clubs may book rooms in the Student Centre or seminar halls in their faculty buildings. Major events (auditorium use, off-campus trips) require prior approval from the Office of Student Affairs and the Dean of Students.`,
  },

  // ───────── Course catalog samples ─────────
  {
    slug: 'course-cs101',
    title: 'CS-101 — Introduction to Programming',
    source: 'course_catalog',
    category: 'computing',
    body: `CS-101 Introduction to Programming. Credits: 4 (3 lecture + 1 lab). Prerequisite: none. Offered: every semester.

This is a first-course in programming for Computing freshmen and majors from other colleges with computational interest. The course covers fundamental programming concepts using Python: variables, types, expressions, control flow, functions, lists and dictionaries, file I/O, recursion, and a brief introduction to object-oriented programming. The lab component (one 3-hour weekly session) emphasizes hands-on problem solving on platforms such as HackerRank and LeetCode.

Learning outcomes: by the end of the course, students will be able to (i) translate algorithmic thinking into syntactically correct Python programs; (ii) use core data structures to solve standard problems; (iii) read and modify existing code; (iv) test and debug their own programs; (v) apply basic version control (Git) to manage their work.

Assessment: 30% continuous (weekly assignments and lab quizzes), 30% mid-term, 40% final. A final project (group of 2) replaces 15% of the final-exam weight at the instructor's discretion.

Recommended text: Allen Downey, "Think Python (2nd ed.)". Reference: Eric Matthes, "Python Crash Course (3rd ed.)".`,
  },
  {
    slug: 'course-cs201',
    title: 'CS-201 — Data Structures and Algorithms',
    source: 'course_catalog',
    category: 'computing',
    body: `CS-201 Data Structures and Algorithms. Credits: 4 (3 lecture + 1 lab). Prerequisite: CS-101 with grade C or better. Offered: every semester.

A foundational sophomore course covering classical data structures and algorithm design. Topics: arrays and dynamic arrays; linked lists (singly, doubly, circular); stacks and queues; recursion and divide-and-conquer; trees (binary, BST, AVL, red-black overview); heaps and priority queues; hash tables; graphs (BFS, DFS, Dijkstra, MST); standard sorting algorithms (merge, quick, heap, radix). Asymptotic analysis (Big-O, Omega, Theta) runs throughout.

Lab work is in C++ to reinforce manual memory management and pointer reasoning. Programming assignments require both correctness proofs and complexity analysis.

Learning outcomes: students will (i) select appropriate data structures for a given problem; (ii) reason precisely about time and space complexity; (iii) implement and debug pointer-based structures in C++; (iv) apply standard algorithm-design techniques (greedy, divide-and-conquer, dynamic programming).

Assessment: 25% continuous, 30% mid-term, 35% final, 10% term project. Recommended text: CLRS "Introduction to Algorithms (4th ed.)".`,
  },
  {
    slug: 'course-cs301',
    title: 'CS-301 — Database Systems',
    source: 'course_catalog',
    category: 'computing',
    body: `CS-301 Database Systems. Credits: 3 (2 lecture + 1 lab). Prerequisite: CS-201. Offered: every semester.

This third-year course covers the theory and practice of relational database systems with practical exposure to PostgreSQL. Topics: relational model and algebra; SQL (DDL, DML, DCL); functional dependencies and normalization (1NF–BCNF); indexing (B-trees, hash indexes); query processing and optimization; transaction management (ACID, isolation levels); recovery; introduction to NoSQL paradigms (document stores, key-value, columnar).

Labs use PostgreSQL throughout. Students design a non-trivial schema for a domain of their choice, implement it, populate it with realistic data, and write a series of analytical queries that they justify with execution plans.

Learning outcomes: students will (i) design normalized schemas; (ii) write efficient SQL queries; (iii) reason about indexing and query plans; (iv) understand transaction semantics; (v) make informed choices between SQL and NoSQL stores.

Assessment: 25% continuous (weekly SQL assignments), 25% mid-term, 35% final, 15% semester-long database project. Recommended text: Ramakrishnan & Gehrke, "Database Management Systems (3rd ed.)".`,
  },
  {
    slug: 'course-se250',
    title: 'SE-250 — Software Engineering Principles',
    source: 'course_catalog',
    category: 'computing',
    body: `SE-250 Software Engineering Principles. Credits: 3. Prerequisite: CS-201. Offered: Spring.

A mid-program software-engineering course introducing the lifecycle of building software in teams. Topics: requirements gathering and user stories; agile and Scrum practices; design patterns; modular architecture; version control and code review; unit and integration testing; CI/CD pipelines; software quality metrics; technical debt; and ethics in software engineering.

The course centers on a semester-long team project in which 4-person teams build a working web application end-to-end (frontend, backend, database, deployment) and present it at the term-end demo day.

Learning outcomes: students will (i) translate stakeholder needs into structured requirements; (ii) apply common design patterns appropriately; (iii) operate effectively in a small agile team; (iv) write tests at multiple levels; (v) deploy and maintain a working system.

Assessment: 20% continuous, 25% mid-term, 25% final, 30% team project (split between deliverables, code quality, and final demo).`,
  },
  {
    slug: 'course-ee201',
    title: 'EE-201 — Electric Circuits',
    source: 'course_catalog',
    category: 'engineering',
    body: `EE-201 Electric Circuits. Credits: 4 (3 lecture + 1 lab). Prerequisite: PHY-102, MATH-201. Offered: every semester.

Foundational electrical engineering course. Topics: Ohm's and Kirchhoff's laws; node-voltage and mesh-current methods; Thevenin and Norton equivalents; superposition; first-order RC and RL transients; second-order circuits; sinusoidal steady-state analysis; phasors and impedance; AC power (real, reactive, apparent); three-phase systems; magnetically coupled circuits; ideal transformers.

Labs use breadboards, oscilloscopes, function generators, and digital multimeters. Each week's lab reinforces the lecture topic with a hands-on circuit build and measurement exercise.

Learning outcomes: students will (i) analyze DC and AC circuits using standard methods; (ii) build and measure simple circuits safely; (iii) interpret oscilloscope traces; (iv) apply phasor methods to sinusoidal steady-state problems.

Assessment: 25% continuous (lab reports and homeworks), 25% mid-term, 40% final, 10% lab final.`,
  },

  // ───────── FAQs ─────────
  {
    slug: 'faq-id-card',
    title: 'FAQ — Student ID Card',
    source: 'faq',
    category: 'campus_admin',
    body: `Q: When and how do I get my student ID card?
A: New students receive their ID card during orientation week. You will be photographed at the Registrar's office (ADM building, room 102) on the day mentioned in your orientation packet. Cards are issued within 3 working days.

Q: I lost my student ID card. What should I do?
A: First report the loss to the campus security desk in the Administration Building so it can be marked as void. Then visit the Registrar's office with your CNIC and a Lost-Card form (downloadable from portal.nu.edu.pk). A replacement card costs PKR 1,500 and is issued in 3–5 working days. A temporary paper ID is provided in the meantime so you can attend classes and access the library.

Q: My ID card stopped working at the gate / library / hostel scanner.
A: Demagnetization or surface damage is the usual cause. Visit the IT Help Desk (ADM-103) — they can re-encode the card on the spot. If the chip is physically damaged, you'll need a replacement card.

Q: Does my ID card double as my library card?
A: Yes. The same card is used for library borrowing, gym access, and meal-plan transactions. There is no separate library card.`,
  },
  {
    slug: 'faq-transcripts',
    title: 'FAQ — Transcripts & Degree Verification',
    source: 'faq',
    category: 'campus_admin',
    body: `Q: How do I request an official transcript?
A: Submit a Transcript Request through portal.nu.edu.pk → Records → Transcripts. Pay PKR 500 per copy via online banking or at the Finance office. Standard processing time is 3 working days for collection at the Registrar's office or 7 working days for postal delivery within Pakistan. Express processing (24-hour turnaround) is available for an additional PKR 1,500.

Q: Can I send my transcript directly to a foreign university?
A: Yes. Specify the recipient institution in the request and the Registrar will mail a sealed transcript directly to the institution's evaluation office. Many institutions accept e-transcripts via secure email — confirm with the recipient institution which format they require.

Q: How is degree verification handled (HEC attestation)?
A: Degrees can be attested by HEC after the student receives their original degree certificate. COMSATS issues the original degree at convocation. For HEC attestation, walk in to any HEC regional office with your degree, transcript, CNIC, and the appropriate fee. COMSATS does not handle HEC attestation directly but can verify a graduate's record to HEC on request.

Q: I graduated. Can I still get a transcript?
A: Yes. Alumni can request transcripts indefinitely. After two years post-graduation, the request must be initiated by emailing registrar@nu.edu.pk with a scan of your CNIC and original degree.`,
  },
  {
    slug: 'faq-parking',
    title: 'FAQ — Campus Parking',
    source: 'faq',
    category: 'campus_admin',
    body: `Q: Can students park on campus?
A: Yes. Students with private vehicles may register for a parking permit at the Security office in the Administration Building. The permit is free; you'll need to provide a copy of your CNIC, vehicle registration, and student ID.

Q: Where can I park?
A: Three student parking zones: P1 (front of Sports Complex), P2 (between COE and COB), and P3 (south of the Library). Parking is on a first-come basis. Faculty and staff have separate dedicated zones marked F1–F4.

Q: Is there motorcycle parking?
A: Yes — motorcycle parking is available alongside each car parking zone and is free with the same permit.

Q: My car was towed/clamped. What do I do?
A: Vehicles parked in unauthorized areas (faculty zones, fire lanes, dean's parking) may be clamped. Visit the Security office to pay a PKR 1,000 release fee. Repeat offences result in permit revocation for the semester.`,
  },
  {
    slug: 'faq-graduation',
    title: 'FAQ — Graduation & Convocation',
    source: 'faq',
    category: 'graduation',
    body: `Q: When should I apply for graduation?
A: At least one semester before your intended graduation date — by 15 October for spring graduates, and by 15 February for fall graduates. Late applications may delay your degree by one semester.

Q: Does my CGPA affect whether I graduate with honors?
A: Yes. Honors are conferred as Summa Cum Laude (CGPA ≥ 3.85), Magna Cum Laude (3.65–3.84), and Cum Laude (3.40–3.64). Honors are noted on the transcript and the degree certificate.

Q: I have a back-paper / repeat outstanding. Can I still attend convocation?
A: No — all academic and financial obligations must be cleared before convocation. If you clear your outstanding requirement after convocation, your degree will be conferred in absentia and mailed to you.

Q: How long does it take to receive the original degree certificate after convocation?
A: Original degrees are issued at the convocation ceremony. If you graduate in absentia, the degree is dispatched within 6 weeks of result declaration. Replacement degree certificates require a sworn affidavit and a PKR 5,000 fee.`,
  },
  {
    slug: 'faq-international-students',
    title: 'FAQ — International Students',
    source: 'faq',
    category: 'admissions',
    body: `Q: I'm not a Pakistani citizen. Can I apply to COMSATS?
A: Yes. COMSATS welcomes international students from across the GCC, South Asia, Africa, and Central Asia. International applicants follow the same online admissions process as domestic students but are exempt from the NAT-NU/ECAT requirement if they hold equivalent qualifications (IB Diploma, A-Levels, or country-of-origin standardized assessments accepted by IBCC).

Q: What documents do I need beyond what domestic applicants provide?
A: A valid passport, academic transcripts attested by the relevant authorities of your home country, an English-language proficiency certificate (IELTS 6.0 or TOEFL iBT 70 — waived if instruction was in English), and a Pakistan study visa or arrangement to obtain one.

Q: Does COMSATS help with the student visa?
A: Yes. After your conditional acceptance and fee deposit, the Office of International Affairs issues a sponsorship letter that you submit to the Pakistani embassy in your country to obtain a Type C study visa. Visa renewals during your studies are handled with the help of the same office.

Q: Is there international-student housing?
A: International students are given priority in the on-campus hostels. Limited off-campus partnered accommodation is also available in Gulshan-e-Iqbal. The Office of International Affairs maintains a list of vetted housing options.`,
  },
  {
    slug: 'faq-wifi-portal',
    title: 'FAQ — Wi-Fi & Student Portal',
    source: 'faq',
    category: 'it',
    body: `Q: I can't connect to NU-Student Wi-Fi. What do I do?
A: Make sure you're using your full nu.edu.pk email and the portal password. If you forgot your password, reset it at portal.nu.edu.pk → Forgot Password. If the issue persists, visit the IT Help Desk in ADM-103 with your laptop or phone — they can re-provision your account.

Q: I forgot my portal password.
A: Reset it through portal.nu.edu.pk using your nu.edu.pk email and registered mobile number. The reset link expires in 30 minutes. If you don't receive the reset email, check your spam folder; if it's still missing, contact helpdesk@nu.edu.pk from any email account that includes your roll number.

Q: I'm not seeing all my courses on the portal.
A: This usually means a course-registration issue. Confirm with the Registrar's office whether your add/drop went through. The portal updates within 4 hours of registration changes.

Q: How do I access HEC Digital Library and IEEE Xplore?
A: Both are accessible from any device on the NU-Student or NU-Faculty network without additional login. From off-campus, log into portal.nu.edu.pk → Library → Digital Resources, which proxies access through the university subscription.`,
  },
];
