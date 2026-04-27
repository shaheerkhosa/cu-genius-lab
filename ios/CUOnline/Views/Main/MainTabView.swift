import SwiftUI

struct MainTabView: View {
    @State private var selection: Tab = .home

    enum Tab: Hashable { case home, timetable, ai, profile }

    var body: some View {
        TabView(selection: $selection) {
            NavigationStack { DashboardView() }
                .tabItem { Label("Home", systemImage: "house.fill") }
                .tag(Tab.home)

            NavigationStack { TimetableWeekView() }
                .tabItem { Label("Timetable", systemImage: "calendar") }
                .tag(Tab.timetable)

            NavigationStack { AIIntroView() }
                .tabItem { Label("AI", systemImage: "sparkles") }
                .tag(Tab.ai)

            NavigationStack { ProfileView() }
                .tabItem { Label("Profile", systemImage: "person.fill") }
                .tag(Tab.profile)
        }
        .tint(.brandBlue)
    }
}
