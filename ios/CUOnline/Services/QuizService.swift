import Foundation
import Supabase

struct QuizService {
    private var client: SupabaseClient { SupabaseService.client }

    func quizzes(forCourse code: String) async throws -> [Assessment] {
        try await client
            .from("assessments")
            .select()
            .eq("course_code", value: code)
            .eq("is_online_quiz", value: true)
            .order("schedule_start", ascending: false)
            .execute()
            .value
    }

    func questions(for assessmentId: UUID) async throws -> [QuizQuestion] {
        try await client
            .from("quiz_questions")
            .select()
            .eq("assessment_id", value: assessmentId)
            .order("question_order", ascending: true)
            .execute()
            .value
    }

    func attempt(studentId: UUID, assessmentId: UUID) async throws -> QuizAttempt? {
        let rows: [QuizAttempt] = try await client
            .from("quiz_attempts")
            .select()
            .eq("student_id", value: studentId)
            .eq("assessment_id", value: assessmentId)
            .order("started_at", ascending: false)
            .limit(1)
            .execute()
            .value
        return rows.first
    }

    func startAttempt(studentId: UUID, assessmentId: UUID) async throws -> QuizAttempt {
        struct Insert: Encodable {
            let assessment_id: UUID
            let student_id: UUID
        }
        let attempts: [QuizAttempt] = try await client
            .from("quiz_attempts")
            .insert(Insert(assessment_id: assessmentId, student_id: studentId))
            .select()
            .execute()
            .value
        guard let first = attempts.first else {
            throw NSError(domain: "QuizService", code: -1)
        }
        return first
    }

    func submit(
        attemptId: UUID,
        studentId: UUID,
        assessmentId: UUID,
        answers: [(question: QuizQuestion, selected: String?)]
    ) async throws -> QuizAttempt {
        // Insert all responses.
        let responses = answers.map { pair in
            NewQuizResponse(
                assessmentId: assessmentId,
                studentId: studentId,
                questionId: pair.question.id,
                selectedOption: pair.selected,
                isCorrect: pair.selected?.uppercased() == pair.question.correctOption.uppercased()
            )
        }
        if !responses.isEmpty {
            try await client
                .from("quiz_responses")
                .insert(responses)
                .execute()
        }

        let totalMarks = answers.map { $0.question.marks }.reduce(0, +)
        let score = answers
            .filter { $0.selected?.uppercased() == $0.question.correctOption.uppercased() }
            .map { $0.question.marks }
            .reduce(0, +)

        struct Update: Encodable {
            let completed_at: Date
            let score: Double
            let total_marks: Double
        }
        let updated: [QuizAttempt] = try await client
            .from("quiz_attempts")
            .update(Update(completed_at: .now, score: score, total_marks: totalMarks))
            .eq("id", value: attemptId)
            .select()
            .execute()
            .value
        guard let first = updated.first else {
            throw NSError(domain: "QuizService", code: -2)
        }
        return first
    }
}
