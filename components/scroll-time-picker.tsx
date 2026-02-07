import { useRef, useEffect, useCallback } from "react";
import { View, Text, FlatList, StyleSheet, Pressable, Modal } from "react-native";
import { useColors } from "@/hooks/use-colors";

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

interface ScrollColumnProps {
  data: string[];
  selected: string;
  onSelect: (value: string) => void;
  colors: ReturnType<typeof useColors>;
}

function ScrollColumn({ data, selected, onSelect, colors }: ScrollColumnProps) {
  const flatListRef = useRef<FlatList>(null);
  const selectedIndex = data.indexOf(selected);

  useEffect(() => {
    if (flatListRef.current && selectedIndex >= 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({
          offset: selectedIndex * ITEM_HEIGHT,
          animated: false,
        });
      }, 50);
    }
  }, []);

  const handleMomentumScrollEnd = useCallback(
    (event: any) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const index = Math.round(offsetY / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(index, data.length - 1));
      if (data[clampedIndex] !== selected) {
        onSelect(data[clampedIndex]);
      }
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
                fontSize: isSelected ? 22 : 16,
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
    <View style={[styles.column, { height: PICKER_HEIGHT }]}>
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
  );
}

interface ScrollTimePickerProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (hour: string, minute: string) => void;
  initialHour: string;
  initialMinute: string;
  label?: string;
}

export function ScrollTimePicker({
  visible,
  onClose,
  onConfirm,
  initialHour,
  initialMinute,
  label,
}: ScrollTimePickerProps) {
  const colors = useColors();
  const hourRef = useRef(initialHour);
  const minuteRef = useRef(initialMinute);

  // Reset when opened
  useEffect(() => {
    if (visible) {
      hourRef.current = initialHour;
      minuteRef.current = initialMinute;
    }
  }, [visible, initialHour, initialMinute]);

  function handleConfirm() {
    onConfirm(hourRef.current, minuteRef.current);
    onClose();
  }

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
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>{label ?? "時間を選択"}</Text>
            <Pressable onPress={handleConfirm} style={({ pressed }) => [pressed && { opacity: 0.5 }]}>
              <Text style={[styles.headerAction, { color: colors.primary, fontWeight: "700" }]}>完了</Text>
            </Pressable>
          </View>

          {/* Picker */}
          <View style={styles.pickerRow}>
            <ScrollColumn
              data={HOURS}
              selected={initialHour}
              onSelect={(v) => { hourRef.current = v; }}
              colors={colors}
            />
            <Text style={[styles.colon, { color: colors.foreground }]}>:</Text>
            <ScrollColumn
              data={MINUTES}
              selected={initialMinute}
              onSelect={(v) => { minuteRef.current = v; }}
              colors={colors}
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
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 4,
  },
  column: {
    width: 70,
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
  colon: {
    fontSize: 24,
    fontWeight: "700",
    marginHorizontal: 8,
  },
});
