import SwiftUI

struct CourseDetailView: View {
    let course: Course
    let tint: CourseTint
    @State private var vm: CourseDetailViewModel

    init(course: Course, tint: CourseTint) {
        self.course = course
        self.tint = tint
        _vm = State(initialValue: CourseDetailViewModel(course: course, tint: tint))
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                hero
                attendanceCard
                actionRow
                assignmentsLink
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 32)
        }
        .background(Color(.systemBackground))
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .principal) {
                Text(course.courseName).font(.cuHeading)
            }
        }
        .task { await vm.load() }
        .refreshable { await vm.load() }
    }

    private var hero: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(course.courseName)
                .font(.cuTitle)
                .foregroundStyle(tint.foreground)
            Text(course.department)
                .font(.cuCaption)
                .foregroundStyle(tint.foreground.opacity(0.85))
        }
        .padding(20)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(tint.color)
        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
    }

    private var attendanceCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                statBlock("Absents", value: "\(vm.attendance?.absent ?? 0)")
                statBlock("Presents", value: "\(vm.attendance?.present ?? 0)")
            }
            HStack {
                Text("Total Attendance")
                    .font(.cuCaption)
                    .foregroundStyle(.secondary)
                Spacer()
                Text("\(Int(vm.attendance?.percentage ?? 0))%")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(tint.color)
            }
            ProgressView(value: (vm.attendance?.percentage ?? 0) / 100)
                .tint(tint.color)
        }
        .padding(16)
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
    }

    private func statBlock(_ label: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label).font(.cuCaption).foregroundStyle(.secondary)
            Text(value).font(.system(size: 22, weight: .bold))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var actionRow: some View {
        VStack(spacing: 12) {
            NavigationLink {
                AttendanceSummaryView(course: course, tint: tint)
            } label: {
                rowButton(title: "Attendance Summary")
            }
            NavigationLink {
                MarksSummaryView(course: course, tint: tint)
            } label: {
                rowButton(title: "Marks Summary")
            }
            NavigationLink {
                QuizListView(course: course, tint: tint)
            } label: {
                rowButton(title: "Quizzes")
            }
        }
    }

    private func rowButton(title: String) -> some View {
        HStack {
            Text(title).font(.system(size: 15, weight: .semibold))
            Spacer()
            Image(systemName: "chevron.right").foregroundStyle(.secondary)
        }
        .padding(16)
        .frame(maxWidth: .infinity)
        .background(Color(.secondarySystemBackground))
        .foregroundStyle(.primary)
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }

    private var assignmentsLink: some View {
        NavigationLink {
            AssignmentsListView(course: course, tint: tint)
        } label: {
            HStack {
                Image(systemName: "doc.text")
                Text("Assignments").font(.system(size: 15, weight: .semibold))
                Spacer()
                Image(systemName: "chevron.right")
            }
            .padding(16)
            .background(tint.color.opacity(0.15))
            .foregroundStyle(tint.color)
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        }
    }
}
