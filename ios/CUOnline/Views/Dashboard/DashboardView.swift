import SwiftUI

struct DashboardView: View {
    @Environment(AppState.self) private var appState
    @State private var vm = DashboardViewModel()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                header

                if let error = vm.errorMessage {
                    ErrorBanner(message: error).padding(.horizontal, 20)
                }

                Section {
                    if vm.isLoading && vm.courses.isEmpty {
                        ProgressView().frame(maxWidth: .infinity).padding(.vertical, 32)
                    } else if vm.courses.isEmpty {
                        emptyState
                    } else {
                        coursesGrid
                    }
                } header: {
                    sectionHeader("Courses", trailing: "View All")
                }
            }
            .padding(.bottom, 32)
        }
        .background(Color(.systemBackground))
        .navigationBarHidden(true)
        .task { await vm.load() }
        .refreshable { await vm.load() }
    }

    private var header: some View {
        HStack(alignment: .center, spacing: 12) {
            VStack(alignment: .leading, spacing: 2) {
                Text("Hello,")
                    .font(.system(size: 16))
                    .foregroundStyle(.secondary)
                Text(appState.displayName)
                    .font(.cuTitle)
            }
            Spacer()
            Image(systemName: "bell")
                .font(.system(size: 18, weight: .semibold))
                .padding(10)
                .background(Color.brandBlue.opacity(0.12))
                .clipShape(Circle())
                .foregroundStyle(Color.brandBlue)
        }
        .padding(.horizontal, 20)
        .padding(.top, 8)
    }

    private func sectionHeader(_ title: String, trailing: String? = nil) -> some View {
        HStack {
            Text(title).font(.cuHeading)
            Spacer()
            if let trailing {
                Text(trailing)
                    .font(.cuCaption)
                    .foregroundStyle(Color.brandBlue)
            }
        }
        .padding(.horizontal, 20)
    }

    private var coursesGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)], spacing: 12) {
            ForEach(Array(vm.courses.enumerated()), id: \.element.id) { index, course in
                NavigationLink {
                    CourseDetailView(course: course, tint: CourseTint.tint(for: index))
                } label: {
                    CourseCardView(
                        course: course,
                        tint: CourseTint.tint(for: index),
                        attendance: vm.attendanceByCourse[course.courseCode]
                    )
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 20)
    }

    private var emptyState: some View {
        VStack(spacing: 8) {
            Image(systemName: "books.vertical")
                .font(.system(size: 32))
                .foregroundStyle(.secondary)
            Text("No courses yet").font(.cuHeading)
            Text("You'll see your enrolled courses here once registration is active.")
                .font(.cuCaption)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(.vertical, 40)
        .frame(maxWidth: .infinity)
    }
}
