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
import { ShoppingItem } from "@/data/types";
import { EVERYONE_MEMBER } from "@/data/members";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function ShoppingScreen() {
  const colors = useColors();
  const { currentTrip, addShoppingItem, deleteShoppingItem, toggleShoppingItem } = useAppStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newQuantity, setNewQuantity] = useState("1");
  const [newPrice, setNewPrice] = useState("");
  const [newNote, setNewNote] = useState("");
  const [newMember, setNewMember] = useState("everyone");
  const [filterMember, setFilterMember] = useState("all");

  const members = currentTrip?.members ?? [];
  const shoppingItems = currentTrip?.shoppingItems ?? [];

  const allMemberOptions = useMemo(
    () => [{ id: "all", name: "全員", emoji: "🛒", color: "#666" }, EVERYONE_MEMBER, ...members],
    [members]
  );
  const assignMemberOptions = useMemo(() => [EVERYONE_MEMBER, ...members], [members]);

  const filteredItems = useMemo(() => {
    if (filterMember === "all") return shoppingItems;
    return shoppingItems.filter((i) => {
      const mid = i.memberId ?? "everyone";
      return mid === filterMember || mid === "everyone";
    });
  }, [shoppingItems, filterMember]);

  const boughtCount = shoppingItems.filter((i) => i.bought).length;

  function handleAdd() {
    if (!newName.trim()) {
      Alert.alert("エラー", "商品名を入力してください");
      return;
    }
    const qty = parseInt(newQuantity) || 1;
    addShoppingItem({
      name: newName.trim(),
      quantity: qty,
      price: newPrice.trim() || undefined,
      note: newNote.trim() || undefined,
      bought: false,
      memberId: newMember,
    });
    setNewName("");
    setNewQuantity("1");
    setNewPrice("");
    setNewNote("");
  }

  function handleDelete(item: ShoppingItem) {
    Alert.alert("削除", `「${item.name}」を削除しますか？`, [
      { text: "キャンセル", style: "cancel" },
      { text: "削除", style: "destructive", onPress: () => deleteShoppingItem(item.id) },
    ]);
  }

  function getMemberDisplay(memberId?: string) {
    if (!memberId || memberId === "everyone") return { emoji: "🌈", name: "全員" };
    const m = members.find((mem) => mem.id === memberId);
    return m ? { emoji: m.emoji, name: m.name } : { emoji: "👤", name: "不明" };
  }

  const renderItem = useCallback(
    ({ item }: { item: ShoppingItem }) => {
      const memberInfo = getMemberDisplay(item.memberId);
      return (
        <View
          style={[
            styles.itemCard,
            {
              backgroundColor: item.bought ? colors.surface : colors.background,
              borderColor: colors.border,
            },
          ]}
        >
          <Pressable
            onPress={() => toggleShoppingItem(item.id)}
            style={({ pressed }) => [styles.checkbox, pressed && { opacity: 0.6 }]}
          >
            <MaterialIcons
              name={item.bought ? "check-circle" : "radio-button-unchecked"}
              size={24}
              color={item.bought ? colors.success : colors.muted}
            />
          </Pressable>
          <View style={styles.itemInfo}>
            <Text
              style={[
                styles.itemName,
                { color: item.bought ? colors.muted : colors.foreground },
                item.bought && styles.itemNameChecked,
              ]}
            >
              🛍️ {item.name}
            </Text>
            <View style={styles.itemMeta}>
              {item.quantity > 1 && (
                <Text style={[styles.itemQuantity, { color: colors.muted }]}>×{item.quantity}</Text>
              )}
              {item.price && (
                <Text style={[styles.itemPrice, { color: colors.primary }]}>{item.price}</Text>
              )}
              <Text style={[styles.itemMember, { color: colors.muted }]}>
                {memberInfo.emoji} {memberInfo.name}
              </Text>
            </View>
            {item.note && (
              <Text style={[styles.itemNote, { color: colors.muted }]} numberOfLines={1}>
                📝 {item.note}
              </Text>
            )}
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
          <Text style={{ fontSize: 48 }}>🛒</Text>
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
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>買いたいもの</Text>
            <Text style={[styles.headerSub, { color: colors.muted }]}>
              {boughtCount}/{shoppingItems.length}個 購入済み
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

        {/* Add form */}
        {showAddForm && (
          <View style={[styles.addForm, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              style={[styles.addInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
              value={newName}
              onChangeText={setNewName}
              placeholder="商品名"
              placeholderTextColor={colors.muted}
              returnKeyType="done"
              autoFocus
            />
            <View style={styles.rowInputs}>
              <View style={styles.halfInput}>
                <Text style={[styles.addFormLabel, { color: colors.muted }]}>数量</Text>
                <TextInput
                  style={[styles.addInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
                  value={newQuantity}
                  onChangeText={setNewQuantity}
                  keyboardType="number-pad"
                  maxLength={3}
                  returnKeyType="done"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={[styles.addFormLabel, { color: colors.muted }]}>予算</Text>
                <TextInput
                  style={[styles.addInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
                  value={newPrice}
                  onChangeText={setNewPrice}
                  placeholder="例: ₩15,000"
                  placeholderTextColor={colors.muted}
                  returnKeyType="done"
                />
              </View>
            </View>
            {/* Member */}
            <View style={styles.addFormSection}>
              <Text style={[styles.addFormLabel, { color: colors.muted }]}>誰が買う？</Text>
              <View style={styles.addCategoryRow}>
                {assignMemberOptions.map((m) => (
                  <Pressable
                    key={m.id}
                    onPress={() => setNewMember(m.id)}
                    style={[
                      styles.miniChip,
                      {
                        backgroundColor: newMember === m.id ? m.color : colors.background,
                        borderColor: newMember === m.id ? m.color : colors.border,
                      },
                    ]}
                  >
                    <Text style={styles.miniChipIcon}>{m.emoji}</Text>
                    <Text style={[styles.miniChipText, { color: newMember === m.id ? "#fff" : colors.foreground }]}>
                      {m.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <TextInput
              style={[styles.addInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
              value={newNote}
              onChangeText={setNewNote}
              placeholder="メモ（任意）"
              placeholderTextColor={colors.muted}
              returnKeyType="done"
            />
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

        {/* Member filter */}
        <View style={styles.filterRow}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={allMemberOptions}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.filterScroll}
            renderItem={({ item: m }) => {
              const count =
                m.id === "all"
                  ? shoppingItems.length
                  : shoppingItems.filter((i) => {
                      const mid = i.memberId ?? "everyone";
                      return mid === m.id || mid === "everyone";
                    }).length;
              return (
                <Pressable
                  onPress={() => setFilterMember(m.id)}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: filterMember === m.id ? colors.primary : colors.surface,
                      borderColor: filterMember === m.id ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={styles.filterIcon}>{m.emoji}</Text>
                  <Text
                    style={[
                      styles.filterText,
                      { color: filterMember === m.id ? "#fff" : colors.foreground },
                    ]}
                  >
                    {m.name} ({count})
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
              <Text style={{ fontSize: 40 }}>🛒</Text>
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                買いたいものを追加しましょう
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
  rowInputs: { flexDirection: "row", gap: 10 },
  halfInput: { flex: 1, gap: 4 },
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
  itemPrice: { fontSize: 12, fontWeight: "700" },
  itemMember: { fontSize: 12 },
  itemNote: { fontSize: 12 },
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 14, fontWeight: "500" },
});
