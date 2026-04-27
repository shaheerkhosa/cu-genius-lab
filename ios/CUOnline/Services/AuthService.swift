import Foundation
import Supabase

enum AuthError: LocalizedError {
    case notAuthenticated
    case profileMissing
    case wrongPassword

    var errorDescription: String? {
        switch self {
        case .notAuthenticated: return "You're not signed in."
        case .profileMissing: return "Profile record not found."
        case .wrongPassword: return "Current password is incorrect."
        }
    }
}

struct AuthService {
    private var client: SupabaseClient { SupabaseService.client }

    func currentSession() async -> Session? {
        try? await client.auth.session
    }

    func currentUserId() async throws -> UUID {
        guard let session = try? await client.auth.session else {
            throw AuthError.notAuthenticated
        }
        return session.user.id
    }

    func signIn(email: String, password: String) async throws -> Session {
        try await client.auth.signIn(email: email, password: password)
    }

    @discardableResult
    func signUp(email: String, password: String, username: String) async throws -> Session? {
        let response = try await client.auth.signUp(
            email: email,
            password: password,
            data: [
                "username": .string(username),
                "portal_type": .string("student")
            ]
        )
        return response.session
    }

    func signOut() async throws {
        try await client.auth.signOut()
    }

    func updatePassword(newPassword: String) async throws {
        try await client.auth.update(user: UserAttributes(password: newPassword))
    }

    /// Sends a 6-digit verification code via Supabase Auth's recovery email.
    /// The email template (in supabase/templates/recovery.html) uses
    /// `{{ .Token }}` so the email contains a code rather than a magic link,
    /// which lets us complete the flow on-device without any redirect.
    func sendPasswordReset(email: String) async throws {
        try await client.auth.resetPasswordForEmail(email)
    }

    /// Verifies the recovery code from the email. On success Supabase opens
    /// a recovery session, after which `updatePassword` will succeed.
    func verifyResetCode(email: String, code: String) async throws {
        try await client.auth.verifyOTP(email: email, token: code, type: .recovery)
    }

    /// Verifies the user knows their current password by re-signing in with
    /// it, then rotates to `newPassword`. Throws `AuthError.wrongPassword` if
    /// the current password check fails.
    func changePassword(currentPassword: String, newPassword: String) async throws {
        guard let session = try? await client.auth.session,
              let email = session.user.email else {
            throw AuthError.notAuthenticated
        }
        do {
            _ = try await client.auth.signIn(email: email, password: currentPassword)
        } catch {
            throw AuthError.wrongPassword
        }
        try await client.auth.update(user: UserAttributes(password: newPassword))
    }

    func fetchProfile() async throws -> Profile {
        let userId = try await currentUserId()
        let profile: Profile = try await client
            .from("profiles")
            .select()
            .eq("id", value: userId)
            .single()
            .execute()
            .value
        return profile
    }

    func updateProfile(username: String) async throws {
        let userId = try await currentUserId()
        try await client
            .from("profiles")
            .update(["username": username])
            .eq("id", value: userId)
            .execute()
    }

    func authStateChanges() -> AsyncStream<AuthChangeEvent> {
        AsyncStream { continuation in
            let task = Task {
                for await change in client.auth.authStateChanges {
                    continuation.yield(change.event)
                }
            }
            continuation.onTermination = { _ in task.cancel() }
        }
    }
}
