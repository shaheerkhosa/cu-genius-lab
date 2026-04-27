import SwiftUI

struct AttendanceSummaryView: View {
    let course: Course
    let tint: CourseTint
    @State private var vm: AttendanceViewModel

    init(course: Course, tint: CourseTint) {
        self.course = course
        self.tint = tint
        _vm = State(initialValue: AttendanceViewModel(courseCode: course.courseCode))
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                heading
                PillTabs(
                    options: [
                        (.summary, "Summary"),
                        (.present, "Present"),
                        (.absent, "Absent")
                    ],
                    selection: $vm.filter,
                    tint: tint.color
                )

                if let error = vm.errorMessage {
                    ErrorBanner(message: error)
                }

                if vm.isLoading && vm.records.isEmpty {
                    ProgressView().padding(.top, 40)
                } else if vm.filteredRecords.isEmpty {
                    Text("No records").font(.cuCaption).foregroundStyle(.secondary).padding(.top, 40)
                } else {
                    VStack(spacing: 8) {
                        ForEach(vm.filteredRecords) { record in
                            recordRow(record)
                        }
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 32)
        }
        .background(Color(.systemBackground))
        .navigationTitle("Attendance Summary")
        .navigationBarTitleDisplayMode(.inline)
        .task { await vm.load() }
        .refreshable { await vm.load() }
    }

    private var heading: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(course.courseName).font(.cuTitle).foregroundStyle(tint.foreground)
            if let summary = vm.summary {
                Text("Present \(summary.present) · Absent \(summary.absent) · Late \(summary.late)")
                    .font(.cuCaption)
                    .foregroundStyle(tint.foreground.opacity(0.85))
            }
        }
        .padding(20)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(tint.color)
        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
    }

    private func recordRow(_ record: Attendance) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(record.date).font(.system(size: 14, weight: .semibold))
                Text(course.courseCode).font(.cuCaption).foregroundStyle(.secondary)
            }
            Spacer()
            statusPill(record.status)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }

    private func statusPill(_ status: String) -> some View {
        let color: Color = {
            switch status.lowercased() {
            case "present": return .green
            case "absent": return .red
            case "late": return .orange
            default: return .gray
            }
        }()
        return Text(status.capitalized)
            .font(.system(size: 12, weight: .semibold))
            .padding(.horizontal, 10)
            .padding(.vertical, 4)
            .background(color.opacity(0.15))
            .foregroundStyle(color)
            .clipShape(Capsule())
    }
}
