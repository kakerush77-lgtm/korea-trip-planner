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
      imageUrl: newImageUrl,
    });
    setNewName("");
    setNewQuantity("1");
    setNewPrice("");
    setNewNote("");
    setNewImageUrl(undefined);
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
      <Pressable
        onLongPress={() => handleDelete(item)}
        style={({ pressed }) => [
          styles.itemCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
          pressed && { opacity: 0.7 },
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
        </View>
      </Pressable>
    );
  };

  return (
    <ScreenContainer>
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
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>🛒️ 買いたいもの</Text>
        <View style={styles.headerRight}>
          <Text style={[styles.progress, { color: colors.muted }]}>
            {boughtCount}/{shoppingItems.length}
          </Text>
          <Pressable
            onPress={() => setShowAddForm(!showAddForm)}
            style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.7 }]}
          >
            <MaterialIcons name={showAddForm ? "close" : "add"} size={24} color={colors.primary} />
          </Pressable>
        </View>
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

      {showAddForm && (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={[styles.addForm, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text style={[styles.formTitle, { color: colors.foreground }]}>新しい商品を追加</Text>
          <TextInput
            placeholder="商品名"
            placeholderTextColor={colors.muted}
            value={newName}
            onChangeText={setNewName}
            style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
          />
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
          <TextInput
            placeholder="メモ（任意）"
            placeholderTextColor={colors.muted}
            value={newNote}
            onChangeText={setNewNote}
            style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
          />

          {/* Member Selection */}
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

          {/* Image Upload */}
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

          <Pressable
            onPress={handleAdd}
            style={({ pressed }) => [
              styles.submitBtn,
              { backgroundColor: colors.primary },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={styles.submitText}>追加</Text>
          </Pressable>
        </KeyboardAvoidingView>
      )}

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
  homeButton: UNIFIED_HEADER_STYLES.homeButton,
  title: UNIFIED_HEADER_STYLES.headerTitle,
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  progress: {
    fontSize: 16,
    fontWeight: "600",
  },
  addBtn: {
    padding: 4,
  },
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
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
  },
});
