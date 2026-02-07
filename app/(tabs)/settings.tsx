import { useCallback } from "react";
import { View, Text, Pressable, FlatList, StyleSheet, Share, Platform, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAppStore } from "@/lib/store";
import { Trip } from "@/data/types";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

function formatShareText(trip: Trip): string {
  let text = `${trip.emoji} ${trip.name}\n`;
  text += `${trip.startDate} 〜 ${trip.endDate}\n\n`;

  // Members
  text += "【メンバー】\n";
  trip.members.forEach((m) => {
    text += `${m.emoji} ${m.name}\n`;
  });
  text += "\n";

  // Schedule by day
  trip.days.forEach((day) => {
    text += `★☆★${day.label}(${day.dayLabel})★☆★\n`;
    const dayEvents = trip.events
      .filter((e) => e.dayIndex === day.index)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    dayEvents.forEach((e) => {
      const memberEmojis = e.members
        .map((mid) => {
          if (mid === "everyone") return "🌈";
          const m = trip.members.find((mem) => mem.id === mid);
          return m?.emoji ?? "";
        })
        .join("");
      text += `[${e.startTime}-${e.endTime}]\n`;
      text += `${memberEmojis}${e.title}\n`;
      if (e.note) text += `  📝 ${e.note}\n`;
    });
    text += "\n";
  });

  // Packing list
  if (trip.packingItems && trip.packingItems.length > 0) {
    text += "【持ち物リスト】\n";
    trip.packingItems.forEach((item) => {
      text += `${item.checked ? "✅" : "⬜"} ${item.name}${item.quantity > 1 ? ` ×${item.quantity}` : ""}\n`;
    });
  }

  return text;
}

export default function SettingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { state, currentTrip, setCurrentTrip } = useAppStore();

  async function handleShare() {
    if (!currentTrip) return;
    const text = formatShareText(currentTrip);
    if (Platform.OS === "web") {
      try {
        await navigator.clipboard.writeText(text);
        Alert.alert("コピー完了", "スケジュールをクリップボードにコピーしました");
      } catch {
        Alert.alert("共有テキスト", text);
      }
    } else {
      try {
        await Share.share({ message: text, title: currentTrip.name });
      } catch {}
    }
  }

  const renderTrip = useCallback(
    ({ item }: { item: Trip }) => {
      const isCurrent = item.id === state.currentTripId;
      return (
        <Pressable
          onPress={() => setCurrentTrip(item.id)}
          style={({ pressed }) => [
            styles.tripCard,
            {
              backgroundColor: isCurrent ? colors.primary + "10" : colors.surface,
              borderColor: isCurrent ? colors.primary : colors.border,
            },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text style={styles.tripEmoji}>{item.emoji}</Text>
          <View style={styles.tripInfo}>
            <Text style={[styles.tripName, { color: colors.foreground }]}>{item.name}</Text>
            <Text style={[styles.tripDates, { color: colors.muted }]}>
              {item.startDate} 〜 {item.endDate} · {item.days.length}日間
            </Text>
            <Text style={[styles.tripStats, { color: colors.muted }]}>
              {item.events.length}件の予定 · {item.members.length}人
            </Text>
          </View>
          <View style={styles.tripActions}>
            {isCurrent && (
              <View style={[styles.currentBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.currentBadgeText}>選択中</Text>
              </View>
            )}
            <Pressable
              onPress={() => router.push(`/trip-form?tripId=${item.id}` as any)}
              style={({ pressed }) => [pressed && { opacity: 0.5 }]}
            >
              <MaterialIcons name="edit" size={18} color={colors.muted} />
            </Pressable>
          </View>
        </Pressable>
      );
    },
    [colors, state.currentTripId, router, setCurrentTrip]
  );

  return (
    <ScreenContainer>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>旅行管理</Text>
        <Pressable
          onPress={() => router.push("/trip-form" as any)}
          style={({ pressed }) => [
            styles.addButton,
            { backgroundColor: colors.primary },
            pressed && { opacity: 0.8 },
          ]}
        >
          <MaterialIcons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>新規</Text>
        </Pressable>
      </View>

      <FlatList
        data={state.trips}
        renderItem={renderTrip}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          currentTrip ? (
            <View style={styles.actionSection}>
              {/* Share */}
              <Pressable
                onPress={handleShare}
                style={({ pressed }) => [
                  styles.actionCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <MaterialIcons name="share" size={22} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.actionTitle, { color: colors.foreground }]}>スケジュールを共有</Text>
                  <Text style={[styles.actionDesc, { color: colors.muted }]}>テキスト形式で共有・コピー</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={colors.muted} />
              </Pressable>

              {/* Day management */}
              <Pressable
                onPress={() => router.push("/day-manage" as any)}
                style={({ pressed }) => [
                  styles.actionCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <MaterialIcons name="event" size={22} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.actionTitle, { color: colors.foreground }]}>日程を管理</Text>
                  <Text style={[styles.actionDesc, { color: colors.muted }]}>
                    {currentTrip.days.length}日間 · 日程の追加・削除
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={colors.muted} />
              </Pressable>

              <View style={styles.sectionDivider}>
                <Text style={[styles.sectionLabel, { color: colors.muted }]}>旅行一覧</Text>
              </View>
            </View>
          ) : null
        }
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
  headerTitle: { fontSize: 20, fontWeight: "800" },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    gap: 4,
  },
  addButtonText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  listContent: { padding: 16, gap: 10, paddingBottom: 100 },
  actionSection: { gap: 10, marginBottom: 6 },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 0.5,
    gap: 12,
  },
  actionTitle: { fontSize: 15, fontWeight: "700" },
  actionDesc: { fontSize: 12, marginTop: 1 },
  sectionDivider: { paddingTop: 16, paddingBottom: 4 },
  sectionLabel: { fontSize: 13, fontWeight: "700", letterSpacing: 0.5 },
  tripCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  tripEmoji: { fontSize: 30 },
  tripInfo: { flex: 1, gap: 2 },
  tripName: { fontSize: 16, fontWeight: "700" },
  tripDates: { fontSize: 12 },
  tripStats: { fontSize: 11 },
  tripActions: { alignItems: "flex-end", gap: 6 },
  currentBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  currentBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
});
