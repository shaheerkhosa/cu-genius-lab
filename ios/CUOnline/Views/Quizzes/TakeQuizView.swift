import SwiftUI

struct TakeQuizView: View {
    let assessment: Assessment
    let tint: CourseTint
    @State private var vm: TakeQuizViewModel

    init(assessment: Assessment, tint: CourseTint) {
        self.assessment = assessment
        self.tint = tint
        _vm = State(initialValue: TakeQuizViewModel(assessment: assessment))
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text(assessment.title)
                    .font(.cuTitle)
                    .foregroundStyle(tint.foreground)
                    .padding(20)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(tint.color)
                    .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))

                if let error = vm.errorMessage {
                    ErrorBanner(message: error)
                }

                if let score = vm.submittedScore {
                    completionCard(score: score.score, total: score.total)
                } else if vm.isLoading {
                    ProgressView().padding(.top, 40)
                } else if vm.questions.isEmpty {
                    Text("No questions available.").font(.cuCaption).foregroundStyle(.secondary)
                } else {
                    LazyVStack(spacing: 12) {
                        ForEach(Array(vm.questions.enumerated()), id: \.element.id) { index, q in
                            questionCard(index: index, q: q)
                        }
                    }
                    PrimaryButton(
                        title: "Submit Quiz",
                        isLoading: vm.isSubmitting,
                        background: tint.color,
                        foreground: tint.foreground
                    ) {
                        Task { await vm.submit() }
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 32)
        }
        .background(Color(.systemBackground))
        .navigationTitle("Quiz")
        .navigationBarTitleDisplayMode(.inline)
        .task { await vm.start() }
    }

    private func completionCard(score: Double, total: Double) -> some View {
        VStack(spacing: 8) {
            Image(systemName: "checkmark.seal.fill").font(.system(size: 36)).foregroundStyle(.green)
            Text("Submitted").font(.cuHeading)
            Text("\(format(score)) / \(format(total))").font(.system(size: 28, weight: .bold))
        }
        .padding(24)
        .frame(maxWidth: .infinity)
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
    }

    private func questionCard(index: Int, q: QuizQuestion) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Q\(index + 1). \(q.questionText)")
                .font(.system(size: 15, weight: .semibold))
            ForEach(["A", "B", "C", "D"], id: \.self) { letter in
                option(q: q, letter: letter)
            }
        }
        .padding(14)
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }

    private func option(q: QuizQuestion, letter: String) -> some View {
        let selected = vm.answers[q.id] == letter
        return Button {
            vm.answers[q.id] = letter
        } label: {
            HStack {
                Image(systemName: selected ? "largecircle.fill.circle" : "circle")
                    .foregroundStyle(selected ? tint.color : .secondary)
                Text("\(letter). \(q.text(for: letter))")
                    .font(.cuBody)
                    .foregroundStyle(.primary)
                Spacer()
            }
            .padding(.vertical, 6)
        }
    }

    private func format(_ value: Double) -> String {
        value.rounded() == value ? "\(Int(value))" : String(format: "%.1f", value)
    }
}
