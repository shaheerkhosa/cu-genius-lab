import SwiftUI

struct TimetableDayView: View {
    @State var day: Int
    let vm: TimetableViewModel

    private let weekdays = [1, 2, 3, 4, 5]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                header
                let entries = vm.entries(forDay: day)
                if entries.isEmpty {
                    Text("No classes today").font(.cuCaption).foregroundStyle(.secondary)
                        .frame(maxWidth: .infinity).padding(.top, 40)
                } else {
                    LazyVStack(spacing: 8) {
                        ForEach(entries) { entry in
                            NavigationLink {
                                ClassDetailView(entry: entry, tint: vm.tint(forCourseCode: entry.courseCode))
                            } label: {
                                row(entry)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 32)
        }
        .background(Color(.systemBackground))
        .navigationTitle("Time Table")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var header: some View {
        HStack {
            Button { day = max(1, day - 1) } label: {
                Image(systemName: "chevron.left").padding(8)
            }
            Spacer()
            Text(dayName(day)).font(.cuHeading)
            Spacer()
            Button { day = min(5, day + 1) } label: {
                Image(systemName: "chevron.right").padding(8)
            }
        }
        .foregroundStyle(.primary)
        .padding(.horizontal, 4)
        .padding(.top, 8)
    }

    private func row(_ entry: TimetableEntry) -> some View {
        let tint = vm.tint(forCourseCode: entry.courseCode)
        return HStack(spacing: 12) {
            Circle().fill(tint.color).frame(width: 10, height: 10)
            VStack(alignment: .leading, spacing: 4) {
                Text(entry.courseName).font(.system(size: 15, weight: .semibold))
                Text("\(entry.timeRange) · \(entry.room ?? "TBD")")
                    .font(.cuCaption).foregroundStyle(.secondary)
            }
            Spacer()
            Image(systemName: "chevron.right").foregroundStyle(.secondary)
        }
        .padding(14)
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }

    private func dayName(_ day: Int) -> String {
        ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][day]
    }
}
