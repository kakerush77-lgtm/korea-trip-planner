import { useCallback, useState, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAppStore } from "@/lib/store";
import { PackingItem } from "@/data/types";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const CATEGORIES = [
  { value: "all", label: "すべて", icon: "📦" },
  { value: "clothes", label: "衣類", icon: "👕" },
  { value: "toiletry", label: "洗面用具", icon: "🧴" },
  { value: "electronics", label: "電子機器", icon: "🔌" },
  { value: "documents", label: "書類", icon: "📄" },
  { value: "medicine", label: "薬", icon: "💊" },
  { value: "baby", label: "ベビー用品", icon: "👶" },
  { value: "other", label: "その他", icon: "📌" },
];

export default function PackingScreen() {
  const colors = useColors();
  const { currentTrip, addPackingItem, updatePackingItem, deletePackingItem } = useAppStore();
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("other");
  const [newItemQuantity, setNewItemQuantity] = useState("1");
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");

  const packingItems = currentTrip?.packingItems ?? [];

  const filteredItems = useMemo(() => {
    if (filterCategory === "all") return packingItems;
    return packingItems.filter((item) => (item.category ?? "other") === filterCategory);
  }, [packingItems, filterCategory]);

  const checkedCount = packingItems.filter((i) => i.checked).length;
  const totalCount = packingItems.length;
  const progress = totalCount > 0 ? checkedCount / totalCount : 0;

  function handleAdd() {
    if (!newItemName.trim()) {
      Alert.alert("エラー", "持ち物の名前を入力してください");
      return;
    }
    const qty = parseInt(newItemQuantity) || 1;
    addPackingItem({
      name: newItemName.trim(),
      category: newItemCategory,
      quantity: qty,
      checked: false,
    });
    setNewItemName("");
    setNewItemQuantity("1");
    setShowAddForm(false);
  }

  function handleToggle(item: PackingItem) {
    updatePackingItem({ ...item, checked: !item.checked });
  }

  function handleDelete(item: PackingItem) {
    Alert.alert("削除", `「${item.name}」を削除しますか？`, [
      { text: "キャンセル", style: "cancel" },
      { text: "削除", style: "destructive", onPress: () => deletePackingItem(item.id) },
    ]);
  }

  const renderItem = useCallback(
    ({ item }: { item: PackingItem }) => {
      const cat = CATEGORIES.find((c) => c.value === (item.category ?? "other"));
      return (
        <View
          style={[
            styles.itemCard,
            {
              backgroundColor: item.checked ? colors.surface : colors.background,
              borderColor: colors.border,
            },
          ]}
        >
          <Pressable
            onPress={() => handleToggle(item)}
            style={({ pressed }) => [styles.checkbox, pressed && { opacity: 0.6 }]}
          >
            <MaterialIcons
              name={item.checked ? "check-box" : "check-box-outline-blank"}
              size={24}
              color={item.checked ? colors.primary : colors.muted}
            />
          </Pressable>
          <View style={styles.itemInfo}>
            <Text
              style={[
                styles.itemName,
                { color: item.checked ? colors.muted : colors.foreground },
                item.checked && styles.itemNameChecked,
              ]}
            >
              {cat?.icon} {item.name}
            </Text>
            <View style={styles.itemMeta}>
              {item.quantity > 1 && (
                <Text style={[styles.itemQuantity, { color: colors.muted }]}>×{item.quantity}</Text>
              )}
              <Text style={[styles.itemCategory, { color: colors.muted }]}>{cat?.label ?? "その他"}</Text>
            </View>
          </View>
          <Pressable
            onPress={() => handleDelete(item)}
            style={({ pressed }) => [pressed && { opacity: 0.5 }]}
          >
            <MaterialIcons name="close" size={18} color={colors.muted} />
          </Pressable>
        </View>
      );
    },
    [colors, currentTrip]
  );

  if (!currentTrip) {
    return (
      <ScreenContainer>
        <View style={styles.emptyContainer}>
          <Text style={{ fontSize: 48 }}>🧳</Text>
          <Text style={[styles.emptyText, { color: colors.muted }]}>旅行を作成してください</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>持ち物リスト</Text>
            <Text style={[styles.headerSub, { color: colors.muted }]}>
              {checkedCount}/{totalCount}個 準備完了
            </Text>
          </View>
          <Pressable
            onPress={() => setShowAddForm(!showAddForm)}
            style={({ pressed }) => [
              styles.addButton,
              { backgroundColor: colors.primary },
              pressed && { opacity: 0.8 },
            ]}
          >
            <MaterialIcons name={showAddForm ? "close" : "add"} size={20} color="#fff" />
          </Pressable>
        </View>

        {/* Progress bar */}
        <View style={[styles.progressContainer, { backgroundColor: colors.surface }]}>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: progress >= 1 ? colors.success : colors.primary,
                  width: `${progress * 100}%` as any,
                },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: progress >= 1 ? colors.success : colors.muted }]}>
            {progress >= 1 ? "準備完了！🎉" : `${Math.round(progress * 100)}%`}
          </Text>
        </View>

        {/* Add form */}
        {showAddForm && (
          <View style={[styles.addForm, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              style={[styles.addInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
              value={newItemName}
              onChangeText={setNewItemName}
              placeholder="持ち物の名前"
              placeholderTextColor={colors.muted}
              returnKeyType="done"
              onSubmitEditing={handleAdd}
              autoFocus
            />
            <View style={styles.addFormRow}>
              {/* Category selector */}
              <View style={styles.addCategoryRow}>
                {CATEGORIES.filter((c) => c.value !== "all").map((cat) => (
                  <Pressable
                    key={cat.value}
                    onPress={() => setNewItemCategory(cat.value)}
                    style={[
                      styles.miniChip,
                      {
                        backgroundColor: newItemCategory === cat.value ? colors.primary : colors.background,
                        borderColor: newItemCategory === cat.value ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text style={styles.miniChipIcon}>{cat.icon}</Text>
                    <Text
                      style={[
                        styles.miniChipText,
                        { color: newItemCategory === cat.value ? "#fff" : colors.foreground },
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.quantityRow}>
                <Text style={[styles.quantityLabel, { color: colors.muted }]}>数量:</Text>
                <TextInput
                  style={[styles.quantityInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
                  value={newItemQuantity}
                  onChangeText={setNewItemQuantity}
                  keyboardType="number-pad"
                  maxLength={3}
                  returnKeyType="done"
                />
              </View>
            </View>
            <Pressable
              onPress={handleAdd}
              style={({ pressed }) => [
                styles.addSubmitButton,
                { backgroundColor: colors.primary },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={styles.addSubmitText}>追加する</Text>
            </Pressable>
          </View>
        )}

        {/* Category filter */}
        <View style={styles.filterRow}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={CATEGORIES}
            keyExtractor={(item) => item.value}
            contentContainerStyle={styles.filterScroll}
            renderItem={({ item: cat }) => {
              const count =
                cat.value === "all"
                  ? packingItems.length
                  : packingItems.filter((i) => (i.category ?? "other") === cat.value).length;
              return (
                <Pressable
                  onPress={() => setFilterCategory(cat.value)}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: filterCategory === cat.value ? colors.primary : colors.surface,
                      borderColor: filterCategory === cat.value ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={styles.filterIcon}>{cat.icon}</Text>
                  <Text
                    style={[
                      styles.filterText,
                      { color: filterCategory === cat.value ? "#fff" : colors.foreground },
                    ]}
                  >
                    {cat.label} ({count})
                  </Text>
                </Pressable>
              );
            }}
          />
        </View>

        {/* Items list */}
        <FlatList
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={{ fontSize: 40 }}>🧳</Text>
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                持ち物を追加しましょう
              </Text>
            </View>
          }
        />
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  headerTitle: { fontSize: 20, fontWeight: "800" },
  headerSub: { fontSize: 12, marginTop: 1 },
  addButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  progressBar: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  progressText: { fontSize: 12, fontWeight: "700", minWidth: 50, textAlign: "right" },
  addForm: {
    margin: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: 0.5,
    gap: 10,
  },
  addInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  addFormRow: { gap: 8 },
  addCategoryRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  miniChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 3,
  },
  miniChipIcon: { fontSize: 12 },
  miniChipText: { fontSize: 11, fontWeight: "600" },
  quantityRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  quantityLabel: { fontSize: 13, fontWeight: "600" },
  quantityInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 14, width: 50, textAlign: "center" },
  addSubmitButton: { paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  addSubmitText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  filterRow: { paddingVertical: 6 },
  filterScroll: { paddingHorizontal: 16, gap: 6 },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
    marginRight: 6,
  },
  filterIcon: { fontSize: 13 },
  filterText: { fontSize: 12, fontWeight: "600" },
  listContent: { padding: 16, paddingBottom: 100, gap: 6 },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 0.5,
    gap: 10,
  },
  checkbox: { padding: 2 },
  itemInfo: { flex: 1, gap: 2 },
  itemName: { fontSize: 15, fontWeight: "600" },
  itemNameChecked: { textDecorationLine: "line-through" },
  itemMeta: { flexDirection: "row", gap: 8 },
  itemQuantity: { fontSize: 12, fontWeight: "600" },
  itemCategory: { fontSize: 12 },
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 14, fontWeight: "500" },
});
