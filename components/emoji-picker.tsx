import { View, Text, Pressable, ScrollView, StyleSheet, Modal } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { useState } from "react";

const EMOJI_CATEGORIES = [
  {
    label: "顔",
    emojis: ["😀", "😊", "😎", "🥰", "😇", "🤩", "😺", "🐶", "🐱", "🐻", "🐼", "🐨", "🦊", "🐯", "🦁", "🐸"],
  },
  {
    label: "ハート",
    emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🩷", "🩵", "💗", "💖", "💝", "🖤", "🤍", "💕", "💞", "💓"],
  },
  {
    label: "人",
    emojis: ["👦🏻", "👧🏻", "👨🏻", "👩🏻", "👶🏻", "🧒🏻", "👱🏻", "👴🏻", "👵🏻", "🧑🏻", "👦", "👧", "👨", "👩", "🧑", "👤"],
  },
  {
    label: "旅行",
    emojis: ["✈️", "🚇", "🚌", "🚕", "🗺️", "🧳", "🏨", "🌏", "🗼", "⛩️", "🏯", "🎌", "🇰🇷", "🇯🇵", "🌈", "⭐"],
  },
  {
    label: "食べ物",
    emojis: ["🍽️", "🍜", "🍣", "🍱", "🥟", "🍗", "🥩", "🍕", "🍔", "☕", "🍵", "🧋", "🍺", "🍷", "🎂", "🍰"],
  },
  {
    label: "アクティビティ",
    emojis: ["🛍️", "💆", "💅", "💇", "📸", "🎮", "🎪", "🎡", "🎢", "🎯", "🎨", "🎭", "🎬", "🎤", "🏃", "🧘"],
  },
  {
    label: "記号",
    emojis: ["📌", "📍", "🔔", "💡", "🔑", "📝", "📋", "📎", "✅", "❌", "⚠️", "ℹ️", "🔴", "🟢", "🔵", "🟡"],
  },
];

interface EmojiPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
  currentEmoji?: string;
}

export function EmojiPicker({ visible, onClose, onSelect, currentEmoji }: EmojiPickerProps) {
  const colors = useColors();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View />
      </Pressable>
      <View style={[styles.sheet, { backgroundColor: colors.background }]}>
        <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sheetTitle, { color: colors.foreground }]}>アイコンを選択</Text>
          <Pressable onPress={onClose} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
            <Text style={[styles.closeButton, { color: colors.primary }]}>完了</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {EMOJI_CATEGORIES.map((cat) => (
            <View key={cat.label} style={styles.category}>
              <Text style={[styles.categoryLabel, { color: colors.muted }]}>{cat.label}</Text>
              <View style={styles.emojiGrid}>
                {cat.emojis.map((emoji) => (
                  <Pressable
                    key={emoji}
                    onPress={() => {
                      onSelect(emoji);
                      onClose();
                    }}
                    style={({ pressed }) => [
                      styles.emojiButton,
                      {
                        backgroundColor:
                          currentEmoji === emoji ? colors.primary + "20" : "transparent",
                        borderColor: currentEmoji === emoji ? colors.primary : "transparent",
                      },
                      pressed && { opacity: 0.6 },
                    ]}
                  >
                    <Text style={styles.emoji}>{emoji}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: "60%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  closeButton: {
    fontSize: 16,
    fontWeight: "600",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  category: {
    marginTop: 14,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  emojiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  emojiButton: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  emoji: {
    fontSize: 22,
  },
});
