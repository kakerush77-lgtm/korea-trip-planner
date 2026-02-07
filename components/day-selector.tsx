import { View, Text, Pressable, StyleSheet } from "react-native";
import { DAYS } from "@/data/days";
import { useColors } from "@/hooks/use-colors";

interface DaySelectorProps {
  selectedDay: number;
  onSelectDay: (dayIndex: number) => void;
}

export function DaySelector({ selectedDay, onSelectDay }: DaySelectorProps) {
  const colors = useColors();

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      {DAYS.map((day) => {
        const isSelected = day.index === selectedDay;
        return (
          <Pressable
            key={day.index}
            onPress={() => onSelectDay(day.index)}
            style={({ pressed }) => [
              styles.tab,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text
              style={[
                styles.dayLabel,
                { color: isSelected ? colors.primary : colors.muted },
              ]}
            >
              {day.dayLabel}
            </Text>
            <Text
              style={[
                styles.dateLabel,
                {
                  color: isSelected ? colors.primary : colors.foreground,
                  fontWeight: isSelected ? "800" : "500",
                },
              ]}
            >
              {day.label}
            </Text>
            {isSelected && (
              <View style={[styles.indicator, { backgroundColor: colors.primary }]} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    position: "relative",
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  dateLabel: {
    fontSize: 14,
    marginTop: 2,
  },
  indicator: {
    position: "absolute",
    bottom: 0,
    left: "20%",
    right: "20%",
    height: 3,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
});
