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
import { ScheduleEvent, MemberId, EventLink, MapInfo, MapType } from "@/data/types";
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

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

function genLinkId() {
  return `lnk-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
}

export default function EventFormScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ eventId?: string; dayIndex?: string }>();
  const { currentTrip, addEvent, updateEvent, deleteEvent } = useAppStore();

  const days = currentTrip?.days ?? [];
  const members = currentTrip?.members ?? [];
  const events = currentTrip?.events ?? [];

  const isEditing = !!params.eventId;
  const existingEvent = isEditing ? events.find((e) => e.id === params.eventId) : undefined;

  const [title, setTitle] = useState(existingEvent?.title ?? "");
  const [startHour, setStartHour] = useState(existingEvent?.startTime?.split(":")[0] ?? "09");
  const [startMin, setStartMin] = useState(existingEvent?.startTime?.split(":")[1] ?? "00");
  const [endHour, setEndHour] = useState(existingEvent?.endTime?.split(":")[0] ?? "10");
  const [endMin, setEndMin] = useState(existingEvent?.endTime?.split(":")[1] ?? "00");
  const [dayIndex, setDayIndex] = useState(
    existingEvent?.dayIndex ?? (params.dayIndex ? parseInt(params.dayIndex) : 0)
  );
  const [category, setCategory] = useState<string>(existingEvent?.category ?? "other");
  const [selectedMembers, setSelectedMembers] = useState<MemberId[]>(
    existingEvent?.members ?? ["everyone"]
  );
  const [location, setLocation] = useState(existingEvent?.location ?? "");
  const [mapType, setMapType] = useState<MapType>(existingEvent?.mapInfo?.type ?? "naver");
  const [mapQuery, setMapQuery] = useState(existingEvent?.mapInfo?.query ?? existingEvent?.naverQuery ?? "");
  const [mapUrl, setMapUrl] = useState(existingEvent?.mapInfo?.url ?? "");
  const [links, setLinks] = useState<EventLink[]>(existingEvent?.links ?? []);
  const [note, setNote] = useState(existingEvent?.note ?? "");

  const allMembers = useMemo(() => [EVERYONE_MEMBER, ...members], [members]);

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

  function addLink() {
    setLinks((prev) => [...prev, { id: genLinkId(), label: "", url: "" }]);
  }

  function updateLink(id: string, field: "label" | "url", value: string) {
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  }

  function removeLink(id: string) {
    setLinks((prev) => prev.filter((l) => l.id !== id));
  }

  function handleSave() {
    if (!title.trim()) {
      Alert.alert("エラー", "タイトルを入力してください");
      return;
    }

    const startTime = `${startHour}:${startMin}`;
    const endTime = `${endHour}:${endMin}`;

    const mapInfo: MapInfo | undefined =
      mapQuery.trim() || mapUrl.trim()
        ? { type: mapType, query: mapQuery.trim() || undefined, url: mapUrl.trim() || undefined }
        : undefined;

    const validLinks = links.filter((l) => l.url.trim());

    const eventData: Omit<ScheduleEvent, "id"> = {
      title: title.trim(),
      startTime,
      endTime,
      dayIndex,
      category: category as ScheduleEvent["category"],
      members: selectedMembers,
      location: location.trim() || undefined,
      mapInfo,
      links: validLinks.length > 0 ? validLinks : undefined,
      note: note.trim() || undefined,
      sortOrder: existingEvent?.sortOrder,
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
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {days.map((day) => (
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
                    <Text style={[styles.chipText, { color: dayIndex === day.index ? "#fff" : colors.foreground }]}>
                      {day.dayLabel} {day.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Time - Picker style */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>時間</Text>
            <View style={styles.timePickerRow}>
              {/* Start time */}
              <View style={styles.timePickerGroup}>
                <Text style={[styles.timeLabel, { color: colors.muted }]}>開始</Text>
                <View style={styles.timeSelectors}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScrollH}>
                    <View style={styles.timeChipRow}>
                      {HOURS.map((h) => (
                        <Pressable
                          key={`sh-${h}`}
                          onPress={() => setStartHour(h)}
                          style={[
                            styles.timeChip,
                            {
                              backgroundColor: startHour === h ? colors.primary : colors.surface,
                              borderColor: startHour === h ? colors.primary : colors.border,
                            },
                          ]}
                        >
                          <Text style={[styles.timeChipText, { color: startHour === h ? "#fff" : colors.foreground }]}>
                            {h}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                  <Text style={[styles.timeSep, { color: colors.muted }]}>:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScrollH}>
                    <View style={styles.timeChipRow}>
                      {MINUTES.map((m) => (
                        <Pressable
                          key={`sm-${m}`}
                          onPress={() => setStartMin(m)}
                          style={[
                            styles.timeChip,
                            {
                              backgroundColor: startMin === m ? colors.primary : colors.surface,
                              borderColor: startMin === m ? colors.primary : colors.border,
                            },
                          ]}
                        >
                          <Text style={[styles.timeChipText, { color: startMin === m ? "#fff" : colors.foreground }]}>
                            {m}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </View>
              {/* End time */}
              <View style={styles.timePickerGroup}>
                <Text style={[styles.timeLabel, { color: colors.muted }]}>終了</Text>
                <View style={styles.timeSelectors}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScrollH}>
                    <View style={styles.timeChipRow}>
                      {HOURS.map((h) => (
                        <Pressable
                          key={`eh-${h}`}
                          onPress={() => setEndHour(h)}
                          style={[
                            styles.timeChip,
                            {
                              backgroundColor: endHour === h ? colors.primary : colors.surface,
                              borderColor: endHour === h ? colors.primary : colors.border,
                            },
                          ]}
                        >
                          <Text style={[styles.timeChipText, { color: endHour === h ? "#fff" : colors.foreground }]}>
                            {h}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                  <Text style={[styles.timeSep, { color: colors.muted }]}>:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScrollH}>
                    <View style={styles.timeChipRow}>
                      {MINUTES.map((m) => (
                        <Pressable
                          key={`em-${m}`}
                          onPress={() => setEndMin(m)}
                          style={[
                            styles.timeChip,
                            {
                              backgroundColor: endMin === m ? colors.primary : colors.surface,
                              borderColor: endMin === m ? colors.primary : colors.border,
                            },
                          ]}
                        >
                          <Text style={[styles.timeChipText, { color: endMin === m ? "#fff" : colors.foreground }]}>
                            {m}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </View>
            </View>
            <View style={[styles.timePreview, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <MaterialIcons name="schedule" size={16} color={colors.primary} />
              <Text style={[styles.timePreviewText, { color: colors.foreground }]}>
                {startHour}:{startMin} 〜 {endHour}:{endMin}
              </Text>
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
                  <Text style={[styles.chipText, { color: category === cat.value ? "#fff" : colors.foreground }]}>
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
                    <Text style={[styles.chipText, { color: isSelected ? "#fff" : colors.foreground }]}>
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

          {/* Map */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>マップ</Text>
            {/* Map type selector */}
            <View style={styles.chipRow}>
              <Pressable
                onPress={() => setMapType("naver")}
                style={({ pressed }) => [
                  styles.chip,
                  {
                    backgroundColor: mapType === "naver" ? "#03C75A" : colors.surface,
                    borderColor: mapType === "naver" ? "#03C75A" : colors.border,
                  },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={[styles.chipText, { color: mapType === "naver" ? "#fff" : colors.foreground }]}>
                  Naver Map
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setMapType("google")}
                style={({ pressed }) => [
                  styles.chip,
                  {
                    backgroundColor: mapType === "google" ? "#4285F4" : colors.surface,
                    borderColor: mapType === "google" ? "#4285F4" : colors.border,
                  },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={[styles.chipText, { color: mapType === "google" ? "#fff" : colors.foreground }]}>
                  Google Map
                </Text>
              </Pressable>
            </View>
            <TextInput
              style={[styles.input, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]}
              value={mapQuery}
              onChangeText={setMapQuery}
              placeholder={mapType === "naver" ? "検索クエリ（例: 명동）" : "検索クエリ（例: Myeongdong）"}
              placeholderTextColor={colors.muted}
              returnKeyType="done"
            />
            <TextInput
              style={[styles.input, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]}
              value={mapUrl}
              onChangeText={setMapUrl}
              placeholder="マップURL（直接リンク）"
              placeholderTextColor={colors.muted}
              returnKeyType="done"
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>

          {/* Links */}
          <View style={styles.field}>
            <View style={styles.fieldHeader}>
              <Text style={[styles.label, { color: colors.foreground }]}>リンク</Text>
              <Pressable
                onPress={addLink}
                style={({ pressed }) => [
                  styles.addLinkButton,
                  { borderColor: colors.primary },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <MaterialIcons name="add" size={16} color={colors.primary} />
                <Text style={[styles.addLinkText, { color: colors.primary }]}>追加</Text>
              </Pressable>
            </View>
            {links.map((link) => (
              <View key={link.id} style={[styles.linkRow, { borderColor: colors.border }]}>
                <View style={styles.linkInputs}>
                  <TextInput
                    style={[styles.linkInput, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]}
                    value={link.label}
                    onChangeText={(v) => updateLink(link.id, "label", v)}
                    placeholder="ラベル"
                    placeholderTextColor={colors.muted}
                    returnKeyType="done"
                  />
                  <TextInput
                    style={[styles.linkInput, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]}
                    value={link.url}
                    onChangeText={(v) => updateLink(link.id, "url", v)}
                    placeholder="URL"
                    placeholderTextColor={colors.muted}
                    autoCapitalize="none"
                    keyboardType="url"
                    returnKeyType="done"
                  />
                </View>
                <Pressable
                  onPress={() => removeLink(link.id)}
                  style={({ pressed }) => [pressed && { opacity: 0.5 }]}
                >
                  <MaterialIcons name="close" size={20} color={colors.error} />
                </Pressable>
              </View>
            ))}
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
  headerTitle: { fontSize: 17, fontWeight: "700" },
  saveButton: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 18 },
  saveButtonText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  form: { padding: 16, gap: 20 },
  field: { gap: 8 },
  fieldHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { fontSize: 14, fontWeight: "700" },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15 },
  textArea: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, minHeight: 90 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    gap: 4,
  },
  chipIcon: { fontSize: 14 },
  chipText: { fontSize: 13, fontWeight: "600" },
  timePickerRow: { gap: 12 },
  timePickerGroup: { gap: 6 },
  timeLabel: { fontSize: 12, fontWeight: "600" },
  timeSelectors: { flexDirection: "row", alignItems: "center", gap: 4 },
  timeScrollH: { maxHeight: 36 },
  timeChipRow: { flexDirection: "row", gap: 4 },
  timeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 36,
    alignItems: "center",
  },
  timeChipText: { fontSize: 13, fontWeight: "600" },
  timeSep: { fontSize: 16, fontWeight: "700", marginHorizontal: 2 },
  timePreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  timePreviewText: { fontSize: 15, fontWeight: "700" },
  addLinkButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    gap: 2,
  },
  addLinkText: { fontSize: 12, fontWeight: "600" },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  linkInputs: { flex: 1, gap: 6 },
  linkInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14 },
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
