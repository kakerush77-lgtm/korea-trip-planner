import { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  TextInput,
  StyleSheet,
  Alert,
  Linking,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAppStore } from "@/lib/store";
import { LinkItem } from "@/data/types";
import { EVERYONE_MEMBER } from "@/data/members";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScrollCategoryPicker, CategoryOption } from "@/components/scroll-category-picker";
import { UNIFIED_HEADER_STYLES, HEADER_CONSTANTS } from "@/constants/header-styles";

const CATEGORIES: CategoryOption[] = [
  { value: "restaurant", label: "レストラン", icon: "🍽️" },
  { value: "hotel", label: "ホテル", icon: "🏨" },
  { value: "shopping", label: "ショッピング", icon: "🛍️" },
  { value: "sightseeing", label: "観光", icon: "📸" },
  { value: "other", label: "その他", icon: "📌" },
];

export default function LinksScreen() {
  const colors = useColors();
  const router = useRouter();
  const { currentTrip, addLinkItem, deleteLinkItem } = useAppStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("other");
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newNote, setNewNote] = useState("");
  const [newMember, setNewMember] = useState("everyone");
  const [filterMember, setFilterMember] = useState("all");
  const [editingItem, setEditingItem] = useState<LinkItem | null>(null);

  const members = currentTrip?.members ?? [];
  const linkItems = currentTrip?.linkItems ?? [];

  const allMemberOptions = useMemo(
    () => [{ id: "all", name: "全員", emoji: "🔗", color: "#666" }, EVERYONE_MEMBER, ...members],
    [members]
  );
  const assignMemberOptions = useMemo(() => [EVERYONE_MEMBER, ...members], [members]);

  const filteredItems = useMemo(() => {
    if (filterMember === "all") return linkItems;
    return linkItems.filter((i) => {
      const mid = i.memberId ?? "everyone";
      return mid === filterMember || mid === "everyone";
    });
  }, [linkItems, filterMember]);

  function handleAdd() {
    if (!newTitle.trim()) {
      Alert.alert("エラー", "タイトルを入力してください");
      return;
    }
    if (!newUrl.trim()) {
      Alert.alert("エラー", "URLを入力してください");
      return;
    }
    addLinkItem({
      title: newTitle.trim(),
      category: newCategory,
      url: newUrl.trim(),
      note: newNote.trim() || undefined,
      memberId: newMember,
    });
    setNewTitle("");
    setNewUrl("");
    setNewNote("");
    setShowAddForm(false);
  }

  function handleEdit(item: LinkItem) {
    setEditingItem(item);
    setNewTitle(item.title);
    setNewCategory(item.category ?? "other");
    setNewUrl(item.url);
    setNewNote(item.note ?? "");
    setNewMember(item.memberId ?? "everyone");
    setShowAddForm(true);
  }

  function handleDelete(item: LinkItem) {
    Alert.alert("削除", `「${item.title}」を削除しますか？`, [
      { text: "キャンセル", style: "cancel" },
      { text: "削除", style: "destructive", onPress: () => deleteLinkItem(item.id) },
    ]);
  }

  function getMemberDisplay(memberId?: string) {
    if (!memberId || memberId === "everyone") return { emoji: "🌈", name: "全員" };
    const m = members.find((mem) => mem.id === memberId);
    return m ? { emoji: m.emoji, name: m.name } : { emoji: "👤", name: "不明" };
  }

  function getCategoryEmoji(category?: string) {
    return CATEGORIES.find((c) => c.value === category)?.icon ?? "📌";
  }

  const renderItem = useCallback(
    ({ item }: { item: LinkItem }) => {
      const memberInfo = getMemberDisplay(item.memberId);
      return (
        <View
          style={[
            styles.itemCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.itemHeader}>
            <Text style={styles.categoryEmoji}>{getCategoryEmoji(item.category)}</Text>
            <Text style={[styles.itemTitle, { color: colors.foreground }]}>{item.title}</Text>
          </View>
          {item.note && <Text style={[styles.itemNote, { color: colors.muted }]}>{item.note}</Text>}
          <View style={styles.itemFooter}>
            <Text style={[styles.memberBadge, { color: colors.muted }]}>
              {memberInfo.emoji} {memberInfo.name}
            </Text>
            <View style={styles.actions}>
              <Pressable
                onPress={() => Linking.openURL(item.url)}
                style={({ pressed }) => [
                  styles.actionBtn,
                  { backgroundColor: colors.primary },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <MaterialIcons name="open-in-new" size={16} color="#fff" />
                <Text style={styles.actionBtnText}>開く</Text>
              </Pressable>
              <Pressable
                onPress={() => handleEdit(item)}
                style={({ pressed }) => [
                  styles.actionBtn,
                  { backgroundColor: colors.muted },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <MaterialIcons name="edit" size={16} color="#fff" />
              </Pressable>
              <Pressable
                onPress={() => handleDelete(item)}
                style={({ pressed }) => [
                  styles.actionBtn,
                  { backgroundColor: colors.error },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <MaterialIcons name="delete" size={16} color="#fff" />
              </Pressable>
            </View>
          </View>
        </View>
      );
    },
    [colors, members]
  );

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={100}
      >
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerRow}>
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
              <Text style={[styles.title, { color: colors.foreground }]}>🔗 リンク集</Text>
              <Text style={[styles.subtitle, { color: colors.muted }]}>
                {linkItems.length}件のリンク
              </Text>
            </View>
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

        {/* Member Filter */}
        <View style={[styles.filterContainer, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
          <FlatList
            horizontal
            data={allMemberOptions}
            keyExtractor={(m) => m.id}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item: m }) => (
              <Pressable
                onPress={() => setFilterMember(m.id)}
                style={({ pressed }) => [
                  styles.filterChip,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <View style={[styles.checkbox, { borderColor: colors.border }]}>
                  {filterMember === m.id && (
                    <MaterialIcons name="check" size={16} color={colors.primary} />
                  )}
                </View>
                <Text style={styles.filterEmoji}>{m.emoji}</Text>
                <Text
                  style={[
                    styles.filterLabel,
                    { color: colors.foreground },
                  ]}
                >
                  {m.name}
                </Text>
                {filterMember !== "all" && (
                  <Text
                    style={[
                      styles.filterCount,
                      { color: filterMember === m.id ? "#fff" : colors.muted },
                    ]}
                  >
                    {filterMember === "all"
                      ? linkItems.length
                      : linkItems.filter((i) => {
                          const mid = i.memberId ?? "everyone";
                          return mid === m.id || mid === "everyone";
                        }).length}
                  </Text>
                )}
              </Pressable>
            )}
          />
        </View>

        {/* List */}
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                リンクがありません
              </Text>
            </View>
          }
        />


      </KeyboardAvoidingView>

      {/* Add/Edit Modal */}
      <Modal visible={showAddForm} animationType="slide">
        <ScreenContainer edges={["top", "bottom", "left", "right"]}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                {editingItem ? "リンクを編集" : "リンクを追加"}
              </Text>
              <Pressable onPress={() => setShowAddForm(false)}>
                <MaterialIcons name="close" size={24} color={colors.muted} />
              </Pressable>
            </View>
            <ScrollView style={styles.modalBody}>
              <TextInput
                placeholder="タイトル"
                placeholderTextColor={colors.muted}
                value={newTitle}
                onChangeText={setNewTitle}
                style={[styles.modalInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]}
              />
              <Pressable
                onPress={() => setShowCategoryPicker(true)}
                style={({ pressed }) => [
                  styles.categorySelector,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={styles.categorySelectorIcon}>
                  {CATEGORIES.find((c) => c.value === newCategory)?.icon ?? "📌"}
                </Text>
                <Text style={[styles.categorySelectorText, { color: colors.foreground }]}>
                  {CATEGORIES.find((c) => c.value === newCategory)?.label ?? "その他"}
                </Text>
                <MaterialIcons name="keyboard-arrow-down" size={20} color={colors.muted} />
              </Pressable>
              <TextInput
                placeholder="URL"
                placeholderTextColor={colors.muted}
                value={newUrl}
                onChangeText={setNewUrl}
                style={[styles.modalInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]}
                autoCapitalize="none"
                keyboardType="url"
              />
              <TextInput
                placeholder="メモ（任意）"
                placeholderTextColor={colors.muted}
                value={newNote}
                onChangeText={setNewNote}
                style={[styles.modalInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface, height: 80 }]}
                multiline
              />
              <View style={styles.memberRow}>
                {assignMemberOptions.map((m) => (
                  <Pressable
                    key={m.id}
                    onPress={() => setNewMember(m.id)}
                    style={({ pressed }) => [
                      styles.memberChip,
                      {
                        backgroundColor: newMember === m.id ? colors.primary : colors.surface,
                        borderColor: colors.border,
                      },
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Text style={styles.memberChipEmoji}>{m.emoji}</Text>
                    <Text
                      style={[
                        styles.memberChipLabel,
                        { color: newMember === m.id ? "#fff" : colors.foreground },
                      ]}
                    >
                      {m.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Pressable
                onPress={handleAdd}
                style={({ pressed }) => [
                  styles.submitButton,
                  { backgroundColor: colors.primary },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={styles.submitButtonText}>{editingItem ? "保存" : "追加"}</Text>
              </Pressable>
            </ScrollView>
          </KeyboardAvoidingView>
        </ScreenContainer>
      </Modal>
      <ScrollCategoryPicker
        visible={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        onConfirm={setNewCategory}
        categories={CATEGORIES}
        initialValue={newCategory}
        label="カテゴリを選択"
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: UNIFIED_HEADER_STYLES.header,
  headerRow: UNIFIED_HEADER_STYLES.headerLeft,
  homeButton: UNIFIED_HEADER_STYLES.homeButton,
  title: UNIFIED_HEADER_STYLES.headerTitle,
  subtitle: UNIFIED_HEADER_STYLES.headerSubtitle,
  addButton: UNIFIED_HEADER_STYLES.addButton,
  filterContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    gap: 6,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  filterEmoji: {
    fontSize: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  filterCount: {
    fontSize: 12,
    marginLeft: 6,
  },
  addForm: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
  },
  categorySelector: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    gap: 8,
  },
  categorySelectorIcon: { fontSize: 18 },
  categorySelectorText: { fontSize: 14, fontWeight: "600", flex: 1 },
  memberRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
    gap: 8,
  },
  memberChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  memberChipEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  memberChipLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  formActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  formBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  formBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  itemCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  itemTitle: {
    fontSize: 17,
    fontWeight: "600",
    flex: 1,
  },
  itemNote: {
    fontSize: 14,
    marginBottom: 12,
  },
  itemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  memberBadge: {
    fontSize: 13,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  modalBody: {
    padding: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
});
