import { useState, useMemo } from "react";
import { View, Text, Pressable, Modal, StyleSheet } from "react-native";
import { useColors } from "@/hooks/use-colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

interface CalendarPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (date: string) => void;
  selectedDate?: string;
  minDate?: string;
  maxDate?: string;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export function CalendarPicker({
  visible,
  onClose,
  onSelect,
  selectedDate,
  minDate,
  maxDate,
}: CalendarPickerProps) {
  const colors = useColors();
  const today = new Date();

  const initialDate = selectedDate ? new Date(selectedDate + "T00:00:00") : today;
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  const daysInMonth = useMemo(() => getDaysInMonth(viewYear, viewMonth), [viewYear, viewMonth]);
  const firstDay = useMemo(() => getFirstDayOfMonth(viewYear, viewMonth), [viewYear, viewMonth]);

  const selectedDateStr = selectedDate ?? "";
  const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate());

  function prevMonth() {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }

  function isDisabled(dateStr: string): boolean {
    if (minDate && dateStr < minDate) return true;
    if (maxDate && dateStr > maxDate) return true;
    return false;
  }

  function handleSelect(day: number) {
    const dateStr = formatDate(viewYear, viewMonth, day);
    if (isDisabled(dateStr)) return;
    onSelect(dateStr);
    onClose();
  }

  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.container, { backgroundColor: colors.background }]} onPress={(e) => e.stopPropagation()}>
          {/* Month navigation */}
          <View style={styles.monthNav}>
            <Pressable onPress={prevMonth} style={({ pressed }) => [styles.navButton, pressed && { opacity: 0.5 }]}>
              <MaterialIcons name="chevron-left" size={28} color={colors.foreground} />
            </Pressable>
            <Text style={[styles.monthTitle, { color: colors.foreground }]}>
              {viewYear}年 {viewMonth + 1}月
            </Text>
            <Pressable onPress={nextMonth} style={({ pressed }) => [styles.navButton, pressed && { opacity: 0.5 }]}>
              <MaterialIcons name="chevron-right" size={28} color={colors.foreground} />
            </Pressable>
          </View>

          {/* Weekday headers */}
          <View style={styles.weekdayRow}>
            {WEEKDAYS.map((wd, i) => (
              <View key={wd} style={styles.weekdayCell}>
                <Text style={[styles.weekdayText, { color: i === 0 ? colors.error : i === 6 ? colors.primary : colors.muted }]}>
                  {wd}
                </Text>
              </View>
            ))}
          </View>

          {/* Calendar grid */}
          <View style={styles.grid}>
            {calendarCells.map((day, idx) => {
              if (day === null) {
                return <View key={`empty-${idx}`} style={styles.dayCell} />;
              }
              const dateStr = formatDate(viewYear, viewMonth, day);
              const isSelected = dateStr === selectedDateStr;
              const isToday = dateStr === todayStr;
              const disabled = isDisabled(dateStr);
              const dayOfWeek = (firstDay + day - 1) % 7;

              return (
                <Pressable
                  key={`day-${day}`}
                  onPress={() => handleSelect(day)}
                  disabled={disabled}
                  style={({ pressed }) => [
                    styles.dayCell,
                    isSelected && [styles.dayCellSelected, { backgroundColor: colors.primary }],
                    isToday && !isSelected && [styles.dayCellToday, { borderColor: colors.primary }],
                    pressed && { opacity: 0.6 },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      {
                        color: disabled
                          ? colors.border
                          : isSelected
                          ? "#fff"
                          : dayOfWeek === 0
                          ? colors.error
                          : dayOfWeek === 6
                          ? colors.primary
                          : colors.foreground,
                      },
                    ]}
                  >
                    {day}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable onPress={onClose} style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.6 }]}>
              <Text style={[styles.actionText, { color: colors.muted }]}>キャンセル</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  navButton: { padding: 4 },
  monthTitle: { fontSize: 17, fontWeight: "700" },
  weekdayRow: { flexDirection: "row", marginBottom: 4 },
  weekdayCell: { flex: 1, alignItems: "center", paddingVertical: 6 },
  weekdayText: { fontSize: 12, fontWeight: "600" },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCellSelected: { borderRadius: 100 },
  dayCellToday: { borderRadius: 100, borderWidth: 1.5 },
  dayText: { fontSize: 15, fontWeight: "500" },
  actions: { flexDirection: "row", justifyContent: "flex-end", marginTop: 8 },
  actionButton: { paddingHorizontal: 16, paddingVertical: 8 },
  actionText: { fontSize: 15, fontWeight: "600" },
});
