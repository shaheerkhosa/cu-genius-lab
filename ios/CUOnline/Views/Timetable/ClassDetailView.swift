import SwiftUI

struct ClassDetailView: View {
    let entry: TimetableEntry
    let tint: CourseTint

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                hero

                VStack(spacing: 8) {
                    detailRow(icon: "calendar", title: entry.dayName)
                    detailRow(icon: "clock", title: entry.timeRange)
                    detailRow(icon: "person", title: "Lecture")
                    detailRow(icon: "mappin", title: entry.room ?? "Room TBD")
                }
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 32)
        }
        .background(Color(.systemBackground))
        .navigationTitle("Class View")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var hero: some View {
        Text(entry.courseName)
            .font(.cuTitle)
            .foregroundStyle(tint.foreground)
            .padding(20)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(tint.color)
            .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
    }

    private func detailRow(icon: String, title: String) -> some View {
        HStack {
            Image(systemName: icon)
                .foregroundStyle(tint.color)
                .frame(width: 24)
            Text(title).font(.system(size: 15, weight: .medium))
            Spacer()
        }
        .padding(14)
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }
}
