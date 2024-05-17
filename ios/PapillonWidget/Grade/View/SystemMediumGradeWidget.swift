import SwiftUI

struct SystemMediumGradeWidget: View {

    var entry: GradeWidgetProvider.Entry

    var body: some View {
        Group {
            if entry.grades.isEmpty {
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
              .widgetBackground(Color(.clear))
            } else {
                VStack(alignment: .leading, spacing: 0) {
                    Color(hex: entry.grades.first!.color)
                        .frame(height: 14)
                    Spacer()
                    HStack(spacing: 0) {
                        VStack(alignment: .leading) {
                            Text(entry.grades.count == 1 ? "Note" : "Notes")
                                .font(Font.system(size: 17, weight: .bold, design: .rounded))
                                .foregroundStyle(Color(hex: entry.grades.first!.color))
                            Text("\(entry.grades.count)")
                                .font(Font.system(size: 24, weight: .bold, design: .rounded))
                            Spacer()
                            Circle()
                                .strokeBorder(Color(hex: entry.grades.first!.color), lineWidth: 3)
                                .background(Circle().fill(Color(hex: entry.grades.first!.color)))
                                .frame(width: 32, height: 32, alignment: .center)
                                .overlay(
                                    Image(systemName: "chart.pie")
                                        .font(Font.system(size: 16.5, weight: .bold, design: .rounded))
                                        .foregroundStyle(.white)
                                )
                        }
                        .frame(minWidth: 0, alignment: .leading)
                        Spacer()
                        VStack(alignment: .leading, spacing: 8) {
                            ForEach(Array(entry.grades.prefix(3)), id: \.id) { grade in
                                HStack(alignment: .center, spacing: 12) {
                                    Circle()
                                        .strokeBorder(Color.primary.opacity(0.25), lineWidth: 1)
                                        .frame(width: 35, height: 35, alignment: .center)
                                        .overlay(
                                            Text(grade.emoji)
                                                .font(Font.system(size: 18))
                                        )
                                    VStack(alignment: .leading, spacing: 4) {
                                      if grade.description.isEmpty {
                                        Text(grade.subject)
                                            .font(Font.system(size: 15))
                                            .bold()
                                            .lineLimit(1)
                                      } else {
                                        Text(grade.description)
                                            .font(Font.system(size: 15))
                                            .bold()
                                            .lineLimit(1)
                                        Text(grade.subject)
                                            .lineLimit(1)
                                            .font(Font.system(size: 12))
                                            .foregroundStyle(Color.primary.opacity(0.5))
                                      }

                                    }
                                    Spacer()
                                    VStack(alignment: .trailing, spacing: 0) {
                                      if grade.grade.value.significant == true {
                                        switch grade.grade.value.value {
                                          case 1 : Text("Abs")
                                            .font(.system(size: 17, design: .rounded))
                                            .bold()
                                          case 2 : Text("Disp.")
                                            .font(.system(size: 17, design: .rounded))
                                            .bold()
                                          case 3 : Text("N.not")
                                            .font(.system(size: 17, design: .rounded))
                                            .bold()
                                          case 4 : Text("Inap.")
                                            .font(.system(size: 17, design: .rounded))
                                            .bold()
                                          case 5 : Text("N.Rdu")
                                            .font(.system(size: 17, design: .rounded))
                                            .bold()
                                          case 6 : Text("Abs.0")
                                            .font(.system(size: 17, design: .rounded))
                                            .bold()
                                          case 7 : Text("N.Rdu.0")
                                            .font(.system(size: 17, design: .rounded))
                                            .bold()
                                          case 8 : Text("Félicitation")
                                            .font(.system(size: 17, design: .rounded))
                                            .bold()
                                          default: Text("Erreur")
                                            .font(.system(size: 17, design: .rounded))
                                            .bold()
                                        }
                                      } else {
                                        Text(String(format: "%.2f", grade.grade.value.value))
                                            .font(.system(size: 17, design: .rounded))
                                            .bold()
                                      }
                                      Text("/" + String(format: "%.0f", grade.grade.outOf.value))
                                          .font(.system(size: 13, design: .rounded))
                                          .baselineOffset(2)
                                          .foregroundStyle(Color.primary.opacity(0.5))
                                    }
                                }
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            if entry.grades.count < 3 {
                                Spacer()
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .padding(.horizontal)
                    .padding(.bottom, 14)
                    .widgetBackground(Color("Background"))
                }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}
