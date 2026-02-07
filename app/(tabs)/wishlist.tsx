import { useCallback, useState, useMemo } from "react";
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
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAppStore } from "@/lib/store";
import { WishlistItem, MapType } from "@/data/types";
import { EVERYONE_MEMBER } from "@/data/members";
import { openMap } from "@/data/utils";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function WishlistScreen() {
  const colors = useColors();
  const { currentTrip, addWishlistItem, deleteWishlistItem, toggleWishlistItem } = useAppStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newMapType, setNewMapType] = useState<MapType>("naver");
  const [newMapQuery, setNewMapQuery] = useState("");
  const [newNote, setNewNote] = useState("");
  const [newMember, setNewMember] = useState("everyone");
  const [filterMember, setFilterMember] = useState("all");

  const members = currentTrip?.members ?? [];
  const wishlistItems = currentTrip?.wishlistItems ?? [];

  const allMemberOptions = useMemo(
    () => [{ id: "all", name: "全員", emoji: "📍", color: "#666" }, EVERYONE_MEMBER, ...members],
    [members]
  );
  const assignMemberOptions = useMemo(() => [EVERYONE_MEMBER, ...members], [members]);

  const filteredItems = useMemo(() => {
    if (filterMember === "all") return wishlistItems;
    return wishlistItems.filter((i) => {
      const mid = i.memberId ?? "everyone";
      return mid === filterMember || mid === "everyone";
    });
  }, [wishlistItems, filterMember]);

  const visitedCount = wishlistItems.filter((i) => i.visited).length;

  function handleAdd() {
    if (!newName.trim()) {
      Alert.alert("エラー", "場所の名前を入力してください");
      return;
    }
    addWishlistItem({
      name: newName.trim(),
      location: newLocation.trim() || undefined,
      mapInfo: newMapQuery.trim() ? { type: newMapType, query: newMapQuery.trim() } : undefined,
      note: newNote.trim() || undefined,
      visited: false,
      memberId: newMember,
    });
    setNewName("");
    setNewLocation("");
    setNewMapQuery("");
    setNewNote("");
  }

  function handleDelete(item: WishlistItem) {
    Alert.alert("削除", `「${item.name}」を削除しますか？`, [
      { text: "キャンセル", style: "cancel" },
      { text: "削除", style: "destructive", onPress: () => deleteWishlistItem(item.id) },
    ]);
  }

  function getMemberDisplay(memberId?: string) {
    if (!memberId || memberId === "everyone") return { emoji: "🌈", name: "全員" };
    const m = members.find((mem) => mem.id === memberId);
    return m ? { emoji: m.emoji, name: m.name } : { emoji: "👤", name: "不明" };
  }

  const renderItem = useCallback(
    ({ item }: { item: WishlistItem }) => {
      const memberInfo = getMemberDisplay(item.memberId);
      return (
        <View
          style={[
            styles.itemCard,
            {
              backgroundColor: item.visited ? colors.surface : colors.background,
              borderColor: colors.border,
            },
          ]}
        >
          <Pressable
            onPress={() => toggleWishlistItem(item.id)}
            style={({ pressed }) => [styles.checkbox, pressed && { opacity: 0.6 }]}
          >
            <MaterialIcons
              name={item.visited ? "check-circle" : "radio-button-unchecked"}
              size={24}
              color={item.visited ? colors.success : colors.muted}
            />
          </Pressable>
          <View style={styles.itemInfo}>
            <Text
              style={[
                styles.itemName,
                { color: item.visited ? colors.muted : colors.foreground },
                item.visited && styles.itemNameChecked,
              ]}
            >
              📍 {item.name}
            </Text>
            {item.location && (
              <Text style={[styles.itemLocation, { color: colors.muted }]}>{item.location}</Text>
            )}
            <View style={styles.itemMeta}>
              <Text style={[styles.itemMember, { color: colors.muted }]}>
                {memberInfo.emoji} {memberInfo.name}
              </Text>
              {item.note && (
                <Text style={[styles.itemNote, { color: colors.muted }]} numberOfLines={1}>
                  📝 {item.note}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.itemActions}>
            {item.mapInfo?.query && (
              <Pressable
                onPress={() => openMap(item.mapInfo!)}
                style={({ pressed }) => [pressed && { opacity: 0.5 }]}
              >
                <MaterialIcons name="map" size={20} color={colors.primary} />
              </Pressable>
            )}
            <Pressable
              onPress={() => handleDelete(item)}
              style={({ pressed }) => [pressed && { opacity: 0.5 }]}
            >
              <MaterialIcons name="close" size={18} color={colors.muted} />
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
          <Text style={{ fontSize: 48 }}>📍</Text>
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
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>行きたいところ</Text>
            <Text style={[styles.headerSub, { color: colors.muted }]}>
              {visitedCount}/{wishlistItems.length}箇所 訪問済み
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
              placeholder="場所の名前"
              placeholderTextColor={colors.muted}
              returnKeyType="done"
              autoFocus
            />
            <TextInput
              style={[styles.addInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
              value={newLocation}
              onChangeText={setNewLocation}
              placeholder="エリア（例: 明洞、聖水）"
              placeholderTextColor={colors.muted}
              returnKeyType="done"
            />
            {/* Map search */}
            <View style={styles.mapRow}>
              <Pressable
                onPress={() => setNewMapType("naver")}
                style={[
                  styles.miniChip,
                  {
                    backgroundColor: newMapType === "naver" ? "#03C75A" : colors.background,
                    borderColor: newMapType === "naver" ? "#03C75A" : colors.border,
                  },
                ]}
              >
                <Text style={[styles.miniChipText, { color: newMapType === "naver" ? "#fff" : colors.foreground }]}>
                  Naver
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setNewMapType("google")}
                style={[
                  styles.miniChip,
                  {
                    backgroundColor: newMapType === "google" ? "#4285F4" : colors.background,
                    borderColor: newMapType === "google" ? "#4285F4" : colors.border,
                  },
                ]}
              >
                <Text style={[styles.miniChipText, { color: newMapType === "google" ? "#fff" : colors.foreground }]}>
                  Google
                </Text>
              </Pressable>
              <TextInput
                style={[styles.mapInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
                value={newMapQuery}
                onChangeText={setNewMapQuery}
                placeholder="地図検索クエリ"
                placeholderTextColor={colors.muted}
                returnKeyType="done"
              />
            </View>
            {/* Member */}
            <View style={styles.addFormSection}>
              <Text style={[styles.addFormLabel, { color: colors.muted }]}>誰が行きたい？</Text>
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
                  ? wishlistItems.length
                  : wishlistItems.filter((i) => {
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
              <Text style={{ fontSize: 40 }}>📍</Text>
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                行きたい場所を追加しましょう
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
  mapRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  mapInput: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
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
  itemLocation: { fontSize: 12 },
  itemMeta: { flexDirection: "row", gap: 8 },
  itemMember: { fontSize: 12 },
  itemNote: { fontSize: 12, flex: 1 },
  itemActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 14, fontWeight: "500" },
});
