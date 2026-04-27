import SwiftUI

struct AIIntroView: View {
    @State private var pushToChat = false

    var body: some View {
        ZStack {
            VStack(spacing: 24) {
                Spacer()
                Circle()
                    .fill(Color.brandBlue.opacity(0.12))
                    .frame(width: 140, height: 140)
                    .overlay(
                        Image(systemName: "sparkles")
                            .font(.system(size: 56, weight: .semibold))
                            .foregroundStyle(Color.brandBlue)
                    )
                VStack(spacing: 8) {
                    Text("Your AI Assistant")
                        .font(.cuTitle).foregroundStyle(Color.brandBlue)
                    Text("Ask questions and receive answers about your campus, schedule, and policies, powered by Claude.")
                        .font(.cuCaption)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 40)
                }
                Spacer()
                PrimaryButton(title: "Continue", systemImage: "arrow.right") {
                    pushToChat = true
                }
                .padding(.horizontal, 28)
                .padding(.bottom, 40)
            }
        }
        .background(Color(.systemBackground))
        .navigationTitle("AI Assistant")
        .navigationBarTitleDisplayMode(.inline)
        .navigationDestination(isPresented: $pushToChat) {
            AIChatView()
        }
    }
}
