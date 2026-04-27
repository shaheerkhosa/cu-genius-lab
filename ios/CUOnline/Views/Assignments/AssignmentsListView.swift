import SwiftUI

struct AssignmentsListView: View {
    let course: Course
    let tint: CourseTint
    @State private var vm: AssignmentsViewModel

    init(course: Course, tint: CourseTint) {
        self.course = course
        self.tint = tint
        _vm = State(initialValue: AssignmentsViewModel(courseCode: course.courseCode))
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                heading
                PillTabs(
                    options: AssignmentsViewModel.Filter.allCases.map { ($0, $0.label) },
                    selection: $vm.filter,
                    tint: tint.color
                )

                if let error = vm.errorMessage {
                    ErrorBanner(message: error)
                }

                if vm.isLoading && vm.assessments.isEmpty {
                    ProgressView().padding(.top, 40)
                } else if vm.filtered.isEmpty {
                    Text("Nothing here").font(.cuCaption).foregroundStyle(.secondary).padding(.top, 40)
                } else {
                    LazyVStack(spacing: 8) {
                        ForEach(vm.filtered) { assessment in
                            NavigationLink {
                                AssignmentBriefView(course: course, tint: tint, assessment: assessment, mark: vm.mark(for: assessment))
                            } label: {
                                row(assessment)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 32)
        }
        .background(Color(.systemBackground))
        .navigationTitle("Assignments")
        .navigationBarTitleDisplayMode(.inline)
        .task { await vm.load() }
        .refreshable { await vm.load() }
    }

    private var heading: some View {
        Text(course.courseName)
            .font(.cuTitle)
            .foregroundStyle(tint.foreground)
            .padding(20)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(tint.color)
            .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
    }

    private func row(_ a: Assessment) -> some View {
        let mark = vm.mark(for: a)
        let status = a.status(submission: mark)
        return HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(a.title).font(.system(size: 15, weight: .semibold)).foregroundStyle(.primary)
                if let due = a.scheduleEnd {
                    Text("Due \(due.formatted(date: .abbreviated, time: .shortened))")
                        .font(.cuCaption).foregroundStyle(.secondary)
                }
            }
            Spacer()
            statusIcon(status)
        }
        .padding(14)
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }

    @ViewBuilder
    private func statusIcon(_ status: Assessment.Status) -> some View {
        switch status {
        case .due:
            Image(systemName: "chevron.right").foregroundStyle(.secondary)
        case .submitted, .finalized:
            Image(systemName: "checkmark.circle.fill").foregroundStyle(.green)
        case .overdue:
            Image(systemName: "exclamationmark.triangle.fill").foregroundStyle(.orange)
        }
    }
}
