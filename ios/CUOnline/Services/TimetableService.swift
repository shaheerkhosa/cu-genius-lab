import Foundation
import Supabase

struct TimetableService {
    private var client: SupabaseClient { SupabaseService.client }

    func entries(forCourseCodes codes: [String]) async throws -> [TimetableEntry] {
        guard !codes.isEmpty else { return [] }
        return try await client
            .from("timetable")
            .select()
            .in("course_code", values: codes)
            .order("day_of_week", ascending: true)
            .order("start_time", ascending: true)
            .execute()
            .value
    }

    func entries(forStudent studentId: UUID) async throws -> [TimetableEntry] {
        let courseService = CourseService()
        let enrollments = try await courseService.enrollments(for: studentId)
        return try await entries(forCourseCodes: enrollments.map { $0.courseCode })
    }
}
