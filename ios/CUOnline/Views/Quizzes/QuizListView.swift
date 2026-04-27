import SwiftUI

struct QuizListView: View {
    let course: Course
    let tint: CourseTint
    @State private var vm: QuizListViewModel

    init(course: Course, tint: CourseTint) {
        self.course = course
        self.tint = tint
        _vm = State(initialValue: QuizListViewModel(courseCode: course.courseCode))
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                heading

                if let error = vm.errorMessage {
                    ErrorBanner(message: error)
                }

                if vm.isLoading && vm.quizzes.isEmpty {
                    ProgressView().frame(maxWidth: .infinity).padding(.top, 40)
                } else if vm.quizzes.isEmpty {
                    Text("No quizzes yet").font(.cuCaption).foregroundStyle(.secondary)
                        .frame(maxWidth: .infinity).padding(.top, 40)
                } else {
                    LazyVStack(spacing: 8) {
                        ForEach(vm.quizzes) { quiz in
                            NavigationLink {
                                TakeQuizView(assessment: quiz, tint: tint)
                            } label: {
                                row(quiz)
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
        .navigationTitle("Quizzes")
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

    private func row(_ quiz: Assessment) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(quiz.title).font(.system(size: 15, weight: .semibold)).foregroundStyle(.primary)
            HStack(spacing: 8) {
                Text(vm.status(for: quiz))
                    .font(.cuCaption)
                    .foregroundStyle(tint.color)
                Spacer()
                if let end = quiz.scheduleEnd {
                    Text(end.formatted(date: .abbreviated, time: .shortened))
                        .font(.cuCaption).foregroundStyle(.secondary)
                }
            }
        }
        .padding(14)
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }
}
