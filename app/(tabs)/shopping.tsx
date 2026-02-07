import { useState, useMemo } from "react";
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
  Image,
  Modal,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAppStore } from "@/lib/store";
import { ShoppingItem } from "@/data/types";
import { EVERYONE_MEMBER } from "@/data/members";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { UNIFIED_HEADER_STYLES, HEADER_CONSTANTS } from "@/constants/header-styles";

export default function ShoppingScreen() {
  const colors = useColors();
  const router = useRouter();
  const { currentTrip, addShoppingItem, deleteShoppingItem, toggleShoppingItem, updateShoppingItem } = useAppStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newQuantity, setNewQuantity] = useState("1");
  const [newPrice, setNewPrice] = useState("");
  const [newNote, setNewNote] = useState("");
  const [newMember, setNewMember] = useState("everyone");
  const [newImageUrl, setNewImageUrl] = useState<string | undefined>(undefined);
  const [filterMember, setFilterMember] = useState("all");
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);

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

  async function handlePickImage() {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("権限が必要です", "写真を選択するにはカメラロールへのアクセス権限が必要です");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setNewImageUrl(result.assets[0].uri);
    }
  }

  function handleEdit(item: ShoppingItem) {
    setEditingItem(item);
    setNewName(item.name);
    setNewQuantity(String(item.quantity));
    setNewPrice(item.price || "");
    setNewNote(item.note || "");
    setNewMember(item.memberId || "everyone");
    setNewImageUrl(item.imageUrl);
    setShowAddForm(true);
  }

  function handleAdd() {
    if (!newName.trim()) {
      Alert.alert("エラー", "商品名を入力してください");
      return;
    }
    const qty = parseInt(newQuantity) || 1;
    if (editingItem) {
      updateShoppingItem({
        ...editingItem,
        name: newName.trim(),
        quantity: qty,
        price: newPrice.trim() || undefined,
        note: newNote.trim() || undefined,
        memberId: newMember,
        imageUrl: newImageUrl,
      });
    } else {
      addShoppingItem({
        name: newName.trim(),
        quantity: qty,
        price: newPrice.trim() || undefined,
        note: newNote.trim() || undefined,
        bought: false,
        memberId: newMember,
        imageUrl: newImageUrl,
      });
    }
    setNewName("");
    setNewQuantity("1");
    setNewPrice("");
    setNewNote("");
    setNewImageUrl(undefined);
    setEditingItem(null);
    setShowAddForm(false);
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

  const renderItem = ({ item }: { item: ShoppingItem }) => {
    const memberDisplay = getMemberDisplay(item.memberId);
    return (
      <View
        style={[
          styles.itemCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.itemRow}>
          <Pressable onPress={() => toggleShoppingItem(item.id)} style={styles.itemCheckbox}>
            <MaterialIcons
              name={item.bought ? "check-box" : "check-box-outline-blank"}
              size={24}
              color={item.bought ? colors.success : colors.muted}
            />
          </Pressable>
          <View style={{ flex: 1 }}>
            <View style={styles.itemHeader}>
              <Text
                style={[
                  styles.itemName,
                  { color: item.bought ? colors.muted : colors.foreground },
                  item.bought && { textDecorationLine: "line-through" },
                ]}
              >
                {item.name}
              </Text>
              {item.quantity > 1 && (
                <Text style={[styles.itemQuantity, { color: colors.muted }]}>×{item.quantity}</Text>
              )}
            </View>
            {item.price && (
              <Text style={[styles.itemPrice, { color: colors.primary }]}>¥{item.price}</Text>
            )}
            {item.note && <Text style={[styles.itemNote, { color: colors.muted }]}>{item.note}</Text>}
            <View style={styles.itemMember}>
              <Text style={[styles.itemMemberText, { color: colors.muted }]}>
                {memberDisplay.emoji} {memberDisplay.name}
              </Text>
            </View>
            {item.imageUrl && (
              <Image source={{ uri: item.imageUrl }} style={styles.itemImage} resizeMode="cover" />
            )}
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
              <MaterialIcons name="edit" size={18} color="#fff" />
            </Pressable>
            <Pressable
              onPress={() => handleDelete(item)}
              style={({ pressed }) => [
                styles.deleteButton,
                { backgroundColor: colors.error },
                pressed && { opacity: 0.7 },
              ]}
            >
              <MaterialIcons name="delete" size={18} color="#fff" />
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
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
          <Text style={styles.headerEmoji}>🛒️</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>買いたいもの</Text>
            <Text style={[styles.headerSubtitle, { color: colors.muted }]}>
              {boughtCount}/{shoppingItems.length}個 購入済み
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => setShowAddForm(!showAddForm)}
          style={({ pressed }) => [
            styles.addButton,
            { backgroundColor: colors.primary },
            pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] },
          ]}
        >
          <MaterialIcons name="add" size={HEADER_CONSTANTS.ADD_ICON_SIZE} color="#fff" />
        </Pressable>
      </View>

      {/* Member Filter */}
      <View style={[styles.filterRow, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
        <FlatList
          horizontal
          data={allMemberOptions}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setFilterMember(item.id)}
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
                {filterMember === item.id && (
                  <MaterialIcons name="check" size={16} color={colors.primary} />
                )}
              </View>
              <Text style={[styles.filterEmoji]}>{item.emoji}</Text>
              <Text
                style={[
                  styles.filterName,
                  { color: colors.foreground },
                ]}
              >
                {item.name}
              </Text>
            </Pressable>
          )}
        />
      </View>

      <Modal visible={showAddForm} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAddForm(false)}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Pressable
              onPress={() => setShowAddForm(false)}
              style={({ pressed }) => [pressed && { opacity: 0.6 }]}
            >
              <MaterialIcons name="close" size={24} color={colors.foreground} />
            </Pressable>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {editingItem ? "商品を編集" : "商品を追加"}
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
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.foreground }]}>商品名 *</Text>
                <TextInput
                  placeholder="商品の名前"
                  placeholderTextColor={colors.muted}
                  value={newName}
                  onChangeText={setNewName}
                  style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
                />
              </View>
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.foreground }]}>数量・価格</Text>
                <View style={styles.formRow}>
                  <TextInput
                    placeholder="数量"
                    placeholderTextColor={colors.muted}
                    value={newQuantity}
                    onChangeText={setNewQuantity}
                    keyboardType="number-pad"
                    style={[styles.inputSmall, { color: colors.foreground, borderColor: colors.border }]}
                  />
                  <TextInput
                    placeholder="価格（任意）"
                    placeholderTextColor={colors.muted}
                    value={newPrice}
                    onChangeText={setNewPrice}
                    keyboardType="number-pad"
                    style={[styles.inputSmall, { color: colors.foreground, borderColor: colors.border }]}
                  />
                </View>
              </View>
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.foreground }]}>メモ</Text>
                <TextInput
                  placeholder="メモ（任意）"
                  placeholderTextColor={colors.muted}
                  value={newNote}
                  onChangeText={setNewNote}
                  style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
                />
              </View>
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.foreground }]}>担当</Text>
                <View style={styles.memberRow}>
                  {assignMemberOptions.map((m) => (
                    <Pressable
                      key={m.id}
                      onPress={() => setNewMember(m.id)}
                      style={({ pressed }) => [
                        styles.memberChip,
                        {
                          backgroundColor: newMember === m.id ? colors.primary : colors.background,
                          borderColor: colors.border,
                        },
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      <Text style={[styles.memberEmoji]}>{m.emoji}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.foreground }]}>写真</Text>
                <View style={styles.imageSection}>
                  {newImageUrl ? (
                    <View style={styles.imagePreview}>
                      <Image source={{ uri: newImageUrl }} style={styles.previewImage} resizeMode="cover" />
                      <Pressable
                        onPress={() => setNewImageUrl(undefined)}
                        style={({ pressed }) => [
                          styles.removeImageBtn,
                          { backgroundColor: colors.error },
                          pressed && { opacity: 0.7 },
                        ]}
                      >
                        <MaterialIcons name="close" size={16} color="#fff" />
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      onPress={handlePickImage}
                      style={({ pressed }) => [
                        styles.uploadBtn,
                        { backgroundColor: colors.background, borderColor: colors.border },
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      <MaterialIcons name="add-a-photo" size={24} color={colors.primary} />
                      <Text style={[styles.uploadText, { color: colors.muted }]}>写真を追加</Text>
                    </Pressable>
                  )}
                </View>
              </View>
              <View style={{ height: 40 }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="shopping-cart" size={48} color={colors.muted} />
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              買いたいものがまだありません
            </Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: UNIFIED_HEADER_STYLES.header,
  headerLeft: UNIFIED_HEADER_STYLES.headerLeft,
  homeButton: UNIFIED_HEADER_STYLES.homeButton,
  headerEmoji: { fontSize: 28 },
  headerTitle: UNIFIED_HEADER_STYLES.headerTitle,
  headerSubtitle: UNIFIED_HEADER_STYLES.headerSubtitle,
  addButton: UNIFIED_HEADER_STYLES.addButton,
  filterRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  filterList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
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
  filterName: {
    fontSize: 14,
    fontWeight: "600",
  },
  addForm: {
    padding: 16,
    borderBottomWidth: 1,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 12,
  },
  formRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  inputSmall: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  memberRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  memberChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  memberEmoji: {
    fontSize: 20,
  },
  imageSection: {
    marginBottom: 12,
  },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    gap: 8,
  },
  uploadText: {
    fontSize: 14,
  },
  imagePreview: {
    position: "relative",
    width: "100%",
    height: 200,
    borderRadius: 8,
    overflow: "hidden",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  removeImageBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  itemCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  itemRow: {
    flexDirection: "row",
    gap: 12,
  },
  itemCheckbox: {
    paddingTop: 2,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
  },
  itemQuantity: {
    fontSize: 14,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  itemNote: {
    fontSize: 14,
    marginBottom: 6,
  },
  itemMember: {
    marginBottom: 8,
  },
  itemMemberText: {
    fontSize: 13,
  },
  itemImage: {
    width: "100%",
    height: 150,
    borderRadius: 8,
    marginTop: 8,
  },
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
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
  },
  modalContainer: {
    flex: 1,
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