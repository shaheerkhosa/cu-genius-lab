import SwiftUI

struct GetStartedView: View {
    @Environment(AppState.self) private var appState

    var body: some View {
        ZStack {
            BackgroundShapes()
            VStack(spacing: 0) {
                Spacer()
                Circle()
                    .fill(Color.white)
                    .frame(width: 92, height: 92)
                    .overlay(
                        Image(systemName: "graduationcap.fill")
                            .font(.system(size: 38, weight: .semibold))
                            .foregroundStyle(Color.brandBlue)
                    )
                    .shadow(color: .black.opacity(0.15), radius: 16, y: 6)
                Text("CUOnline")
                    .font(.cuTitle)
                    .foregroundStyle(Color.brandBlue)
                    .padding(.top, 18)
                Text("Student Portal Application")
                    .font(.cuCaption)
                    .foregroundStyle(.secondary)
                Spacer()
                PrimaryButton(title: "Get Started", systemImage: "arrow.right") {
                    appState.hasOnboarded = true
                }
                .padding(.horizontal, 28)
                .padding(.bottom, 40)
            }
        }
    }
}

private struct BackgroundShapes: View {
    var body: some View {
        GeometryReader { geo in
            ZStack {
                Color(.systemBackground)
                Path { p in
                    p.move(to: .zero)
                    p.addLine(to: CGPoint(x: geo.size.width, y: 0))
                    p.addLine(to: CGPoint(x: geo.size.width, y: geo.size.height * 0.35))
                    p.addLine(to: .init(x: 0, y: geo.size.height * 0.55))
                    p.closeSubpath()
                }
                .fill(Color.brandBlue.opacity(0.18))
                Path { p in
                    p.move(to: .init(x: 0, y: geo.size.height * 0.45))
                    p.addLine(to: .init(x: geo.size.width, y: geo.size.height * 0.20))
                    p.addLine(to: .init(x: geo.size.width, y: geo.size.height * 0.50))
                    p.addLine(to: .init(x: 0, y: geo.size.height * 0.65))
                    p.closeSubpath()
                }
                .fill(Color.brandBlue.opacity(0.32))
            }
            .ignoresSafeArea()
        }
    }
}
