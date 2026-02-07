import { useState, useMemo } from "react";
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
import { DAYS } from "@/data/days";
import { ScheduleEvent, MemberId } from "@/data/types";
import { EVERYONE_MEMBER } from "@/data/members";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const CATEGORIES = [
  { value: "transport", label: "移動", icon: "🚇" },
  { value: "food", label: "グルメ", icon: "🍽️" },
  { value: "shopping", label: "ショッピング", icon: "🛍️" },
  { value: "beauty", label: "ビューティー", icon: "💆" },
  { value: "sightseeing", label: "観光", icon: "📸" },
  { value: "activity", label: "アクティビティ", icon: "🎮" },
  { value: "other", label: "その他", icon: "📌" },
];

export default function EventFormScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ eventId?: string; dayIndex?: string }>();
  const { state, addEvent, updateEvent, deleteEvent } = useAppStore();

  const isEditing = !!params.eventId;
  const existingEvent = isEditing
    ? state.events.find((e) => e.id === params.eventId)
    : undefined;

  const [title, setTitle] = useState(existingEvent?.title ?? "");
  const [startTime, setStartTime] = useState(existingEvent?.startTime ?? "09:00");
  const [endTime, setEndTime] = useState(existingEvent?.endTime ?? "10:00");
  const [dayIndex, setDayIndex] = useState(
    existingEvent?.dayIndex ?? (params.dayIndex ? parseInt(params.dayIndex) : 0)
  );
  const [category, setCategory] = useState<string>(existingEvent?.category ?? "other");
  const [selectedMembers, setSelectedMembers] = useState<MemberId[]>(
    existingEvent?.members ?? ["everyone"]
  );
  const [location, setLocation] = useState(existingEvent?.location ?? "");
  const [naverQuery, setNaverQuery] = useState(existingEvent?.naverQuery ?? "");
  const [note, setNote] = useState(existingEvent?.note ?? "");

  const allMembers = useMemo(() => {
    return [EVERYONE_MEMBER, ...state.members];
  }, [state.members]);

  function toggleMember(memberId: MemberId) {
    if (memberId === "everyone") {
      setSelectedMembers(["everyone"]);
      return;
    }
    setSelectedMembers((prev) => {
      const withoutEveryone = prev.filter((m) => m !== "everyone");
      if (withoutEveryone.includes(memberId)) {
        const result = withoutEveryone.filter((m) => m !== memberId);
        return result.length === 0 ? ["everyone"] : result;
      }
      return [...withoutEveryone, memberId];
    });
  }

  function handleSave() {
    if (!title.trim()) {
      Alert.alert("エラー", "タイトルを入力してください");
      return;
    }

    const eventData: Omit<ScheduleEvent, "id"> = {
      title: title.trim(),
      startTime,
      endTime,
      dayIndex,
      category: category as ScheduleEvent["category"],
      members: selectedMembers,
      location: location.trim() || undefined,
      naverQuery: naverQuery.trim() || undefined,
      note: note.trim() || undefined,
    };

    if (isEditing && existingEvent) {
      updateEvent({ ...eventData, id: existingEvent.id });
    } else {
      addEvent(eventData);
    }
    router.back();
  }

  function handleDelete() {
    if (!existingEvent) return;
    Alert.alert("予定を削除", `「${existingEvent.title}」を削除しますか？`, [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: () => {
          deleteEvent(existingEvent.id);
          router.back();
        },
      },
    ]);
  }

  function formatTimeInput(text: string, setter: (v: string) => void) {
    // Allow only digits and colon
    const cleaned = text.replace(/[^0-9:]/g, "");
    if (cleaned.length === 2 && !cleaned.includes(":")) {
      setter(cleaned + ":");
    } else {
      setter(cleaned.slice(0, 5));
    }
  }

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [pressed && { opacity: 0.6 }]}
          >
            <MaterialIcons name="close" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            {isEditing ? "予定を編集" : "予定を追加"}
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
          {/* Title */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>タイトル *</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]}
              value={title}
              onChangeText={setTitle}
              placeholder="予定のタイトル"
              placeholderTextColor={colors.muted}
              returnKeyType="done"
            />
          </View>

          {/* Day */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>日程</Text>
            <View style={styles.chipRow}>
              {DAYS.map((day) => (
                <Pressable
                  key={day.index}
                  onPress={() => setDayIndex(day.index)}
                  style={({ pressed }) => [
                    styles.chip,
                    {
                      backgroundColor: dayIndex === day.index ? colors.primary : colors.surface,
                      borderColor: dayIndex === day.index ? colors.primary : colors.border,
                    },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: dayIndex === day.index ? "#fff" : colors.foreground },
                    ]}
                  >
                    {day.dayLabel}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Time */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>時間</Text>
            <View style={styles.timeRow}>
              <TextInput
                style={[styles.timeInput, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]}
                value={startTime}
                onChangeText={(t) => formatTimeInput(t, setStartTime)}
                placeholder="09:00"
                placeholderTextColor={colors.muted}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
                returnKeyType="done"
              />
              <Text style={[styles.timeSeparator, { color: colors.muted }]}>〜</Text>
              <TextInput
                style={[styles.timeInput, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]}
                value={endTime}
                onChangeText={(t) => formatTimeInput(t, setEndTime)}
                placeholder="10:00"
                placeholderTextColor={colors.muted}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
                returnKeyType="done"
              />
            </View>
          </View>

          {/* Category */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>カテゴリ</Text>
            <View style={styles.chipRow}>
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.value}
                  onPress={() => setCategory(cat.value)}
                  style={({ pressed }) => [
                    styles.chip,
                    {
                      backgroundColor: category === cat.value ? colors.primary : colors.surface,
                      borderColor: category === cat.value ? colors.primary : colors.border,
                    },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text style={styles.chipIcon}>{cat.icon}</Text>
                  <Text
                    style={[
                      styles.chipText,
                      { color: category === cat.value ? "#fff" : colors.foreground },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Members */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>メンバー</Text>
            <View style={styles.chipRow}>
              {allMembers.map((member) => {
                const isSelected =
                  selectedMembers.includes(member.id) ||
                  (member.id === "everyone" && selectedMembers.includes("everyone"));
                return (
                  <Pressable
                    key={member.id}
                    onPress={() => toggleMember(member.id)}
                    style={({ pressed }) => [
                      styles.chip,
                      {
                        backgroundColor: isSelected ? member.color : colors.surface,
                        borderColor: isSelected ? member.color : colors.border,
                      },
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Text style={styles.chipIcon}>{member.emoji}</Text>
                    <Text
                      style={[
                        styles.chipText,
                        { color: isSelected ? "#fff" : colors.foreground },
                      ]}
                    >
                      {member.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Location */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>場所名</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]}
              value={location}
              onChangeText={setLocation}
              placeholder="例: 明洞"
              placeholderTextColor={colors.muted}
              returnKeyType="done"
            />
          </View>

          {/* Naver Map Query */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>Naver Map検索（韓国語）</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]}
              value={naverQuery}
              onChangeText={setNaverQuery}
              placeholder="例: 명동"
              placeholderTextColor={colors.muted}
              returnKeyType="done"
            />
          </View>

          {/* Note */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>メモ</Text>
            <TextInput
              style={[styles.textArea, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]}
              value={note}
              onChangeText={setNote}
              placeholder="メモを入力..."
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Delete button */}
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
              <Text style={[styles.deleteButtonText, { color: colors.error }]}>この予定を削除</Text>
            </Pressable>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
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
  headerTitle: {
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
  form: {
    padding: 16,
    gap: 20,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    minHeight: 90,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timeInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    textAlign: "center",
  },
  timeSeparator: {
    fontSize: 16,
    fontWeight: "600",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    gap: 4,
  },
  chipIcon: {
    fontSize: 14,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
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
  deleteButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
