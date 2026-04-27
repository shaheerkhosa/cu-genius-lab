import SwiftUI

struct RootView: View {
    @Environment(AppState.self) private var appState
    @State private var showSplash = true

    var body: some View {
        ZStack {
            content
                .opacity(showSplash ? 0 : 1)
            if showSplash {
                SplashView()
                    .transition(.opacity)
            }
        }
        .task {
            await appState.bootstrap()
            try? await Task.sleep(for: .seconds(0.6))
            withAnimation(.easeInOut(duration: 0.35)) { showSplash = false }
        }
    }

    @ViewBuilder
    private var content: some View {
        if appState.isBootstrapping {
            Color(.systemBackground).ignoresSafeArea()
        } else if !appState.hasOnboarded {
            GetStartedView()
        } else if appState.isSignedIn {
            MainTabView()
        } else {
            LoginView()
        }
    }
}
