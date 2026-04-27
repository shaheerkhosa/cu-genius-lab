import Foundation
import Observation

@MainActor
@Observable
final class AttendanceViewModel {
    enum Filter: Hashable, CaseIterable { case summary, present, absent }

    let courseCode: String
    var records: [Attendance] = []
    var summary: AttendanceSummary?
    var isLoading = false
    var errorMessage: String?
    var filter: Filter = .summary

    private let auth = AuthService()
    private let service = AttendanceService()

    init(courseCode: String) { self.courseCode = courseCode }

    var filteredRecords: [Attendance] {
        switch filter {
        case .summary: return records
        case .present: return records.filter { $0.mark == .present }
        case .absent: return records.filter { $0.mark == .absent }
        }
    }

    func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            let userId = try await auth.currentUserId()
            let rows = try await service.records(studentId: userId, courseCode: courseCode)
            self.records = rows

            var present = 0, absent = 0, late = 0
            for r in rows {
                switch r.mark {
                case .present: present += 1
                case .absent: absent += 1
                case .late: late += 1
                case .none: break
                }
            }
            self.summary = AttendanceSummary(
                courseCode: courseCode,
                total: rows.count,
                present: present,
                absent: absent,
                late: late
            )
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
