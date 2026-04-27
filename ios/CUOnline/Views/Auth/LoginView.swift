import SwiftUI

struct LoginView: View {
    @State private var vm = AuthViewModel()
    @State private var showForgotSheet = false

    var body: some View {
        ZStack(alignment: .top) {
            HeaderShape()
                .fill(Color.brandBlue)
                .frame(height: 240)
                .ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    Spacer().frame(height: 200)
                    Text(vm.mode == .signIn ? "Login" : "Sign up")
                        .font(.cuTitle)
                        .padding(.bottom, 4)

                    VStack(alignment: .leading, spacing: 14) {
                        if vm.mode == .signUp {
                            field(label: "Username", text: $vm.username)
                        }
                        field(label: "Email", text: $vm.email, keyboard: .emailAddress)
                        field(label: "Password", text: $vm.password, secure: true)
                    }

                    if let error = vm.errorMessage {
                        ErrorBanner(message: error)
                    }

                    if vm.mode == .signIn {
                        Button("Forgot Password?") { showForgotSheet = true }
                            .font(.cuCaption)
                            .foregroundStyle(Color.brandBlue)
                    }

                    PrimaryButton(
                        title: vm.mode == .signIn ? "Login" : "Create Account",
                        isLoading: vm.isLoading,
                        disabled: !vm.canSubmit
                    ) {
                        Task { _ = await vm.submit() }
                    }

                    HStack {
                        Text(vm.mode == .signIn ? "New here?" : "Have an account?")
                            .foregroundStyle(.secondary)
                        Button(vm.mode == .signIn ? "Sign up" : "Sign in") { vm.toggleMode() }
                            .foregroundStyle(Color.brandBlue)
                    }
                    .font(.cuCaption)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding(.top, 8)

                    HStack(spacing: 16) {
                        Button("Terms of Service") {}
                        Text("·").foregroundStyle(.secondary)
                        Button("Privacy Policy") {}
                    }
                    .font(.system(size: 11))
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding(.top, 24)
                }
                .padding(.horizontal, 24)
            }
        }
        .background(Color(.systemBackground))
        .sheet(isPresented: $showForgotSheet) {
            ForgotPasswordSheet(prefilledEmail: vm.email)
                .presentationDetents([.medium])
        }
    }

    @ViewBuilder
    private func field(label: String, text: Binding<String>, keyboard: UIKeyboardType = .default, secure: Bool = false) -> some View {
        Group {
            if secure {
                SecureField(label, text: text)
            } else {
                TextField(label, text: text)
                    .keyboardType(keyboard)
                    .textInputAutocapitalization(keyboard == .emailAddress ? .never : .sentences)
                    .autocorrectionDisabled(keyboard == .emailAddress)
            }
        }
        .padding(.horizontal, 18)
        .frame(height: 48)
        .background(Color(.secondarySystemBackground))
        .clipShape(Capsule())
    }
}

struct ForgotPasswordSheet: View {
    let prefilledEmail: String
    @Environment(\.dismiss) private var dismiss

    enum Step { case email, code, password }

    @State private var step: Step = .email
    @State private var email: String = ""
    @State private var code: String = ""
    @State private var newPassword: String = ""
    @State private var confirmPassword: String = ""
    @State private var isBusy = false
    @State private var errorMessage: String?

    private let auth = AuthService()

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    header

                    switch step {
                    case .email: emailStep
                    case .code: codeStep
                    case .password: passwordStep
                    }

                    if let errorMessage {
                        ErrorBanner(message: errorMessage)
                    }

