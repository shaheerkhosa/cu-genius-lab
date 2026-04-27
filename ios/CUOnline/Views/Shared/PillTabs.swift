import SwiftUI

struct PillTabs<T: Hashable>: View {
    let options: [(value: T, label: String)]
    @Binding var selection: T
    var tint: Color = .brandBlue

    var body: some View {
        HStack(spacing: 8) {
            ForEach(options, id: \.value) { option in
                let active = option.value == selection
                Button {
                    withAnimation(.snappy) { selection = option.value }
                } label: {
                    Text(option.label)
                        .font(.system(size: 13, weight: .semibold))
                        .padding(.horizontal, 14)
                        .padding(.vertical, 8)
                        .background(active ? tint : Color.clear)
                        .foregroundStyle(active ? .white : tint)
                        .overlay(
                            Capsule().stroke(tint, lineWidth: active ? 0 : 1.2)
                        )
                        .clipShape(Capsule())
                }
            }
        }
    }
}
