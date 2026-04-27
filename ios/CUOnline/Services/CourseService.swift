import Foundation
import Supabase

struct CourseService {
    private var client: SupabaseClient { SupabaseService.client }

    func enrollments(for studentId: UUID) async throws -> [CourseEnrollment] {
        try await client
            .from("course_enrollments")
            .select()
            .eq("student_id", value: studentId)
            .execute()
            .value
    }

    func courses(byCodes codes: [String]) async throws -> [Course] {
        guard !codes.isEmpty else { return [] }
        return try await client
            .from("courses")
            .select()
            .in("course_code", values: codes)
            .order("course_code", ascending: true)
            .execute()
            .value
    }

    func enrolledCourses(for studentId: UUID) async throws -> [Course] {
        let enrollments = try await enrollments(for: studentId)
        let codes = enrollments.map { $0.courseCode }
        return try await courses(byCodes: codes)
    }

    func course(byCode code: String) async throws -> Course? {
        let rows: [Course] = try await client
            .from("courses")
            .select()
            .eq("course_code", value: code)
            .limit(1)
            .execute()
            .value
        return rows.first
    }
}
