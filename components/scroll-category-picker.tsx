import { useRef, useEffect, useCallback, useState } from "react";
import { View, Text, FlatList, StyleSheet, Pressable, Modal } from "react-native";
import { useColors } from "@/hooks/use-colors";

const ITEM_HEIGHT = 48;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

export interface CategoryOption {
  value: string;
  label: string;
  icon: string;
}

interface ScrollCategoryPickerProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void;
  categories: CategoryOption[];
  initialValue: string;
  label?: string;
}

export function ScrollCategoryPicker({
  visible,
  onClose,
  onConfirm,
  categories,
  initialValue,
  label,
}: ScrollCategoryPickerProps) {
  const colors = useColors();
  const flatListRef = useRef<FlatList>(null);
  const [selected, setSelected] = useState(initialValue);

  useEffect(() => {
    if (visible) {
      setSelected(initialValue);
      const index = categories.findIndex((c) => c.value === initialValue);
      if (index >= 0) {
        setTimeout(() => {
          flatListRef.current?.scrollToOffset({
            offset: index * ITEM_HEIGHT,
            animated: false,
          });
        }, 50);
      }
    }
  }, [visible, initialValue]);

  const handleMomentumScrollEnd = useCallback(
    (event: any) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const index = Math.round(offsetY / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(index, categories.length - 1));
      setSelected(categories[clampedIndex].value);
    },
    [categories]
  );

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  function handleConfirm() {
    onConfirm(selected);
    onClose();
  }

  const selectedCat = categories.find((c) => c.value === selected);

  const renderItem = useCallback(
    ({ item, index }: { item: CategoryOption; index: number }) => {
      const isSelected = item.value === selected;
      return (
        <Pressable
          onPress={() => {
            setSelected(item.value);
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
                fontSize: isSelected ? 18 : 15,
                opacity: isSelected ? 1 : 0.5,
              },
            ]}
          >
            {item.icon}  {item.label}
          </Text>
        </Pressable>
      );
    },
    [selected, colors]
  );

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
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>{label ?? "カテゴリを選択"}</Text>
            <Pressable onPress={handleConfirm} style={({ pressed }) => [pressed && { opacity: 0.5 }]}>
              <Text style={[styles.headerAction, { color: colors.primary, fontWeight: "700" }]}>完了</Text>
            </Pressable>
          </View>

          {/* Selected display */}
          {selectedCat && (
            <View style={styles.selectedDisplay}>
              <Text style={[styles.selectedText, { color: colors.foreground }]}>
                {selectedCat.icon}  {selectedCat.label}
              </Text>
            </View>
          )}

          {/* Picker */}
          <View style={[styles.pickerContainer, { height: PICKER_HEIGHT }]}>
            <FlatList
              ref={flatListRef}
              data={categories}
              renderItem={renderItem}
              keyExtractor={(item) => item.value}
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
  selectedDisplay: {
    alignItems: "center",
    paddingVertical: 12,
  },
  selectedText: {
    fontSize: 20,
    fontWeight: "700",
  },
  pickerContainer: {
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
    left: 20,
    right: 20,
    borderRadius: 12,
    borderWidth: 1.5,
  },
});
