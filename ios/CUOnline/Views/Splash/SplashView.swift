import SwiftUI

struct SplashView: View {
    var body: some View {
        ZStack {
            Color(.systemBackground).ignoresSafeArea()
            VStack(spacing: 16) {
                Circle()
                    .fill(Color.brandBlue.opacity(0.1))
                    .frame(width: 96, height: 96)
                    .overlay(
                        Image(systemName: "graduationcap.fill")
                            .font(.system(size: 40, weight: .semibold))
                            .foregroundStyle(Color.brandBlue)
                    )
                Text("CUOnline")
                    .font(.cuTitle)
                    .foregroundStyle(Color.brandBlue)
                Text("Student Portal")
                    .font(.cuCaption)
                    .foregroundStyle(.secondary)
            }
        }
    }
}
