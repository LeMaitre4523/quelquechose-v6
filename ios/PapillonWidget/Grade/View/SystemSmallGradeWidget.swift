import SwiftUI

struct SystemSmallGradeWidget: View {
  
    var entry: GradeWidgetProvider.Entry
  
    var body: some View {
        if let firstGrade = entry.grades.first {
          VStack(alignment: .leading) {
                Color(hex: firstGrade.color)
                    .frame(height: 14)
            Spacer()
            VStack(alignment: .leading) {
              Text(firstGrade.emoji)
                .font(.system(.title, design: .rounded))
              Spacer()
              Text(firstGrade.subject)
                .lineLimit(1)
                .font(.system(.headline, design: .rounded))
              Text(firstGrade.description)
                .lineLimit(2)
                .font(.system(.subheadline, design: .rounded))
                .foregroundStyle(Color.primary.opacity(0.5))
              Spacer()
              Spacer()
              HStack(alignment: .bottom, spacing: 0) {
                if firstGrade.grade.value.significant == true {
                  switch firstGrade.grade.value.value {
                    case 1 : Text("Abs")
                      .font(.system(.title2, design: .rounded))
                      .bold()
                    case 2 : Text("Disp.")
                      .font(.system(.title2, design: .rounded))
                      .bold()
                    case 3 : Text("N.not")
                      .font(.system(.title2, design: .rounded))
                      .bold()
                    case 4 : Text("Inap.")
                      .font(.system(.title2, design: .rounded))
                      .bold()
                    case 5 : Text("N.Rdu")
                      .font(.system(.title2, design: .rounded))
                      .bold()
                    case 6 : Text("Abs.0")
                      .font(.system(.title2, design: .rounded))
                      .bold()
                    case 7 : Text("N.Rdu.0")
                      .font(.system(.title2, design: .rounded))
                      .bold()
                    case 8 : Text("Félicitation")
                      .font(.system(.title2, design: .rounded))
                      .bold()
                    default: Text("Erreur")
                      .font(.system(.title2, design: .rounded))
                      .bold()
                  }
                } else {
                  Text(String(format: "%.2f", firstGrade.grade.value.value))
                    .font(.system(.title2, design: .rounded))
                    .bold()
                }
                Text("/" + String(format: "%.0f", firstGrade.grade.outOf.value))
                  .font(.system(.subheadline, design: .rounded))
                  .baselineOffset(2)
                  .foregroundStyle(Color.primary.opacity(0.5))
              }
            }
            .padding(.horizontal)
            .padding(.bottom, 14)
            }
          .widgetBackground(Color("Background"))
        } else {
          // Handle the case where entry.grades is nil or empty
          VStack(alignment: .center) {
            Color("WidgetBackground")
                .frame(height: 14)
            Spacer()
            Text("Aucune note disponible")
              .font(.system(.subheadline, design: .rounded))
              .foregroundStyle(Color.primary.opacity(0.5))
              .padding()
              .multilineTextAlignment(.center)
            Spacer()
          }
          .widgetBackground(Color("Background"))
        }
    }
}