                    primaryButton
                    if step != .email { backButton }
                }
                .padding(.horizontal, 24)
                .padding(.top, 16)
                .padding(.bottom, 32)
            }
            .navigationTitle("Forgot Password")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Close") { dismiss() }
                }
            }
            .onAppear {
                if email.isEmpty { email = prefilledEmail }
            }
        }
    }

    @ViewBuilder
    private var header: some View {
        switch step {
        case .email:
            Text("We'll email you a 6-digit verification code.")
                .font(.cuCaption).foregroundStyle(.secondary)
        case .code:
            Text("Enter the 6-digit code sent to \(email).")
                .font(.cuCaption).foregroundStyle(.secondary)
        case .password:
            Text("Pick a new password (at least 6 characters).")
                .font(.cuCaption).foregroundStyle(.secondary)
        }
    }

    private var emailStep: some View {
        TextField("Email", text: $email)
            .keyboardType(.emailAddress)
            .textInputAutocapitalization(.never)
            .autocorrectionDisabled()
            .padding(.horizontal, 18).frame(height: 48)
            .background(Color(.secondarySystemBackground))
            .clipShape(Capsule())
    }

    private var codeStep: some View {
        VStack(alignment: .leading, spacing: 8) {
            TextField("123456", text: $code)
                .keyboardType(.numberPad)
                .textContentType(.oneTimeCode)
                .font(.system(size: 24, weight: .semibold, design: .monospaced))
                .multilineTextAlignment(.center)
                .padding(.horizontal, 18).frame(height: 56)
                .background(Color(.secondarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                .onChange(of: code) { _, new in
                    code = String(new.filter(\.isNumber).prefix(6))
                }
            Button("Resend code") {
                Task { await sendCode() }
            }
            .font(.cuCaption)
            .foregroundStyle(Color.brandBlue)
            .disabled(isBusy)
        }
    }

    private var passwordStep: some View {
        VStack(spacing: 12) {
            SecureField("New password", text: $newPassword)
                .textContentType(.newPassword)
                .padding(.horizontal, 18).frame(height: 48)
                .background(Color(.secondarySystemBackground))
                .clipShape(Capsule())
            SecureField("Confirm new password", text: $confirmPassword)
                .textContentType(.newPassword)
                .padding(.horizontal, 18).frame(height: 48)
                .background(Color(.secondarySystemBackground))
                .clipShape(Capsule())
        }
    }

    private var primaryButton: some View {
        PrimaryButton(
            title: primaryTitle,
            isLoading: isBusy,
            disabled: !canSubmit
        ) {
            Task {
                switch step {
                case .email: await sendCode()
                case .code: await verifyCode()
                case .password: await submitNewPassword()
                }
            }
        }
        .padding(.top, 4)
    }

    private var backButton: some View {
        Button("Back") {
            errorMessage = nil
            step = (step == .password) ? .code : .email
        }
        .frame(maxWidth: .infinity)
        .foregroundStyle(.secondary)
        .padding(.top, 4)
    }

    private var primaryTitle: String {
        switch step {
        case .email: return "Send Code"
        case .code: return "Verify"
        case .password: return "Update Password"
        }
    }

    private var canSubmit: Bool {
        if isBusy { return false }
        switch step {
        case .email:
            return email.trimmingCharacters(in: .whitespaces).contains("@")
        case .code:
            return code.count == 6
        case .password:
            return newPassword.count >= 6 && newPassword == confirmPassword
        }
    }

    private func sendCode() async {
        let trimmed = email.trimmingCharacters(in: .whitespaces)
        isBusy = true
        errorMessage = nil
        defer { isBusy = false }
        do {
            try await auth.sendPasswordReset(email: trimmed)
            step = .code
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func verifyCode() async {
        isBusy = true
        errorMessage = nil
        defer { isBusy = false }
        do {
            try await auth.verifyResetCode(
                email: email.trimmingCharacters(in: .whitespaces),
                code: code
            )
            step = .password
        } catch {
            errorMessage = "That code didn't match. Try again or resend."
        }
    }

    private func submitNewPassword() async {
        isBusy = true
        errorMessage = nil
        defer { isBusy = false }
        do {
            try await auth.updatePassword(newPassword: newPassword)
            try? await Task.sleep(for: .seconds(0.4))
            dismiss()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

private struct HeaderShape: Shape {
    func path(in rect: CGRect) -> Path {
        var p = Path()
        p.move(to: .zero)
        p.addLine(to: CGPoint(x: rect.maxX, y: 0))
        p.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY * 0.85))
        p.addQuadCurve(
            to: CGPoint(x: 0, y: rect.maxY),
            control: CGPoint(x: rect.midX, y: rect.maxY + 30)
        )
        p.closeSubpath()
        return p
    }
}
