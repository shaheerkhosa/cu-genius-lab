import SwiftUI

struct PrivacyPolicyView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Privacy Policy").font(.cuTitle)
                section("1. Types of data we collect", body: "We collect the email address and username you provide at sign-up, plus academic data scoped to your enrolled courses (attendance, assessment results, submissions). Files you upload as assignments are stored in our Supabase project.")
                section("2. Use of your personal data", body: "Your data is only used to operate the student portal — to show your courses, schedule, and grades, and to power the AI assistant for campus questions.")
                section("3. Disclosure of your personal data", body: "We don't sell your personal data. Your data is shared only with university staff who already have access to it through their teacher or admin role.")
                section("4. Your choices", body: "You can update your profile or change your password at any time from Settings. To delete your account, contact your campus IT support.")
                section("5. Contact", body: "If you have questions about this policy, reach out to your university's Office of Student Affairs.")
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 20)
            .padding(.top, 16)
            .padding(.bottom, 32)
        }
        .background(Color(.systemBackground))
        .navigationTitle("Privacy Policy")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func section(_ title: String, body: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title).font(.cuHeading)
            Text(body).font(.cuBody)
        }
    }
}

struct TermsView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                Text("Terms and Conditions").font(.cuTitle)
                Text("By using CUOnline you agree to use the service only for legitimate academic purposes related to your enrolment at the university. Submissions you upload are considered original academic work covered by the university's academic integrity policy.")
                    .font(.cuBody)
                Text("This app is provided as-is alongside the official web portal. Service availability may follow scheduled maintenance windows announced by your campus IT team.")
                    .font(.cuBody)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 20)
            .padding(.top, 16)
            .padding(.bottom, 32)
        }
        .background(Color(.systemBackground))
        .navigationTitle("Terms and Conditions")
        .navigationBarTitleDisplayMode(.inline)
    }
}
