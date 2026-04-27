import SwiftUI

struct SettingsView: View {
    @AppStorage("pushNotificationsEnabled") private var pushEnabled = true

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                section(title: "Account Settings") {
                    NavigationLink {
                        EditProfileView()
                    } label: {
                        row(icon: "pencil", title: "Edit profile")
                    }
                    NavigationLink {
                        ChangePasswordView()
                    } label: {
                        row(icon: "lock", title: "Change password")
                    }
                    HStack {
                        Image(systemName: "bell.fill").foregroundStyle(Color.brandBlue).frame(width: 24)
                        Text("Push notifications").font(.system(size: 15, weight: .semibold))
                        Spacer()
                        Toggle("", isOn: $pushEnabled).labelsHidden()
                    }
                    .padding(14)
                    .background(Color(.secondarySystemBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                }

                section(title: "More") {
                    NavigationLink {
                        AboutUsView()
                    } label: {
                        row(icon: "info.circle", title: "About us")
                    }
                    NavigationLink {
                        PrivacyPolicyView()
                    } label: {
                        row(icon: "hand.raised", title: "Privacy policy")
                    }
                    NavigationLink {
                        TermsView()
                    } label: {
                        row(icon: "doc.text", title: "Terms and conditions")
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 16)
            .padding(.bottom, 32)
        }
        .background(Color(.systemBackground))
        .navigationTitle("Settings")
        .navigationBarTitleDisplayMode(.inline)
    }

    @ViewBuilder
    private func section<Content: View>(title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title).font(.cuCaption).foregroundStyle(.secondary).textCase(.uppercase)
            VStack(spacing: 8) { content() }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func row(icon: String, title: String) -> some View {
        HStack {
            Image(systemName: icon).foregroundStyle(Color.brandBlue).frame(width: 24)
            Text(title).font(.system(size: 15, weight: .semibold))
            Spacer()
            Image(systemName: "chevron.right").foregroundStyle(.secondary)
        }
        .padding(14)
        .background(Color(.secondarySystemBackground))
        .foregroundStyle(.primary)
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }
}
