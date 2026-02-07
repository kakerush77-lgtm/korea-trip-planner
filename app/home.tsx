import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Share,
  Platform,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { ScreenHeader } from "@/components/screen-header";
import { useAppStore } from "@/lib/store";
import { useColors } from "@/hooks/use-colors";
import { Trip, LinkItem, ShoppingItem, PackingItem } from "@/data/types";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

type ExportType = "full" | "links" | "shopping" | "packing";

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

export default function HomeScreen() {
  const { state, currentTrip, setCurrentTrip, importTrip } = useAppStore();
  const trips = state.trips;
  const currentTripId = state.currentTripId;
  const colors = useColors();

  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [importText, setImportText] = useState("");

  const handleTripPress = (tripId: string) => {
    setCurrentTrip(tripId);
    router.replace("/(tabs)/schedule" as any);
  };

  const handleCreateTrip = () => {
    router.push("/trip-form");
  };

  const handleEditTrip = (tripId: string) => {
    router.push(`/trip-form?tripId=${tripId}` as any);
  };

  // ---- Share ----
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

  // ---- Export ----
  async function handleExportJSON(type: ExportType) {
    if (!currentTrip) return;
    let exportData: any;
    let typeLabel = "";

    switch (type) {
      case "full":
        exportData = { version: 1, type: "full", exportedAt: new Date().toISOString(), trip: currentTrip };
        typeLabel = "全体";
        break;
      case "links":
        exportData = { version: 1, type: "links", exportedAt: new Date().toISOString(), linkItems: currentTrip.linkItems ?? [] };
        typeLabel = "リンク";
        break;
      case "shopping":
        exportData = { version: 1, type: "shopping", exportedAt: new Date().toISOString(), shoppingItems: currentTrip.shoppingItems ?? [] };
        typeLabel = "買い物";
        break;
      case "packing":
        exportData = { version: 1, type: "packing", exportedAt: new Date().toISOString(), packingItems: currentTrip.packingItems ?? [] };
        typeLabel = "持ち物";
        break;
    }

    const json = JSON.stringify(exportData, null, 2);
    const fileName = `${currentTrip.name}_${currentTrip.startDate.replace(/\//g, "")}-${currentTrip.endDate.replace(/\//g, "")}_${typeLabel}.json`;

    if (Platform.OS === "web") {
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      Alert.alert("エクスポート完了", `${fileName}\nをダウンロードしました`);
    } else {
      const FileSystem = await import("expo-file-system/legacy");
      const Sharing = await import("expo-sharing");
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, json, { encoding: FileSystem.EncodingType.UTF8 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert("エクスポート完了", `${fileName}\nを保存しました`);
      }
    }
    setShowExportModal(false);
  }

  // ---- Import ----
  async function handlePickFile() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const file = result.assets[0];
      const response = await fetch(file.uri);
      const text = await response.text();
      setImportText(text);
    } catch {
      Alert.alert("エラー", "ファイルの読み込みに失敗しました");
    }
  }

  function handleImport() {
    if (!importText.trim()) {
      Alert.alert("エラー", "JSONデータを入力してください");
      return;
    }
    try {
      const data = JSON.parse(importText.trim());
      if (data.type === "full" && data.trip) {
        importTrip(data.trip);
        Alert.alert("インポート完了", "旅行データを取り込みました");
      } else if (data.type === "links" && data.linkItems) {
        Alert.alert("インポート完了", `${data.linkItems.length}件のリンクを取り込みました`);
      } else if (data.type === "shopping" && data.shoppingItems) {
        Alert.alert("インポート完了", `${data.shoppingItems.length}件の買いたいものを取り込みました`);
      } else if (data.type === "packing" && data.packingItems) {
        Alert.alert("インポート完了", `${data.packingItems.length}件の持ち物を取り込みました`);
      } else {
        Alert.alert("エラー", "不明なデータ形式です");
      }
      setImportText("");
      setShowImportModal(false);
    } catch {
      Alert.alert("エラー", "JSONの解析に失敗しました");
    }
  }

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="bg-background">
      <ScreenHeader
        title="旅行一覧"
        leftButton={{
          icon: "xmark.circle.fill",
          onPress: () => router.replace("/(tabs)/schedule" as any),
        }}
        rightButton={{
          icon: "plus",
          onPress: handleCreateTrip,
        }}
      />

      {/* Data Management Section - Fixed at top */}
      {currentTrip && (
        <View style={[styles.fixedSection, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={styles.fixedSectionHeader}>
            <Text style={[styles.fixedSectionTitle, { color: colors.foreground }]}>データ管理</Text>
            <Text style={[styles.fixedSectionDesc, { color: colors.muted }]} numberOfLines={1}>
              「{currentTrip.name}」
            </Text>
          </View>
          <View style={styles.actionRow}>
            <Pressable
              onPress={handleShare}
              style={({ pressed }) => [
                styles.actionChip,
                { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <MaterialIcons name="share" size={16} color="#fff" />
              <Text style={styles.actionChipText}>共有</Text>
            </Pressable>
            <Pressable
              onPress={() => setShowExportModal(true)}
              style={({ pressed }) => [
                styles.actionChip,
                { backgroundColor: colors.success, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <MaterialIcons name="file-download" size={16} color="#fff" />
              <Text style={styles.actionChipText}>エクスポート</Text>
            </Pressable>
            <Pressable
              onPress={() => setShowImportModal(true)}
              style={({ pressed }) => [
                styles.actionChip,
                { backgroundColor: colors.warning, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <MaterialIcons name="file-upload" size={16} color="#fff" />
              <Text style={styles.actionChipText}>インポート</Text>
            </Pressable>
          </View>
        </View>
      )}

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Trip List */}
        {trips.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 48 }}>✈️</Text>
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              旅行が登録されていません
            </Text>
            <Pressable
              onPress={handleCreateTrip}
              style={({ pressed }) => [
                styles.createButton,
                { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Text style={styles.createButtonText}>新しい旅行を作成</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.tripList}>
            {trips.map((trip: Trip) => {
              const isActive = trip.id === currentTripId;
              const dayCount = trip.days.length;
              const eventCount = trip.events.length;

              return (
                <View key={trip.id}>
                  <Pressable
                    onPress={() => handleTripPress(trip.id)}
                    style={({ pressed }) => [
                      styles.tripCard,
                      {
                        backgroundColor: isActive ? colors.primary + "12" : colors.surface,
                        borderColor: isActive ? colors.primary : colors.border,
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                  >
                    <View style={styles.tripCardContent}>
                      <Text style={styles.tripEmoji}>{trip.emoji}</Text>
                      <View style={styles.tripInfo}>
                        <View style={styles.tripNameRow}>
                          <Text style={[styles.tripName, { color: colors.foreground }]} numberOfLines={1}>
                            {trip.name}
                          </Text>
                          {isActive && (
                            <View style={[styles.activeBadge, { backgroundColor: colors.primary }]}>
                              <Text style={styles.activeBadgeText}>選択中</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.tripDate, { color: colors.muted }]}>
                          {trip.startDate} 〜 {trip.endDate}
                        </Text>
                        <View style={styles.tripStats}>
                          <View style={styles.statItem}>
                            <MaterialIcons name="event" size={14} color={colors.muted} />
                            <Text style={[styles.statText, { color: colors.muted }]}>{dayCount}日間</Text>
                          </View>
                          <View style={styles.statItem}>
                            <MaterialIcons name="format-list-bulleted" size={14} color={colors.muted} />
                            <Text style={[styles.statText, { color: colors.muted }]}>{eventCount}件</Text>
                          </View>
                          <View style={styles.statItem}>
                            <MaterialIcons name="group" size={14} color={colors.muted} />
                            <Text style={[styles.statText, { color: colors.muted }]}>{trip.members.length}人</Text>
                          </View>
                        </View>
                      </View>
                      {/* Edit button */}
                      <Pressable
                        onPress={() => handleEditTrip(trip.id)}
                        style={({ pressed }) => [
                          styles.editButton,
                          { backgroundColor: colors.background, borderColor: colors.border },
                          pressed && { opacity: 0.6 },
                        ]}
                      >
                        <MaterialIcons name="edit" size={16} color={colors.muted} />
                      </Pressable>
                    </View>
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Export Modal */}
      <Modal visible={showExportModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowExportModal(false)}>
          <Pressable style={[styles.modalContent, { backgroundColor: colors.background }]} onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>エクスポート</Text>
            <Text style={[styles.modalDesc, { color: colors.muted }]}>
              エクスポートする内容を選択してください
            </Text>
            {[
              { type: "full" as ExportType, icon: "folder", label: "旅行全体" },
              { type: "links" as ExportType, icon: "link", label: "リンク集のみ" },
              { type: "shopping" as ExportType, icon: "shopping-cart", label: "買いたいもののみ" },
              { type: "packing" as ExportType, icon: "luggage", label: "持ち物のみ" },
            ].map((opt) => (
              <Pressable
                key={opt.type}
                onPress={() => handleExportJSON(opt.type)}
                style={({ pressed }) => [
                  styles.exportOption,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <MaterialIcons name={opt.icon as any} size={24} color={colors.primary} />
                <Text style={[styles.exportOptionText, { color: colors.foreground }]}>{opt.label}</Text>
              </Pressable>
            ))}
            <Pressable
              onPress={() => setShowExportModal(false)}
              style={({ pressed }) => [
                styles.cancelBtn,
                { backgroundColor: colors.muted },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={styles.cancelBtnText}>キャンセル</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Import Modal */}
      <Modal visible={showImportModal} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <Pressable style={styles.modalOverlay} onPress={() => { setShowImportModal(false); setImportText(""); }}>
            <Pressable style={[styles.modalContent, { backgroundColor: colors.background }]} onPress={(e) => e.stopPropagation()}>
              <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>インポート</Text>
            <Text style={[styles.modalDesc, { color: colors.muted }]}>
              JSONファイルを選択するか、テキストを貼り付けてください
            </Text>

            {Platform.OS !== "web" && (
              <Pressable
                onPress={handlePickFile}
                style={({ pressed }) => [
                  styles.filePickerBtn,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <MaterialIcons name="attach-file" size={20} color={colors.primary} />
                <Text style={[styles.filePickerText, { color: colors.foreground }]}>ファイルを選択</Text>
              </Pressable>
            )}

            {Platform.OS === "web" && (
              <label htmlFor="file-input-home" style={{ marginBottom: 16, display: "block" }}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 12,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderStyle: "solid",
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                    cursor: "pointer",
                    gap: 8,
                  }}
                >
                  <MaterialIcons name="attach-file" size={20} color={colors.primary} />
                  <span style={{ color: colors.foreground, fontSize: 15, fontWeight: "600" }}>
                    ファイルを選択
                  </span>
                </div>
                <input
                  id="file-input-home"
                  type="file"
                  accept="application/json"
                  style={{ display: "none" }}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const text = await file.text();
                      setImportText(text);
                    }
                  }}
                />
              </label>
            )}

            <TextInput
              placeholder="またはJSONデータを貼り付け"
              placeholderTextColor={colors.muted}
              value={importText}
              onChangeText={setImportText}
              multiline
              blurOnSubmit={false}
              returnKeyType="done"
              style={[
                styles.importInput,
                { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface },
              ]}
            />
              </ScrollView>
              <View style={styles.modalActionsImproved}>
                <Pressable
                  onPress={() => { setShowImportModal(false); setImportText(""); }}
                  style={({ pressed }) => [
                    styles.modalBtnImproved,
                    { backgroundColor: colors.muted },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text style={styles.modalBtnTextImproved}>キャンセル</Text>
                </Pressable>
                <Pressable
                  onPress={handleImport}
                  style={({ pressed }) => [
                    styles.modalBtnImproved,
                    styles.importBtnPrimary,
                    { backgroundColor: colors.primary },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text style={styles.modalBtnTextImproved}>取り込む</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: { fontSize: 15, textAlign: "center" },
  createButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 8,
  },
  createButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  tripList: { gap: 12 },
  tripCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
  },
  tripCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  tripEmoji: { fontSize: 32 },
  tripInfo: { flex: 1, gap: 3 },
  tripNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tripName: { fontSize: 16, fontWeight: "700", flex: 1 },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activeBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  tripDate: { fontSize: 13 },
  tripStats: {
    flexDirection: "row",
    gap: 12,
    marginTop: 2,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  statText: { fontSize: 12 },
  editButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  fixedSection: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  fixedSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  fixedSectionTitle: { fontSize: 14, fontWeight: "700" },
  fixedSectionDesc: { fontSize: 12 },
  actionRow: {
    flexDirection: "row",
    gap: 6,
  },
  actionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    flex: 1,
    justifyContent: "center",
  },
  actionChipText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 8 },
  modalDesc: { fontSize: 14, marginBottom: 16 },
  exportOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    gap: 12,
  },
  exportOptionText: { fontSize: 15, fontWeight: "600" },
  cancelBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 4,
  },
  cancelBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  filePickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    gap: 8,
  },
  filePickerText: { fontSize: 15, fontWeight: "600" },
  importInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 120,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  modalActions: { flexDirection: "row", gap: 12 },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  modalActionsImproved: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  modalBtnImproved: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
  },
  modalBtnTextImproved: { color: "#fff", fontSize: 16, fontWeight: "700" },
  importBtnPrimary: {
    flex: 1.5,
  },
});
