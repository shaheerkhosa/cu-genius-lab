import Foundation
import Observation
import Supabase

@MainActor
@Observable
final class AppState {
    var session: Session?
    var profile: Profile?
    var isBootstrapping = true
    var hasOnboarded: Bool {
        didSet { UserDefaults.standard.set(hasOnboarded, forKey: "hasOnboarded") }
    }

    private let auth = AuthService()

    init() {
        self.hasOnboarded = UserDefaults.standard.bool(forKey: "hasOnboarded")
    }

    func bootstrap() async {
        session = await auth.currentSession()
        if session != nil {
            profile = try? await auth.fetchProfile()
        }
        isBootstrapping = false
        Task { await observeAuth() }
    }

    private func observeAuth() async {
        for await event in auth.authStateChanges() {
            switch event {
            case .signedIn, .tokenRefreshed, .userUpdated:
                session = await auth.currentSession()
                profile = try? await auth.fetchProfile()
            case .signedOut:
                session = nil
                profile = nil
            default:
                break
            }
        }
    }

    var isSignedIn: Bool { session != nil }
    var displayName: String { profile?.username ?? "Student" }
}
