import { useCallback, useState } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  Share,
  Platform,
  Alert,
  TextInput,
  Modal,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAppStore } from "@/lib/store";
import { Trip } from "@/data/types";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

function formatShareText(trip: Trip): string {
  let text = `${trip.emoji} ${trip.name}\n`;
  text += `${trip.startDate} 〜 ${trip.endDate}\n\n`;

  text += "【メンバー】\n";
  trip.members.forEach((m) => {
    text += `${m.emoji} ${m.name}\n`;
  });
  text += "\n";

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
  const { state, currentTrip, setCurrentTrip, importTrip } = useAppStore();
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState("");

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

  async function handleExportJSON() {
    if (!currentTrip) return;
    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      trip: currentTrip,
    };
    const json = JSON.stringify(exportData, null, 2);
    if (Platform.OS === "web") {
      try {
        await navigator.clipboard.writeText(json);
        Alert.alert("エクスポート完了", "旅行データ(JSON)をクリップボードにコピーしました。\n他の人にこのテキストを送って取り込んでもらえます。");
      } catch {
        Alert.alert("エクスポートデータ", "クリップボードへのコピーに失敗しました");
      }
    } else {
      try {
        await Share.share({ message: json, title: `${currentTrip.name} データ` });
      } catch {}
    }
  }

  function handleImport() {
    if (!importText.trim()) {
      Alert.alert("エラー", "JSONデータを貼り付けてください");
      return;
    }
    try {
      const parsed = JSON.parse(importText.trim());
      const tripData = parsed.trip ?? parsed;

      if (!tripData.name || !tripData.startDate || !tripData.endDate) {
        Alert.alert("エラー", "有効な旅行データではありません");
        return;
      }

      Alert.alert(
        "旅行を取り込み",
        `「${tripData.emoji ?? "✈️"} ${tripData.name}」を取り込みますか？`,
        [
          { text: "キャンセル", style: "cancel" },
          {
            text: "取り込む",
            onPress: () => {
              importTrip(tripData);
              setImportText("");
              setShowImportModal(false);
              Alert.alert("完了", "旅行データを取り込みました");
            },
          },
        ]
      );
    } catch {
      Alert.alert("エラー", "JSONの形式が正しくありません。\nエクスポートされたデータをそのまま貼り付けてください。");
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
              {/* Share text */}
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

              {/* Export JSON */}
              <Pressable
                onPress={handleExportJSON}
                style={({ pressed }) => [
                  styles.actionCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <MaterialIcons name="file-upload" size={22} color="#03C75A" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.actionTitle, { color: colors.foreground }]}>旅行データを書き出し</Text>
                  <Text style={[styles.actionDesc, { color: colors.muted }]}>JSON形式で書き出し・他の人に送れます</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={colors.muted} />
              </Pressable>

              {/* Import JSON */}
              <Pressable
                onPress={() => setShowImportModal(true)}
                style={({ pressed }) => [
                  styles.actionCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <MaterialIcons name="file-download" size={22} color="#4285F4" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.actionTitle, { color: colors.foreground }]}>旅行データを取り込み</Text>
                  <Text style={[styles.actionDesc, { color: colors.muted }]}>他の人の旅行データを取り込む</Text>
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

      {/* Import Modal */}
      <Modal visible={showImportModal} transparent animationType="slide" onRequestClose={() => setShowImportModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowImportModal(false)}>
          <Pressable style={[styles.modalContainer, { backgroundColor: colors.background }]} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Pressable onPress={() => setShowImportModal(false)} style={({ pressed }) => [pressed && { opacity: 0.5 }]}>
                <MaterialIcons name="close" size={24} color={colors.foreground} />
              </Pressable>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>旅行データを取り込み</Text>
              <Pressable
                onPress={handleImport}
                style={({ pressed }) => [
                  styles.importButton,
                  { backgroundColor: colors.primary },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={styles.importButtonText}>取り込む</Text>
              </Pressable>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={[styles.importHint, { color: colors.muted }]}>
                他の人から受け取った旅行データ(JSON)を下に貼り付けてください。
              </Text>
              <TextInput
                style={[
                  styles.importInput,
                  {
                    color: colors.foreground,
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                value={importText}
                onChangeText={setImportText}
                placeholder='{"trip": {...}} の形式のJSONを貼り付け'
                placeholderTextColor={colors.muted}
                multiline
                numberOfLines={12}
                textAlignVertical="top"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  modalTitle: { fontSize: 16, fontWeight: "700" },
  importButton: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 18 },
  importButtonText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  modalBody: { padding: 16 },
  importHint: { fontSize: 13, marginBottom: 12, lineHeight: 20 },
  importInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    minHeight: 200,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
});
