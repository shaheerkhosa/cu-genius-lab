import SwiftUI

struct AboutUsView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("About us").font(.cuTitle)
                Text("CUOnline is the official student portal companion for our university management system. The platform brings together courses, attendance, marks, assignments, timetables, quizzes, and an AI-powered campus assistant in one unified mobile experience.")
                    .font(.cuBody)
                Text("Mission")
                    .font(.cuHeading)
                Text("To make academic life easier for students by giving them a single place to track progress, submit work, and find answers about campus life.")
                    .font(.cuBody)
                Text("Built with the same Supabase backend that powers our web platform, so your data stays in sync across every device you use.")
                    .font(.cuBody)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 20)
            .padding(.top, 16)
            .padding(.bottom, 32)
        }
        .background(Color(.systemBackground))
        .navigationTitle("About us")
        .navigationBarTitleDisplayMode(.inline)
    }
}
