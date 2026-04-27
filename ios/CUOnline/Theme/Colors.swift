import SwiftUI

enum CourseTint: Int, CaseIterable, Sendable {
    case blue, yellow, peach, purple

    static func tint(for index: Int) -> CourseTint {
        let cases = CourseTint.allCases
        return cases[(index % cases.count + cases.count) % cases.count]
    }

    var color: Color {
        switch self {
        case .blue: return Color("CourseBlue")
        case .yellow: return Color("CourseYellow")
        case .peach: return Color("CoursePeach")
        case .purple: return Color("CoursePurple")
        }
    }

    /// Foreground color that reads well on the tint.
    var foreground: Color {
        switch self {
        case .yellow: return .black
        default: return .white
        }
    }
}

extension Color {
    static let brandBlue = Color("BrandBlue")
}
