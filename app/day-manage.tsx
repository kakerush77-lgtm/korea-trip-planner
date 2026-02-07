import { useState } from "react";
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
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAppStore } from "@/lib/store";
import { DayInfo } from "@/data/types";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function DayManageScreen() {
  const colors = useColors();
  const router = useRouter();
  const { currentTrip, addDay, deleteDay } = useAppStore();
  const [newDate, setNewDate] = useState("");

  const days = currentTrip?.days ?? [];
  const events = currentTrip?.events ?? [];

  function formatDateInput(text: string) {
    const cleaned = text.replace(/[^0-9-]/g, "");
    if (cleaned.length === 4 && !cleaned.includes("-")) {
      setNewDate(cleaned + "-");
    } else if (cleaned.length === 7 && cleaned.charAt(4) === "-" && cleaned.charAt(6) !== "-") {
      setNewDate(cleaned.slice(0, 7) + "-" + cleaned.slice(7));
    } else {
      setNewDate(cleaned.slice(0, 10));
    }
  }

  function handleAddDay() {
    if (!newDate || newDate.length !== 10) {
      Alert.alert("エラー", "日付をYYYY-MM-DD形式で入力してください");
      return;
    }
    // Check if date already exists
    if (days.some((d) => d.date === newDate)) {
      Alert.alert("エラー", "この日付はすでに登録されています");
      return;
    }
    addDay(newDate);
    setNewDate("");
  }

  function handleDeleteDay(day: DayInfo) {
    const dayEventCount = events.filter((e) => e.dayIndex === day.index).length;
    const message =
      dayEventCount > 0
        ? `「${day.dayLabel} (${day.label})」を削除しますか？\nこの日の${dayEventCount}件の予定も削除されます。`
        : `「${day.dayLabel} (${day.label})」を削除しますか？`;

    Alert.alert("日程を削除", message, [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: () => deleteDay(day.index),
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
            <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>日程管理</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Add day form */}
        <View style={[styles.addSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.addTitle, { color: colors.foreground }]}>日程を追加</Text>
          <View style={styles.addRow}>
            <TextInput
              style={[styles.dateInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
              value={newDate}
              onChangeText={formatDateInput}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.muted}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
              returnKeyType="done"
              onSubmitEditing={handleAddDay}
            />
            <Pressable
              onPress={handleAddDay}
              style={({ pressed }) => [
                styles.addDayButton,
                { backgroundColor: colors.primary },
                pressed && { opacity: 0.8 },
              ]}
            >
              <MaterialIcons name="add" size={20} color="#fff" />
              <Text style={styles.addDayButtonText}>追加</Text>
            </Pressable>
          </View>
        </View>

        {/* Days list */}
        <FlatList
          data={days}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const eventCount = events.filter((e) => e.dayIndex === item.index).length;
            return (
              <View
                style={[
                  styles.dayCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <View style={[styles.dayNumber, { backgroundColor: colors.primary + "15" }]}>
                  <Text style={[styles.dayNumberText, { color: colors.primary }]}>{item.index + 1}</Text>
                </View>
                <View style={styles.dayInfo}>
                  <Text style={[styles.dayLabel, { color: colors.foreground }]}>{item.dayLabel}</Text>
                  <Text style={[styles.dayDate, { color: colors.muted }]}>{item.label} · {item.date}</Text>
                  <Text style={[styles.dayEvents, { color: colors.muted }]}>{eventCount}件の予定</Text>
                </View>
                <Pressable
                  onPress={() => handleDeleteDay(item)}
                  style={({ pressed }) => [
                    styles.deleteDayButton,
                    { borderColor: colors.error + "40" },
                    pressed && { opacity: 0.5 },
                  ]}
                >
                  <MaterialIcons name="delete-outline" size={18} color={colors.error} />
                </Pressable>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={{ fontSize: 40 }}>📅</Text>
              <Text style={[styles.emptyText, { color: colors.muted }]}>日程がありません</Text>
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
  headerTitle: { fontSize: 17, fontWeight: "700" },
  addSection: {
    margin: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: 0.5,
    gap: 10,
  },
  addTitle: { fontSize: 14, fontWeight: "700" },
  addRow: { flexDirection: "row", gap: 8 },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  addDayButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 4,
  },
  addDayButtonText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  listContent: { padding: 16, gap: 8, paddingBottom: 100 },
  dayCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 0.5,
    gap: 12,
  },
  dayNumber: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  dayNumberText: { fontSize: 18, fontWeight: "800" },
  dayInfo: { flex: 1, gap: 2 },
  dayLabel: { fontSize: 15, fontWeight: "700" },
  dayDate: { fontSize: 12 },
  dayEvents: { fontSize: 11 },
  deleteDayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 14, fontWeight: "500" },
});
