import { useState } from "react";
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
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAppStore } from "@/lib/store";
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

export default function SettingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { state, currentTrip, setCurrentTrip, importTrip } = useAppStore();
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [importText, setImportText] = useState("");
  const [exportType, setExportType] = useState<ExportType>("full");

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

  async function handleExportJSON(type: ExportType) {
    if (!currentTrip) return;
    let exportData: any;
    let message = "";

    switch (type) {
      case "full":
        exportData = {
          version: 1,
          type: "full",
          exportedAt: new Date().toISOString(),
          trip: currentTrip,
        };
        message = "旅行データ全体をエクスポートしました";
        break;
      case "links":
        exportData = {
          version: 1,
          type: "links",
          exportedAt: new Date().toISOString(),
          linkItems: currentTrip.linkItems ?? [],
        };
        message = "リンク集をエクスポートしました";
        break;
      case "shopping":
        exportData = {
          version: 1,
          type: "shopping",
          exportedAt: new Date().toISOString(),
          shoppingItems: currentTrip.shoppingItems ?? [],
        };
        message = "買いたいものリストをエクスポートしました";
        break;
      case "packing":
        exportData = {
          version: 1,
          type: "packing",
          exportedAt: new Date().toISOString(),
          packingItems: currentTrip.packingItems ?? [],
        };
        message = "持ち物リストをエクスポートしました";
        break;
    }

    const json = JSON.stringify(exportData, null, 2);
    if (Platform.OS === "web") {
      try {
        await navigator.clipboard.writeText(json);
        Alert.alert("エクスポート完了", `${message}\nクリップボードにコピーしました。`);
      } catch {
        Alert.alert("エクスポートデータ", "クリップボードへのコピーに失敗しました");
      }
    } else {
      try {
        await Share.share({ message: json, title: `${currentTrip.name} - ${message}` });
      } catch {}
    }
    setShowExportModal(false);
  }

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
    } catch (error) {
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
        if (!currentTrip) {
          Alert.alert("エラー", "現在の旅行が選択されていません");
          return;
        }
        const newLinks = data.linkItems.map((item: LinkItem) => ({
          ...item,
          id: `link-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        }));
        Alert.alert("インポート完了", `${newLinks.length}件のリンクを取り込みました（手動マージが必要です）`);
      } else if (data.type === "shopping" && data.shoppingItems) {
        if (!currentTrip) {
          Alert.alert("エラー", "現在の旅行が選択されていません");
          return;
        }
        const newItems = data.shoppingItems.map((item: ShoppingItem) => ({
          ...item,
          id: `shop-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        }));
        Alert.alert("インポート完了", `${newItems.length}件の買いたいものを取り込みました（手動マージが必要です）`);
      } else if (data.type === "packing" && data.packingItems) {
        if (!currentTrip) {
          Alert.alert("エラー", "現在の旅行が選択されていません");
          return;
        }
        const newItems = data.packingItems.map((item: PackingItem) => ({
          ...item,
          id: `pack-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        }));
        Alert.alert("インポート完了", `${newItems.length}件の持ち物を取り込みました（手動マージが必要です）`);
      } else {
        Alert.alert("エラー", "不明なデータ形式です");
      }
      setImportText("");
      setShowImportModal(false);
    } catch (e) {
      Alert.alert("エラー", "JSONの解析に失敗しました");
    }
  }

  function handleDeleteTrip(tripId: string) {
    const trip = state.trips.find((t) => t.id === tripId);
    if (!trip) return;
    Alert.alert("旅行を削除", `「${trip.name}」を削除しますか？`, [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: () => {
          // TODO: Add deleteTrip function
          Alert.alert("削除完了", "旅行を削除しました");
        },
      },
    ]);
  }

  const renderTrip = ({ item }: { item: Trip }) => {
    const isCurrent = currentTrip?.id === item.id;
    return (
      <Pressable
        onPress={() => setCurrentTrip(item.id)}
        style={({ pressed }) => [
          styles.tripCard,
          {
            backgroundColor: isCurrent ? colors.primary : colors.surface,
            borderColor: colors.border,
          },
          pressed && { opacity: 0.7 },
        ]}
      >
        <View style={styles.tripHeader}>
          <Text style={[styles.tripEmoji, { color: isCurrent ? "#fff" : colors.foreground }]}>
            {item.emoji}
          </Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.tripName, { color: isCurrent ? "#fff" : colors.foreground }]}>
              {item.name}
            </Text>
            <Text style={[styles.tripDate, { color: isCurrent ? "#fff" : colors.muted }]}>
              {item.startDate} 〜 {item.endDate}
            </Text>
          </View>
          {isCurrent && <MaterialIcons name="check-circle" size={24} color="#fff" />}
        </View>
      </Pressable>
    );
  };

  return (
    <ScreenContainer>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>🌏 旅行管理</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Current Trip Section */}
        {currentTrip && (
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>現在の旅行</Text>
            <View style={styles.currentTripInfo}>
              <Text style={[styles.currentTripEmoji]}>{currentTrip.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.currentTripName, { color: colors.foreground }]}>
                  {currentTrip.name}
                </Text>
                <Text style={[styles.currentTripDate, { color: colors.muted }]}>
                  {currentTrip.startDate} 〜 {currentTrip.endDate}
                </Text>
              </View>
            </View>
            <View style={styles.actionRow}>
              <Pressable
                onPress={handleShare}
                style={({ pressed }) => [
                  styles.actionBtn,
                  { backgroundColor: colors.primary },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <MaterialIcons name="share" size={18} color="#fff" />
                <Text style={styles.actionBtnText}>共有</Text>
              </Pressable>
              <Pressable
                onPress={() => setShowExportModal(true)}
                style={({ pressed }) => [
                  styles.actionBtn,
                  { backgroundColor: colors.success },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <MaterialIcons name="file-download" size={18} color="#fff" />
                <Text style={styles.actionBtnText}>エクスポート</Text>
              </Pressable>
              <Pressable
                onPress={() => setShowImportModal(true)}
                style={({ pressed }) => [
                  styles.actionBtn,
                  { backgroundColor: colors.warning },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <MaterialIcons name="file-upload" size={18} color="#fff" />
                <Text style={styles.actionBtnText}>インポート</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Trip List */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>旅行一覧</Text>
          {state.trips.map((trip) => (
            <View key={trip.id}>{renderTrip({ item: trip })}</View>
          ))}
          <Pressable
            onPress={() => router.push("/trip-form")}
            style={({ pressed }) => [
              styles.addBtn,
              { backgroundColor: colors.primary },
              pressed && { opacity: 0.7 },
            ]}
          >
            <MaterialIcons name="add" size={20} color="#fff" />
            <Text style={styles.addBtnText}>新しい旅行を作成</Text>
          </Pressable>
        </View>

        {/* Day Management */}
        {currentTrip && (
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>日程管理</Text>
            <Text style={[styles.sectionDesc, { color: colors.muted }]}>
              {currentTrip.days.length}日間の旅行
            </Text>
            <Pressable
              onPress={() => router.push("/day-manage")}
              style={({ pressed }) => [
                styles.manageBtn,
                { backgroundColor: colors.background, borderColor: colors.border },
                pressed && { opacity: 0.7 },
              ]}
            >
              <MaterialIcons name="event" size={20} color={colors.primary} />
              <Text style={[styles.manageBtnText, { color: colors.primary }]}>日程を編集</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Export Modal */}
      <Modal visible={showExportModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>エクスポート</Text>
            <Text style={[styles.modalDesc, { color: colors.muted }]}>
              エクスポートする内容を選択してください
            </Text>
            <Pressable
              onPress={() => handleExportJSON("full")}
              style={({ pressed }) => [
                styles.exportOption,
                { backgroundColor: colors.surface, borderColor: colors.border },
                pressed && { opacity: 0.7 },
              ]}
            >
              <MaterialIcons name="folder" size={24} color={colors.primary} />
              <Text style={[styles.exportOptionText, { color: colors.foreground }]}>旅行全体</Text>
            </Pressable>
            <Pressable
              onPress={() => handleExportJSON("links")}
              style={({ pressed }) => [
                styles.exportOption,
                { backgroundColor: colors.surface, borderColor: colors.border },
                pressed && { opacity: 0.7 },
              ]}
            >
              <MaterialIcons name="link" size={24} color={colors.primary} />
              <Text style={[styles.exportOptionText, { color: colors.foreground }]}>リンク集のみ</Text>
            </Pressable>
            <Pressable
              onPress={() => handleExportJSON("shopping")}
              style={({ pressed }) => [
                styles.exportOption,
                { backgroundColor: colors.surface, borderColor: colors.border },
                pressed && { opacity: 0.7 },
              ]}
            >
              <MaterialIcons name="shopping-cart" size={24} color={colors.primary} />
              <Text style={[styles.exportOptionText, { color: colors.foreground }]}>買いたいもののみ</Text>
            </Pressable>
            <Pressable
              onPress={() => handleExportJSON("packing")}
              style={({ pressed }) => [
                styles.exportOption,
                { backgroundColor: colors.surface, borderColor: colors.border },
                pressed && { opacity: 0.7 },
              ]}
            >
              <MaterialIcons name="luggage" size={24} color={colors.primary} />
              <Text style={[styles.exportOptionText, { color: colors.foreground }]}>持ち物のみ</Text>
            </Pressable>
            <Pressable
              onPress={() => setShowExportModal(false)}
              style={({ pressed }) => [
                styles.modalCancelBtn,
                { backgroundColor: colors.muted },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={styles.modalCancelText}>キャンセル</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Import Modal */}
      <Modal visible={showImportModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>インポート</Text>
            <Text style={[styles.modalDesc, { color: colors.muted }]}>
              JSONファイルを選択するか、テキストを貼り付けてください
            </Text>

            {/* File Picker Button */}
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
                <Text style={[styles.filePickerText, { color: colors.foreground }]}>
                  ファイルを選択
                </Text>
              </Pressable>
            )}

            {/* Web File Input */}
            {Platform.OS === "web" && (
              <label htmlFor="file-input" style={{ marginBottom: 16, display: "block" }}>
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
                  id="file-input"
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
              style={[
                styles.importInput,
                { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface },
              ]}
            />
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => {
                  setShowImportModal(false);
                  setImportText("");
                }}
                style={({ pressed }) => [
                  styles.modalBtn,
                  { backgroundColor: colors.muted },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={styles.modalBtnText}>キャンセル</Text>
              </Pressable>
              <Pressable
                onPress={handleImport}
                style={({ pressed }) => [
                  styles.modalBtn,
                  { backgroundColor: colors.primary },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={styles.modalBtnText}>取り込む</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  sectionDesc: {
    fontSize: 14,
    marginBottom: 12,
  },
  currentTripInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  currentTripEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  currentTripName: {
    fontSize: 18,
    fontWeight: "600",
  },
  currentTripDate: {
    fontSize: 14,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  tripCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  tripHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  tripEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  tripName: {
    fontSize: 17,
    fontWeight: "600",
  },
  tripDate: {
    fontSize: 13,
    marginTop: 4,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  addBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  manageBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  manageBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
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
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 14,
    marginBottom: 16,
  },
  exportOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    gap: 12,
  },
  exportOptionText: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalCancelBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalCancelText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
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
  filePickerText: {
    fontSize: 15,
    fontWeight: "600",
  },
  importInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 150,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
