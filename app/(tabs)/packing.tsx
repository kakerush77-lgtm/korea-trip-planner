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
  Modal,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAppStore } from "@/lib/store";
import { PackingItem } from "@/data/types";
import { EVERYONE_MEMBER } from "@/data/members";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScrollCategoryPicker, CategoryOption } from "@/components/scroll-category-picker";
import { UNIFIED_HEADER_STYLES, HEADER_CONSTANTS } from "@/constants/header-styles";

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

const CATEGORY_PICKER_OPTIONS: CategoryOption[] = CATEGORIES.filter((c) => c.value !== "all");

export default function PackingScreen() {
  const colors = useColors();
  const router = useRouter();
  const { currentTrip, addPackingItem, updatePackingItem, deletePackingItem, togglePackingItem } = useAppStore();
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("other");
  const [newItemQuantity, setNewItemQuantity] = useState("1");
  const [newItemMember, setNewItemMember] = useState("everyone");
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterMember, setFilterMember] = useState("all");
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [editingItem, setEditingItem] = useState<PackingItem | null>(null);

  const members = currentTrip?.members ?? [];
  const packingItems = currentTrip?.packingItems ?? [];

  const allMemberOptions = useMemo(
    () => [{ id: "all", name: "全員", emoji: "📦", color: "#666" }, EVERYONE_MEMBER, ...members],
    [members]
  );

  const assignMemberOptions = useMemo(
    () => [EVERYONE_MEMBER, ...members],
    [members]
  );

  const filteredItems = useMemo(() => {
    let items = packingItems;
    if (filterCategory !== "all") {
      items = items.filter((item) => (item.category ?? "other") === filterCategory);
    }
    if (filterMember !== "all") {
      items = items.filter((item) => {
        const mid = item.memberId ?? "everyone";
        return mid === filterMember || mid === "everyone";
      });
    }
    return items;
  }, [packingItems, filterCategory, filterMember]);

  const checkedCount = packingItems.filter((i) => i.checked).length;
  const totalCount = packingItems.length;
  const progress = totalCount > 0 ? checkedCount / totalCount : 0;

  function handleEdit(item: PackingItem) {
    setEditingItem(item);
    setNewItemName(item.name);
    setNewItemCategory(item.category || "other");
    setNewItemQuantity(String(item.quantity));
    setNewItemMember(item.memberId || "everyone");
    setShowAddForm(true);
  }

  function handleAdd() {
    if (!newItemName.trim()) {
      Alert.alert("エラー", "持ち物の名前を入力してください");
      return;
    }
    const qty = parseInt(newItemQuantity) || 1;
    if (editingItem) {
      updatePackingItem({
        ...editingItem,
        name: newItemName.trim(),
        category: newItemCategory,
        quantity: qty,
        memberId: newItemMember,
      });
    } else {
      addPackingItem({
        name: newItemName.trim(),
        category: newItemCategory,
        quantity: qty,
        checked: false,
        memberId: newItemMember,
      });
    }
    setNewItemName("");
    setNewItemQuantity("1");
    setEditingItem(null);
    setShowAddForm(false);
  }

  function handleDelete(item: PackingItem) {
    Alert.alert("削除", `「${item.name}」を削除しますか？`, [
      { text: "キャンセル", style: "cancel" },
      { text: "削除", style: "destructive", onPress: () => deletePackingItem(item.id) },
    ]);
  }

  function getMemberDisplay(memberId?: string) {
    if (!memberId || memberId === "everyone") return { emoji: "🌈", name: "全員" };
    const m = members.find((mem) => mem.id === memberId);
    return m ? { emoji: m.emoji, name: m.name } : { emoji: "👤", name: "不明" };
  }

  const renderItem = useCallback(
    ({ item }: { item: PackingItem }) => {
      const cat = CATEGORIES.find((c) => c.value === (item.category ?? "other"));
      const memberInfo = getMemberDisplay(item.memberId);
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
            onPress={() => togglePackingItem(item.id)}
            style={({ pressed }) => [styles.itemCheckbox, pressed && { opacity: 0.6 }]}
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
              <Text style={[styles.itemMember, { color: colors.muted }]}>
                {memberInfo.emoji} {memberInfo.name}
              </Text>
            </View>
          </View>
          <View style={styles.itemActions}>
            <Pressable
              onPress={() => handleEdit(item)}
              style={({ pressed }) => [
                styles.editButton,
                { backgroundColor: colors.primary },
                pressed && { opacity: 0.7 },
              ]}
            >
              <MaterialIcons name="edit" size={16} color="#fff" />
            </Pressable>
            <Pressable
              onPress={() => handleDelete(item)}
              style={({ pressed }) => [
                styles.deleteButton,
                { backgroundColor: colors.error },
                pressed && { opacity: 0.7 },
              ]}
            >
              <MaterialIcons name="delete" size={16} color="#fff" />
            </Pressable>
          </View>
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
          <Pressable
            onPress={() => router.replace("/home" as any)}
            style={({ pressed }) => [
              styles.homeButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
              pressed && { opacity: 0.6 },
            ]}
          >
            <MaterialIcons name="home" size={HEADER_CONSTANTS.ICON_SIZE} color={colors.primary} />
          </Pressable>
          <View style={{ flex: 1 }}>
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
            <MaterialIcons name={showAddForm ? "close" : "add"} size={HEADER_CONSTANTS.ADD_ICON_SIZE} color="#fff" />
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

        <Modal visible={showAddForm} animationType="slide" onRequestClose={() => setShowAddForm(false)}>
          <ScreenContainer edges={["top", "bottom", "left", "right"]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Pressable
                onPress={() => setShowAddForm(false)}
                style={({ pressed }) => [pressed && { opacity: 0.6 }]}
              >
                <MaterialIcons name="close" size={24} color={colors.foreground} />
              </Pressable>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                {editingItem ? "持ち物を編集" : "持ち物を追加"}
              </Text>
              <Pressable
                onPress={handleAdd}
                style={({ pressed }) => [
                  styles.saveButton,
                  { backgroundColor: colors.primary },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={styles.saveButtonText}>保存</Text>
              </Pressable>
            </View>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={{ flex: 1 }}
            >
              <ScrollView contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
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
            {/* Member selector */}
            <View style={styles.addFormSection}>
              <Text style={[styles.addFormLabel, { color: colors.muted }]}>担当</Text>
              <View style={styles.addCategoryRow}>
                {assignMemberOptions.map((m) => (
                  <Pressable
                    key={m.id}
                    onPress={() => setNewItemMember(m.id)}
                    style={[
                      styles.miniChip,
                      {
                        backgroundColor: newItemMember === m.id ? m.color : colors.background,
                        borderColor: newItemMember === m.id ? m.color : colors.border,
                      },
                    ]}
                  >
                    <Text style={styles.miniChipIcon}>{m.emoji}</Text>
                    <Text
                      style={[
                        styles.miniChipText,
                        { color: newItemMember === m.id ? "#fff" : colors.foreground },
                      ]}
                    >
                      {m.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            {/* Category selector */}
            <View style={styles.addFormSection}>
              <Text style={[styles.addFormLabel, { color: colors.muted }]}>カテゴリ</Text>
              <Pressable
                onPress={() => setShowCategoryPicker(true)}
                style={({ pressed }) => [
                  styles.categorySelector,
                  { backgroundColor: colors.background, borderColor: colors.border },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={styles.categorySelectorIcon}>
                  {CATEGORIES.find((c) => c.value === newItemCategory)?.icon ?? "📌"}
                </Text>
                <Text style={[styles.categorySelectorText, { color: colors.foreground }]}>
                  {CATEGORIES.find((c) => c.value === newItemCategory)?.label ?? "その他"}
                </Text>
                <MaterialIcons name="keyboard-arrow-down" size={20} color={colors.muted} />
              </Pressable>
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
              </ScrollView>
            </KeyboardAvoidingView>
          </ScreenContainer>
        </Modal>

        {/* Member filter */}
        <View style={[styles.filterRow, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={allMemberOptions}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.filterScroll}
            renderItem={({ item: m }) => {
              const count =
                m.id === "all"
                  ? packingItems.length
                  : packingItems.filter((i) => {
                      const mid = i.memberId ?? "everyone";
                      return mid === m.id || mid === "everyone";
                    }).length;
              return (
                <Pressable
                  onPress={() => setFilterMember(m.id)}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={[styles.checkbox, { borderColor: colors.border }]}>
                    {filterMember === m.id && (
                      <MaterialIcons name="check" size={16} color={colors.primary} />
                    )}
                  </View>
                  <Text style={styles.filterIcon}>{m.emoji}</Text>
                  <Text
                    style={[
                      styles.filterText,
                      { color: colors.foreground },
                    ]}
                  >
                    {m.name} ({count})
                  </Text>
                </Pressable>
              );
            }}
          />
        </View>

        {/* Category filter */}
        <View style={[styles.filterRow, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={CATEGORIES}
            keyExtractor={(item) => item.value}
            contentContainerStyle={styles.filterScroll}
            renderItem={({ item: cat }) => {
              const count =
                cat.value === "all"
                  ? filteredItems.length
                  : filteredItems.filter((i) => (i.category ?? "other") === cat.value).length;
              return (
                <Pressable
                  onPress={() => setFilterCategory(cat.value)}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={[styles.checkbox, { borderColor: colors.border }]}>
                    {filterCategory === cat.value && (
                      <MaterialIcons name="check" size={16} color={colors.primary} />
                    )}
                  </View>
                  <Text style={styles.filterIcon}>{cat.icon}</Text>
                  <Text
                    style={[
                      styles.filterText,
                      { color: colors.foreground },
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
      <ScrollCategoryPicker
        visible={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        onConfirm={setNewItemCategory}
        categories={CATEGORY_PICKER_OPTIONS}
        initialValue={newItemCategory}
        label="カテゴリを選択"
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: UNIFIED_HEADER_STYLES.header,
  homeButton: UNIFIED_HEADER_STYLES.homeButton,
  headerTitle: UNIFIED_HEADER_STYLES.headerTitle,
  headerSub: UNIFIED_HEADER_STYLES.headerSubtitle,
  addButton: UNIFIED_HEADER_STYLES.addButton,
  addButtonInner: {
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
  addFormSection: { gap: 4 },
  addFormLabel: { fontSize: 11, fontWeight: "700" },
  addInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
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
  filterRow: { paddingVertical: 3 },
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
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
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
  itemCheckbox: { padding: 2 },
  itemInfo: { flex: 1, gap: 2 },
  itemName: { fontSize: 15, fontWeight: "600" },
  itemNameChecked: { textDecorationLine: "line-through" },
  itemMeta: { flexDirection: "row", gap: 8 },
  itemQuantity: { fontSize: 12, fontWeight: "600" },
  itemCategory: { fontSize: 12 },
  itemMember: { fontSize: 12 },
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 14, fontWeight: "500" },
  categorySelector: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  categorySelectorIcon: { fontSize: 16 },
  categorySelectorText: { fontSize: 14, fontWeight: "600", flex: 1 },
  itemActions: {
    flexDirection: "column",
    gap: 8,
    justifyContent: "center",
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 18,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  modalScrollContent: {
    padding: 16,
    gap: 24,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
  },
});
