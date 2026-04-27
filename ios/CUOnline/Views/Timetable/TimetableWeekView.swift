import SwiftUI

struct TimetableWeekView: View {
    @State private var vm = TimetableViewModel()
    @State private var selectedDay: Int? = nil

    private let weekdays = [1, 2, 3, 4, 5] // Mon..Fri

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Time Table").font(.cuTitle).padding(.horizontal, 20).padding(.top, 8)

                if let error = vm.errorMessage {
                    ErrorBanner(message: error).padding(.horizontal, 20)
                }

                grid

                NavigationLink {
                    TimetableDayView(day: weekdayToday(), vm: vm)
                } label: {
                    Text("Today's Classes")
                        .font(.system(size: 14, weight: .semibold))
                        .padding(14)
                        .frame(maxWidth: .infinity)
                        .background(Color.brandBlue)
                        .foregroundStyle(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                }
                .padding(.horizontal, 20)
            }
            .padding(.bottom, 32)
        }
        .background(Color(.systemBackground))
        .navigationBarHidden(true)
        .task { await vm.load() }
        .refreshable { await vm.load() }
    }

    private var grid: some View {
        let hours = Array(8...16)
        return ScrollView(.horizontal, showsIndicators: false) {
            VStack(alignment: .leading, spacing: 0) {
                HStack(spacing: 0) {
                    Color.clear.frame(width: 44)
                    ForEach(weekdays, id: \.self) { day in
                        Text(shortName(day))
                            .font(.cuCaption).fontWeight(.semibold)
                            .frame(width: 70, height: 28)
                    }
                }
                ForEach(hours, id: \.self) { hour in
                    HStack(spacing: 0) {
                        Text(String(format: "%02d:00", hour))
                            .font(.system(size: 10))
                            .foregroundStyle(.secondary)
                            .frame(width: 44, alignment: .trailing)
                            .padding(.trailing, 6)
                        ForEach(weekdays, id: \.self) { day in
                            cell(day: day, hour: hour)
                                .frame(width: 70, height: 44)
                                .overlay(
                                    Rectangle().stroke(Color(.separator).opacity(0.5), lineWidth: 0.5)
                                )
                        }
                    }
                }
            }
            .padding(.horizontal, 20)
        }
    }

    private func cell(day: Int, hour: Int) -> some View {
        let entry = vm.entries.first { e in
            guard e.dayOfWeek == day else { return false }
            let startHour = Int(e.startTime.prefix(2)) ?? 0
            let endHour = Int(e.endTime.prefix(2)) ?? 0
            return hour >= startHour && hour < endHour
        }
        if let entry {
            let tint = vm.tint(forCourseCode: entry.courseCode)
            return AnyView(
                NavigationLink {
                    ClassDetailView(entry: entry, tint: tint)
                } label: {
                    Text(entry.courseCode)
                        .font(.system(size: 9, weight: .semibold))
                        .padding(2)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .background(tint.color)
                        .foregroundStyle(tint.foreground)
                }
                .buttonStyle(.plain)
            )
        }
        return AnyView(Color.clear)
    }

    private func shortName(_ day: Int) -> String {
        ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day]
    }

    private func weekdayToday() -> Int {
        let weekday = Calendar.current.component(.weekday, from: .now) - 1 // 0..6
        return max(1, min(5, weekday))
    }
}
