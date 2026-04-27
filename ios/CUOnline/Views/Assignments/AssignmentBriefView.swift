import SwiftUI

struct AssignmentBriefView: View {
    let course: Course
    let tint: CourseTint
    let assessment: Assessment
    let mark: StudentMark?

    @State private var tab: BriefTab = .description

    enum BriefTab: Hashable, CaseIterable {
        case description, discussion, references
        var label: String {
            switch self {
            case .description: return "Description"
            case .discussion: return "Discussion"
            case .references: return "References"
            }
        }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                hero

                PillTabs(
                    options: BriefTab.allCases.map { ($0, $0.label) },
                    selection: $tab,
                    tint: tint.color
                )

                content

                if mark == nil, assessment.status(submission: mark) != .overdue {
                    NavigationLink {
                        SubmitAssignmentView(course: course, tint: tint, assessment: assessment)
                    } label: {
                        Text("Submit")
                            .font(.system(size: 16, weight: .semibold))
                            .frame(maxWidth: .infinity).frame(height: 52)
                            .background(tint.color)
                            .foregroundStyle(tint.foreground)
                            .clipShape(RoundedRectangle(cornerRadius: 26, style: .continuous))
                    }
                } else if let mark {
                    HStack {
                        Image(systemName: "checkmark.seal.fill")
                        Text(mark.marksObtained == nil ? "Submitted" : "Graded \(formatted(mark.marksObtained ?? 0)) / \(formatted(assessment.totalMarks))")
                            .font(.system(size: 15, weight: .semibold))
                    }
                    .padding(14)
                    .frame(maxWidth: .infinity)
                    .background(Color.green.opacity(0.12))
                    .foregroundStyle(.green)
                    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                }
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 32)
        }
        .background(Color(.systemBackground))
        .navigationTitle("Assignment Brief")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var hero: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(assessment.title).font(.cuTitle).foregroundStyle(tint.foreground)
            Text(assessment.assessmentType.capitalized + " · \(course.courseCode)")
                .font(.cuCaption).foregroundStyle(tint.foreground.opacity(0.85))
            if let due = assessment.scheduleEnd {
                HStack(spacing: 4) {
                    Image(systemName: "clock")
                    Text(due.formatted(date: .abbreviated, time: .shortened))
                }
                .font(.cuCaption)
                .foregroundStyle(tint.foreground.opacity(0.85))
                .padding(.top, 6)
            }
        }
        .padding(20)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(tint.color)
        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
    }

    @ViewBuilder
    private var content: some View {
        switch tab {
        case .description:
            VStack(alignment: .leading, spacing: 8) {
                Text("About this assignment").font(.cuHeading)
                Text("Total marks: \(formatted(assessment.totalMarks)). \(assessment.assessmentType.capitalized) for \(course.courseName).")
                    .font(.cuBody).foregroundStyle(.secondary)
                if let _ = assessment.filePath {
                    Label("Brief file attached", systemImage: "paperclip")
                        .font(.cuCaption)
                        .foregroundStyle(tint.color)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        case .discussion:
            Text("No discussion thread yet.")
                .font(.cuCaption).foregroundStyle(.secondary)
                .frame(maxWidth: .infinity, alignment: .leading)
        case .references:
            Text("No references attached.")
                .font(.cuCaption).foregroundStyle(.secondary)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private func formatted(_ value: Double) -> String {
        value.rounded() == value ? "\(Int(value))" : String(format: "%.1f", value)
    }
}
