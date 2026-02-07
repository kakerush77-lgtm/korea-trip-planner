import { useRef, useEffect, useCallback, useState } from "react";
import { View, Text, FlatList, StyleSheet, Pressable, Modal } from "react-native";
import { useColors } from "@/hooks/use-colors";

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

// Generate year range (current year - 1 to current year + 5)
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 7 }, (_, i) => String(currentYear - 1 + i));
const MONTHS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));

function getDaysInMonth(year: number, month: number): string[] {
  const days = new Date(year, month, 0).getDate();
  return Array.from({ length: days }, (_, i) => String(i + 1).padStart(2, "0"));
}

interface ScrollColumnProps {
  data: string[];
  selected: string;
  onSelect: (value: string) => void;
  colors: ReturnType<typeof useColors>;
  label?: string;
  width?: number;
}

function ScrollColumn({ data, selected, onSelect, colors, label, width = 70 }: ScrollColumnProps) {
  const flatListRef = useRef<FlatList>(null);
  const selectedIndex = data.indexOf(selected);
  const isScrolling = useRef(false);

  useEffect(() => {
    if (flatListRef.current && selectedIndex >= 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({
          offset: selectedIndex * ITEM_HEIGHT,
          animated: false,
        });
      }, 50);
    }
  }, [data.length]);

  const handleMomentumScrollEnd = useCallback(
    (event: any) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const index = Math.round(offsetY / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(index, data.length - 1));
      if (data[clampedIndex] !== selected) {
        onSelect(data[clampedIndex]);
      }
      isScrolling.current = false;
    },
    [data, selected, onSelect]
  );

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  const renderItem = useCallback(
    ({ item, index }: { item: string; index: number }) => {
      const isSelected = item === selected;
      return (
        <Pressable
          onPress={() => {
            onSelect(item);
            flatListRef.current?.scrollToOffset({
              offset: index * ITEM_HEIGHT,
              animated: true,
            });
          }}
          style={[styles.item, { height: ITEM_HEIGHT }]}
        >
          <Text
            style={[
              styles.itemText,
              {
                color: isSelected ? colors.foreground : colors.muted,
                fontWeight: isSelected ? "700" : "400",
                fontSize: isSelected ? 20 : 15,
                opacity: isSelected ? 1 : 0.5,
              },
            ]}
          >
            {item}
          </Text>
        </Pressable>
      );
    },
    [selected, colors, onSelect]
  );

  return (
    <View style={{ alignItems: "center" }}>
      {label && (
        <Text style={[styles.columnLabel, { color: colors.muted }]}>{label}</Text>
      )}
      <View style={[styles.column, { height: PICKER_HEIGHT, width }]}>
        <FlatList
          ref={flatListRef}
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item}
          getItemLayout={getItemLayout}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          onMomentumScrollEnd={handleMomentumScrollEnd}
          onScrollBeginDrag={() => { isScrolling.current = true; }}
          contentContainerStyle={{
            paddingTop: ITEM_HEIGHT * 2,
            paddingBottom: ITEM_HEIGHT * 2,
          }}
        />
        {/* Selection indicator */}
        <View
          pointerEvents="none"
          style={[
            styles.selectionIndicator,
            {
              top: ITEM_HEIGHT * 2,
              height: ITEM_HEIGHT,
              borderColor: colors.primary + "40",
              backgroundColor: colors.primary + "08",
            },
          ]}
        />
      </View>
    </View>
  );
}

interface ScrollDatePickerProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (dateStr: string) => void;
  initialDate?: string; // "YYYY-MM-DD"
  label?: string;
}

export function ScrollDatePicker({
  visible,
  onClose,
  onConfirm,
  initialDate,
  label,
}: ScrollDatePickerProps) {
  const colors = useColors();

  const parsedDate = initialDate ? initialDate.split("-") : [String(currentYear), "03", "01"];
  const [selectedYear, setSelectedYear] = useState(parsedDate[0]);
  const [selectedMonth, setSelectedMonth] = useState(parsedDate[1]);
  const [selectedDay, setSelectedDay] = useState(parsedDate[2]);

  // Reset when opened
  useEffect(() => {
    if (visible) {
      const parsed = initialDate ? initialDate.split("-") : [String(currentYear), "03", "01"];
      setSelectedYear(parsed[0]);
      setSelectedMonth(parsed[1]);
      setSelectedDay(parsed[2]);
    }
  }, [visible, initialDate]);

  // Adjust day if it exceeds the max for the selected month
  const daysInMonth = getDaysInMonth(parseInt(selectedYear), parseInt(selectedMonth));
  useEffect(() => {
    if (parseInt(selectedDay) > daysInMonth.length) {
      setSelectedDay(String(daysInMonth.length).padStart(2, "0"));
    }
  }, [selectedYear, selectedMonth]);

  function handleConfirm() {
    const dateStr = `${selectedYear}-${selectedMonth}-${selectedDay}`;
    onConfirm(dateStr);
    onClose();
  }

  // Format display
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const displayDate = new Date(`${selectedYear}-${selectedMonth}-${selectedDay}T00:00:00`);
  const dow = isNaN(displayDate.getTime()) ? "" : `(${weekdays[displayDate.getDay()]})`;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.container, { backgroundColor: colors.background }]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Pressable onPress={onClose} style={({ pressed }) => [pressed && { opacity: 0.5 }]}>
              <Text style={[styles.headerAction, { color: colors.muted }]}>キャンセル</Text>
            </Pressable>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>{label ?? "日付を選択"}</Text>
            <Pressable onPress={handleConfirm} style={({ pressed }) => [pressed && { opacity: 0.5 }]}>
              <Text style={[styles.headerAction, { color: colors.primary, fontWeight: "700" }]}>完了</Text>
            </Pressable>
          </View>

          {/* Selected date display */}
          <View style={styles.dateDisplay}>
            <Text style={[styles.dateDisplayText, { color: colors.foreground }]}>
              {selectedYear}年{parseInt(selectedMonth)}月{parseInt(selectedDay)}日 {dow}
            </Text>
          </View>

          {/* Picker */}
          <View style={styles.pickerRow}>
            <ScrollColumn
              data={YEARS}
              selected={selectedYear}
              onSelect={setSelectedYear}
              colors={colors}
              label="年"
              width={80}
            />
            <ScrollColumn
              data={MONTHS}
              selected={selectedMonth}
              onSelect={setSelectedMonth}
              colors={colors}
              label="月"
              width={60}
            />
            <ScrollColumn
              data={daysInMonth}
              selected={selectedDay}
              onSelect={setSelectedDay}
              colors={colors}
              label="日"
              width={60}
            />
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
    justifyContent: "flex-end",
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  headerTitle: { fontSize: 16, fontWeight: "600" },
  headerAction: { fontSize: 15 },
  dateDisplay: {
    alignItems: "center",
    paddingVertical: 12,
  },
  dateDisplayText: {
    fontSize: 18,
    fontWeight: "700",
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingVertical: 4,
    gap: 8,
  },
  columnLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  column: {
    overflow: "hidden",
  },
  item: {
    alignItems: "center",
    justifyContent: "center",
  },
  itemText: {
    textAlign: "center",
  },
  selectionIndicator: {
    position: "absolute",
    left: 4,
    right: 4,
    borderRadius: 10,
    borderWidth: 1.5,
  },
});
