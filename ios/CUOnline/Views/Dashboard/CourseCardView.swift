import SwiftUI

struct CourseCardView: View {
    let course: Course
    let tint: CourseTint
    let attendance: AttendanceSummary?

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(course.courseName)
                .font(.system(size: 16, weight: .bold))
                .foregroundStyle(tint.foreground)
                .lineLimit(2)
                .multilineTextAlignment(.leading)
            Text(course.courseCode)
                .font(.system(size: 11, weight: .medium))
                .foregroundStyle(tint.foreground.opacity(0.85))
            Spacer(minLength: 8)
            ProgressView(value: progressValue)
                .tint(tint.foreground)
                .background(tint.foreground.opacity(0.25))
            HStack {
                Text(attendanceLabel)
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(tint.foreground.opacity(0.95))
                Spacer()
                Text("\(course.credits) cr")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(tint.foreground.opacity(0.95))
            }
        }
        .padding(14)
        .frame(height: 150, alignment: .topLeading)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(tint.color)
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
    }

    private var progressValue: Double {
        guard let attendance, attendance.total > 0 else { return 0 }
        return min(1, attendance.percentage / 100)
    }

    private var attendanceLabel: String {
        guard let attendance, attendance.total > 0 else { return "No attendance yet" }
        return "Attendance \(Int(attendance.percentage))%"
    }
}
