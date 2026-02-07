import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAppStore } from "@/lib/store";
import { EmojiPicker } from "@/components/emoji-picker";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const PRESET_COLORS = [
  "#60B5D1", "#F5C842", "#F06292", "#F8A4C8", "#8BC34A",
  "#FF7043", "#AB47BC", "#26A69A", "#5C6BC0", "#EC407A",
  "#FFA726", "#66BB6A", "#42A5F5", "#EF5350", "#7E57C2",
  "#78909C",
];

export default function MemberFormScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ memberId?: string }>();
  const { currentTrip, addMember, updateMember, deleteMember } = useAppStore();

  const members = currentTrip?.members ?? [];

  const isEditing = !!params.memberId;
  const existingMember = isEditing
    ? members.find((m) => m.id === params.memberId)
    : undefined;

  const [name, setName] = useState(existingMember?.name ?? "");
  const [emoji, setEmoji] = useState(existingMember?.emoji ?? "😊");
  const [color, setColor] = useState(existingMember?.color ?? PRESET_COLORS[0]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  function handleSave() {
    if (!name.trim()) {
      Alert.alert("エラー", "名前を入力してください");
      return;
    }

    if (isEditing && existingMember) {
      updateMember({ ...existingMember, name: name.trim(), emoji, color });
    } else {
      addMember({ name: name.trim(), emoji, color });
    }
    router.back();
  }

  function handleDelete() {
    if (!existingMember) return;
    Alert.alert(
      "メンバーを削除",
      `「${existingMember.name}」を削除しますか？\nこのメンバーが参加している予定からも除外されます。`,
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "削除",
          style: "destructive",
          onPress: () => {
            deleteMember(existingMember.id);
            router.back();
          },
        },
      ]
    );
  }

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
            <MaterialIcons name="close" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            {isEditing ? "メンバーを編集" : "メンバーを追加"}
          </Text>
          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [
              styles.saveButton,
              { backgroundColor: colors.primary },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Text style={styles.saveButtonText}>保存</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
          {/* Preview */}
          <View style={styles.previewSection}>
            <View style={[styles.previewCircle, { backgroundColor: color + "20" }]}>
              <Text style={styles.previewEmoji}>{emoji}</Text>
            </View>
            <Text style={[styles.previewName, { color: colors.foreground }]}>
              {name || "名前未入力"}
            </Text>
          </View>

          {/* Emoji */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>アイコン</Text>
            <Pressable
              onPress={() => setShowEmojiPicker(true)}
              style={({ pressed }) => [
                styles.emojiSelector,
                { backgroundColor: colors.surface, borderColor: colors.border },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={styles.emojiSelectorEmoji}>{emoji}</Text>
              <Text style={[styles.emojiSelectorText, { color: colors.muted }]}>タップして変更</Text>
              <MaterialIcons name="chevron-right" size={20} color={colors.muted} />
            </Pressable>
          </View>

          {/* Name */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>名前 *</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]}
              value={name}
              onChangeText={setName}
              placeholder="メンバーの名前"
              placeholderTextColor={colors.muted}
              returnKeyType="done"
            />
          </View>

          {/* Color */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>テーマカラー</Text>
            <View style={styles.colorGrid}>
              {PRESET_COLORS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setColor(c)}
                  style={({ pressed }) => [
                    styles.colorButton,
                    { backgroundColor: c },
                    color === c && styles.colorButtonSelected,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  {color === c && <MaterialIcons name="check" size={18} color="#fff" />}
                </Pressable>
              ))}
            </View>
          </View>

          {/* Delete */}
          {isEditing && (
            <Pressable
              onPress={handleDelete}
              style={({ pressed }) => [
                styles.deleteButton,
                { backgroundColor: colors.error + "15", borderColor: colors.error },
                pressed && { opacity: 0.7 },
              ]}
            >
              <MaterialIcons name="delete-outline" size={18} color={colors.error} />
              <Text style={[styles.deleteButtonText, { color: colors.error }]}>このメンバーを削除</Text>
            </Pressable>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <EmojiPicker
        visible={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onSelect={setEmoji}
        currentEmoji={emoji}
      />
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
  headerTitle: { fontSize: 17, fontWeight: "700" },
  saveButton: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 18 },
  saveButtonText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  form: { padding: 16, gap: 24 },
  previewSection: { alignItems: "center", paddingVertical: 16, gap: 10 },
  previewCircle: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  previewEmoji: { fontSize: 38 },
  previewName: { fontSize: 20, fontWeight: "700" },
  field: { gap: 8 },
  label: { fontSize: 14, fontWeight: "700" },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15 },
  emojiSelector: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
  },
  emojiSelectorEmoji: { fontSize: 28 },
  emojiSelectorText: { flex: 1, fontSize: 14 },
  colorGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  colorButton: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  colorButtonSelected: {
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    marginTop: 10,
  },
  deleteButtonText: { fontSize: 14, fontWeight: "700" },
});
