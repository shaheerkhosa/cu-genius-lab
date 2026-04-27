import Foundation
import Supabase

struct AttendanceService {
    private var client: SupabaseClient { SupabaseService.client }

    func records(studentId: UUID, courseCode: String? = nil) async throws -> [Attendance] {
        var query = client
            .from("attendance")
            .select()
            .eq("student_id", value: studentId)
        if let courseCode {
            query = query.eq("course_code", value: courseCode)
        }
        return try await query
            .order("date", ascending: false)
            .execute()
            .value
    }

    func summary(studentId: UUID, courseCode: String) async throws -> AttendanceSummary {
        let rows = try await records(studentId: studentId, courseCode: courseCode)
        var present = 0, absent = 0, late = 0
        for row in rows {
            switch row.mark {
            case .present: present += 1
            case .absent: absent += 1
            case .late: late += 1
            case .none: break
            }
        }
        return AttendanceSummary(
            courseCode: courseCode,
            total: rows.count,
            present: present,
            absent: absent,
            late: late
        )
    }
}
