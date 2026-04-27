import SwiftUI

struct MarksSummaryView: View {
    let course: Course
    let tint: CourseTint
    @State private var vm: MarksViewModel

    init(course: Course, tint: CourseTint) {
        self.course = course
        self.tint = tint
        _vm = State(initialValue: MarksViewModel(courseCode: course.courseCode))
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                heading

                if let error = vm.errorMessage {
                    ErrorBanner(message: error)
                }
                if vm.isLoading && vm.assessments.isEmpty {
                    ProgressView().frame(maxWidth: .infinity).padding(.top, 40)
                } else {
                    ForEach(vm.groups) { group in
                        sectionView(group)
                    }
                    if vm.groups.isEmpty {
                        Text("No assessments yet").font(.cuCaption).foregroundStyle(.secondary)
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 32)
        }
        .background(Color(.systemBackground))
        .navigationTitle("Marks Summary")
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

    private func sectionView(_ group: MarksViewModel.Group) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(group.type.capitalized + " Marks")
                .font(.cuHeading)
            VStack(spacing: 8) {
                ForEach(group.items) { item in
                    itemRow(item)
                }
            }
        }
    }

    private func itemRow(_ item: MarksViewModel.Group.Item) -> some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 2) {
                Text(item.title).font(.system(size: 14, weight: .semibold))
                if let date = item.date {
                    Text(date.formatted(date: .abbreviated, time: .omitted))
                        .font(.cuCaption).foregroundStyle(.secondary)
                }
            }
            Spacer()
            VStack(alignment: .trailing) {
                if let obtained = item.obtained {
                    Text("\(formatted(obtained)) / \(formatted(item.totalMarks))")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(tint.color)
                } else {
                    Text("Pending").font(.cuCaption).foregroundStyle(.secondary)
                }
            }
        }
        .padding(14)
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }

    private func formatted(_ value: Double) -> String {
        value.rounded() == value ? "\(Int(value))" : String(format: "%.1f", value)
    }
}
