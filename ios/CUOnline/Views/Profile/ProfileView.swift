import SwiftUI

struct ProfileView: View {
    @Environment(AppState.self) private var appState
    @State private var vm = ProfileViewModel()
    @State private var showSettings = false

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                hero
                if let error = vm.errorMessage {
                    ErrorBanner(message: error).padding(.horizontal, 20)
                }
                infoCard
                actionRow
                signOutButton
            }
            .padding(.bottom, 32)
        }
        .background(Color(.systemBackground))
        .navigationTitle("Profile")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button { showSettings = true } label: {
                    Image(systemName: "gearshape")
                }
            }
        }
        .navigationDestination(isPresented: $showSettings) { SettingsView() }
        .task { await vm.load() }
    }

    private var hero: some View {
        VStack(spacing: 8) {
            Circle()
                .fill(Color.white)
                .frame(width: 86, height: 86)
                .overlay(
                    Image(systemName: "person.fill")
                        .font(.system(size: 36))
                        .foregroundStyle(Color.brandBlue)
                )
                .shadow(color: .black.opacity(0.1), radius: 6, y: 2)
            Text(vm.profile?.username ?? appState.displayName)
                .font(.cuTitle).foregroundStyle(.white)
            Text(vm.profile?.email ?? "")
                .font(.cuCaption).foregroundStyle(.white.opacity(0.85))
        }
        .padding(.vertical, 24)
        .frame(maxWidth: .infinity)
        .background(Color.brandBlue)
        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
        .padding(.horizontal, 20)
    }

    private var infoCard: some View {
        VStack(spacing: 0) {
            row(icon: "person", title: "Username", value: vm.profile?.username ?? "—")
            divider
            row(icon: "envelope", title: "Email", value: vm.profile?.email ?? "—")
            divider
            row(icon: "calendar", title: "Joined", value: vm.profile?.createdAt?.formatted(date: .abbreviated, time: .omitted) ?? "—")
        }
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        .padding(.horizontal, 20)
    }

    private var actionRow: some View {
        VStack(spacing: 8) {
            NavigationLink {
                EditProfileView()
            } label: {
                actionLabel(title: "Edit profile", icon: "pencil")
            }
            NavigationLink {
                ChangePasswordView()
            } label: {
                actionLabel(title: "Change password", icon: "lock")
            }
        }
        .padding(.horizontal, 20)
    }

    private func actionLabel(title: String, icon: String) -> some View {
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

    private var signOutButton: some View {
        Button(role: .destructive) {
            Task { await vm.signOut() }
        } label: {
            Text("Sign out")
                .font(.system(size: 15, weight: .semibold))
                .frame(maxWidth: .infinity).frame(height: 48)
                .background(Color.red.opacity(0.12))
                .foregroundStyle(.red)
                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        }
        .padding(.horizontal, 20)
    }

    private func row(icon: String, title: String, value: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon).foregroundStyle(Color.brandBlue).frame(width: 24)
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.cuCaption).foregroundStyle(.secondary)
                Text(value).font(.system(size: 15, weight: .medium)).lineLimit(1)
            }
            Spacer()
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 14)
    }

    private var divider: some View {
        Rectangle().fill(Color(.separator).opacity(0.4)).frame(height: 0.5).padding(.leading, 50)
    }
}
