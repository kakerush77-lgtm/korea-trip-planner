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
import { useAppStore, generateDays } from "@/lib/store";
import { EmojiPicker } from "@/components/emoji-picker";
import { CalendarPicker } from "@/components/calendar-picker";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const TRIP_EMOJIS = ["✈️", "🇰🇷", "🇯🇵", "🇺🇸", "🇫🇷", "🇮🇹", "🇹🇭", "🇹🇼", "🏖️", "🏔️", "🌏", "🗺️", "🚗", "🚢", "🏕️", "🎒"];

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return "選択してください";
  try {
    const d = new Date(dateStr + "T00:00:00");
    const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}(${weekdays[d.getDay()]})`;
  } catch {
    return dateStr;
  }
}

export default function TripFormScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ tripId?: string }>();
  const { state, addTrip, updateTrip: updateTripAction, deleteTrip, setCurrentTrip } = useAppStore();

  const isEditing = !!params.tripId;
  const existingTrip = isEditing ? state.trips.find((t) => t.id === params.tripId) : undefined;

  const [name, setName] = useState(existingTrip?.name ?? "");
  const [emoji, setEmoji] = useState(existingTrip?.emoji ?? "✈️");
  const [startDate, setStartDate] = useState(existingTrip?.startDate ?? "");
  const [endDate, setEndDate] = useState(existingTrip?.endDate ?? "");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);

  function handleSave() {
    if (!name.trim()) {
      Alert.alert("エラー", "旅行名を入力してください");
      return;
    }
    if (!startDate || !endDate) {
      Alert.alert("エラー", "開始日と終了日を選択してください");
      return;
    }
    if (startDate > endDate) {
      Alert.alert("エラー", "終了日は開始日以降にしてください");
      return;
    }

    if (isEditing && existingTrip) {
      const newDays =
        existingTrip.startDate !== startDate || existingTrip.endDate !== endDate
          ? generateDays(startDate, endDate)
          : existingTrip.days;
      updateTripAction({
        ...existingTrip,
        name: name.trim(),
        emoji,
        startDate,
        endDate,
        days: newDays,
        updatedAt: new Date().toISOString(),
      });
    } else {
      const tripId = addTrip({ name: name.trim(), emoji, startDate, endDate });
      setCurrentTrip(tripId);
    }
    router.back();
  }

  function handleDelete() {
    if (!existingTrip) return;
    if (state.trips.length <= 1) {
      Alert.alert("エラー", "最後の旅行は削除できません");
      return;
    }
    Alert.alert("旅行を削除", `「${existingTrip.name}」を削除しますか？\nすべての予定も削除されます。`, [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: () => {
          deleteTrip(existingTrip.id);
          router.back();
        },
      },
    ]);
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
            {isEditing ? "旅行を編集" : "旅行を作成"}
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
            <Text style={styles.previewEmoji}>{emoji}</Text>
            <Text style={[styles.previewName, { color: colors.foreground }]}>
              {name || "旅行名を入力"}
            </Text>
          </View>

          {/* Emoji quick select */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>アイコン</Text>
            <View style={styles.emojiGrid}>
              {TRIP_EMOJIS.map((e) => (
                <Pressable
                  key={e}
                  onPress={() => setEmoji(e)}
                  style={({ pressed }) => [
                    styles.emojiOption,
                    {
                      backgroundColor: emoji === e ? colors.primary + "20" : colors.surface,
                      borderColor: emoji === e ? colors.primary : colors.border,
                    },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text style={styles.emojiOptionText}>{e}</Text>
                </Pressable>
              ))}
              <Pressable
                onPress={() => setShowEmojiPicker(true)}
                style={({ pressed }) => [
                  styles.emojiOption,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <MaterialIcons name="more-horiz" size={20} color={colors.muted} />
              </Pressable>
            </View>
          </View>

          {/* Name */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>旅行名 *</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]}
              value={name}
              onChangeText={setName}
              placeholder="例: 韓国旅行 2026"
              placeholderTextColor={colors.muted}
              returnKeyType="done"
            />
          </View>

          {/* Date selection with calendar */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>旅行期間 *</Text>
            <View style={styles.dateRow}>
              <Pressable
                onPress={() => setShowStartCalendar(true)}
                style={({ pressed }) => [
                  styles.dateButton,
                  { backgroundColor: colors.surface, borderColor: startDate ? colors.primary : colors.border },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <MaterialIcons name="event" size={18} color={startDate ? colors.primary : colors.muted} />
                <View>
                  <Text style={[styles.dateLabel, { color: colors.muted }]}>開始日</Text>
                  <Text style={[styles.dateValue, { color: startDate ? colors.foreground : colors.muted }]}>
                    {formatDisplayDate(startDate)}
                  </Text>
                </View>
              </Pressable>
              <MaterialIcons name="arrow-forward" size={16} color={colors.muted} />
              <Pressable
                onPress={() => setShowEndCalendar(true)}
                style={({ pressed }) => [
                  styles.dateButton,
                  { backgroundColor: colors.surface, borderColor: endDate ? colors.primary : colors.border },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <MaterialIcons name="event" size={18} color={endDate ? colors.primary : colors.muted} />
                <View>
                  <Text style={[styles.dateLabel, { color: colors.muted }]}>終了日</Text>
                  <Text style={[styles.dateValue, { color: endDate ? colors.foreground : colors.muted }]}>
                    {formatDisplayDate(endDate)}
                  </Text>
                </View>
              </Pressable>
            </View>
            {startDate && endDate && startDate <= endDate && (
              <View style={[styles.durationBadge, { backgroundColor: colors.primary + "15" }]}>
                <MaterialIcons name="date-range" size={14} color={colors.primary} />
                <Text style={[styles.durationText, { color: colors.primary }]}>
                  {Math.ceil((new Date(endDate + "T00:00:00").getTime() - new Date(startDate + "T00:00:00").getTime()) / 86400000) + 1}日間の旅行
                </Text>
              </View>
            )}
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
              <Text style={[styles.deleteButtonText, { color: colors.error }]}>この旅行を削除</Text>
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
      <CalendarPicker
        visible={showStartCalendar}
        onClose={() => setShowStartCalendar(false)}
        onSelect={(date) => {
          setStartDate(date);
          if (!endDate || date > endDate) setEndDate(date);
        }}
        selectedDate={startDate}
      />
      <CalendarPicker
        visible={showEndCalendar}
        onClose={() => setShowEndCalendar(false)}
        onSelect={setEndDate}
        selectedDate={endDate}
        minDate={startDate || undefined}
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
  previewSection: { alignItems: "center", paddingVertical: 20, gap: 10 },
  previewEmoji: { fontSize: 48 },
  previewName: { fontSize: 20, fontWeight: "700" },
  field: { gap: 8 },
  label: { fontSize: 14, fontWeight: "700" },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15 },
  emojiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  emojiOption: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiOptionText: { fontSize: 22 },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  dateLabel: { fontSize: 10, fontWeight: "600" },
  dateValue: { fontSize: 13, fontWeight: "600", marginTop: 2 },
  durationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  durationText: { fontSize: 13, fontWeight: "600" },
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
