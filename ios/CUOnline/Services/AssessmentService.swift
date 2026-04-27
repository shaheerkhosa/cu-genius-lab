import Foundation
import Supabase

struct AssessmentService {
    private var client: SupabaseClient { SupabaseService.client }

    func assessments(courseCode: String, onlineQuiz: Bool? = nil) async throws -> [Assessment] {
        var query = client
            .from("assessments")
            .select()
            .eq("course_code", value: courseCode)
        if let onlineQuiz {
            query = query.eq("is_online_quiz", value: onlineQuiz)
        }
        return try await query
            .order("schedule_end", ascending: false)
            .execute()
            .value
    }

    func studentMarks(studentId: UUID, courseCode: String? = nil) async throws -> [StudentMark] {
        // Inner join with assessments via embedded select to filter by course_code if needed.
        if let courseCode {
            struct MarkWithAssessment: Decodable {
                let id: UUID
                let assessment_id: UUID
                let student_id: UUID?
                let student_name: String
                let student_roll_number: String
                let marks_obtained: Double?
                let submission_file_path: String?
                let remarks: String?
                let created_at: Date
                let updated_at: Date
                let assessments: AssessmentRef?

                struct AssessmentRef: Decodable {
                    let course_code: String
                }
            }
            let rows: [MarkWithAssessment] = try await client
                .from("student_marks")
                .select("*, assessments!inner(course_code)")
                .eq("student_id", value: studentId)
                .eq("assessments.course_code", value: courseCode)
                .execute()
                .value
            return rows.map { row in
                StudentMark(
                    id: row.id,
                    assessmentId: row.assessment_id,
                    studentId: row.student_id,
                    studentName: row.student_name,
                    studentRollNumber: row.student_roll_number,
                    marksObtained: row.marks_obtained,
                    submissionFilePath: row.submission_file_path,
                    remarks: row.remarks,
                    createdAt: row.created_at,
                    updatedAt: row.updated_at
                )
            }
        }

        return try await client
            .from("student_marks")
            .select()
            .eq("student_id", value: studentId)
            .execute()
            .value
    }

    func submitAssignment(
        assessmentId: UUID,
        studentId: UUID,
        studentName: String,
        rollNumber: String,
        filePath: String?
    ) async throws {
        struct Insert: Encodable {
            let assessment_id: UUID
            let student_id: UUID
            let student_name: String
            let student_roll_number: String
            let submission_file_path: String?
        }
        try await client
            .from("student_marks")
            .insert(Insert(
                assessment_id: assessmentId,
                student_id: studentId,
                student_name: studentName,
                student_roll_number: rollNumber,
                submission_file_path: filePath
            ))
            .execute()
    }
}
