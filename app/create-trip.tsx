import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { Fonts } from "@/constants/theme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trpc } from "@/lib/trpc";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

const COVERS = ["✈️", "🏖️", "🗼", "🏔️", "🌸", "🎌", "🇰🇷", "🇹🇭", "🇺🇸", "🇫🇷", "🇮🇹", "🇬🇧"];
const COLORS = [
  "#FFE5EC", "#E8F5E9", "#E3F2FD", "#FFF3E0",
  "#F3E5F5", "#E0F7FA", "#FFF9C4", "#FCE4EC",
];

export default function CreateTripScreen() {
  const colors = useColors();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [days, setDays] = useState("1");
  const [cover, setCover] = useState("✈️");
  const [color, setColor] = useState("#FFE5EC");

  const createMutation = trpc.trips.create.useMutation({
    onSuccess: () => {
      router.back();
    },
    onError: (error) => {
      console.error("[CreateTrip] Error:", error);
    },
  });

  const handleCreate = useCallback(() => {
    if (!title.trim()) return;
    createMutation.mutate({
      title: title.trim(),
      date: date || undefined,
      days: parseInt(days) || 1,
      cover,
      color,
    });
  }, [title, date, days, cover, color, createMutation]);

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 0.5,
            borderBottomColor: colors.border,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              { padding: 4 },
              pressed && { opacity: 0.6 },
            ]}
          >
            <IconSymbol name="xmark" size={22} color={colors.foreground} />
          </Pressable>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, fontFamily: Fonts.sans }}>
            新しいしおり
          </Text>
          <Pressable
            onPress={handleCreate}
            disabled={!title.trim() || createMutation.isPending}
            style={({ pressed }) => [
              {
                backgroundColor: title.trim() ? colors.primary : colors.border,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 10,
              },
              pressed && { opacity: 0.8 },
            ]}
          >
            {createMutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#fff", fontFamily: Fonts.sans }}>
                作成
              </Text>
            )}
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Preview Card */}
          <View
            style={{
              backgroundColor: color,
              borderRadius: 20,
              padding: 20,
              marginBottom: 24,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 48, marginBottom: 8 }}>{cover}</Text>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: colors.foreground,
                fontFamily: Fonts.sans,
                textAlign: "center",
              }}
            >
              {title || "旅行タイトル"}
            </Text>
            {date ? (
              <Text style={{ fontSize: 12, color: colors.muted, fontFamily: Fonts.sans, marginTop: 4 }}>
                {date}
              </Text>
            ) : null}
          </View>

          {/* Title Input */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: colors.muted, fontFamily: Fonts.sans, marginBottom: 8 }}>
              タイトル
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="例：沖縄旅行 2026"
              placeholderTextColor={colors.muted}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 15,
                color: colors.foreground,
                fontFamily: Fonts.sans,
                borderWidth: 1,
                borderColor: colors.border,
              }}
              returnKeyType="done"
            />
          </View>

          {/* Date Input */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: colors.muted, fontFamily: Fonts.sans, marginBottom: 8 }}>
              日程
            </Text>
            <TextInput
              value={date}
              onChangeText={setDate}
              placeholder="例：2026/03/20 - 2026/03/23"
              placeholderTextColor={colors.muted}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 15,
                color: colors.foreground,
                fontFamily: Fonts.sans,
                borderWidth: 1,
                borderColor: colors.border,
              }}
              returnKeyType="done"
            />
          </View>

          {/* Days */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: colors.muted, fontFamily: Fonts.sans, marginBottom: 8 }}>
              日数
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {[1, 2, 3, 4, 5].map((d) => (
                <Pressable
                  key={d}
                  onPress={() => setDays(d.toString())}
                  style={({ pressed }) => [
                    {
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: days === d.toString() ? colors.primary : colors.surface,
                      borderWidth: 1,
                      borderColor: days === d.toString() ? colors.primary : colors.border,
                    },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "700",
                      color: days === d.toString() ? "#fff" : colors.foreground,
                      fontFamily: Fonts.mono,
                    }}
                  >
                    {d}
                  </Text>
                </Pressable>
              ))}
              <TextInput
                value={parseInt(days) > 5 ? days : ""}
                onChangeText={(v) => {
                  const num = parseInt(v);
                  if (!isNaN(num) && num > 0 && num <= 30) setDays(v);
                }}
                placeholder="6+"
                placeholderTextColor={colors.muted}
                keyboardType="number-pad"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  textAlign: "center",
                  fontSize: 14,
                  fontWeight: "700",
                  color: colors.foreground,
                  fontFamily: Fonts.mono,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />
            </View>
          </View>

          {/* Cover Emoji */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: colors.muted, fontFamily: Fonts.sans, marginBottom: 8 }}>
              カバー
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {COVERS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setCover(c)}
                  style={({ pressed }) => [
                    {
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: cover === c ? colors.primary + "20" : colors.surface,
                      borderWidth: 2,
                      borderColor: cover === c ? colors.primary : "transparent",
                    },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Text style={{ fontSize: 22 }}>{c}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Color */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: colors.muted, fontFamily: Fonts.sans, marginBottom: 8 }}>
              テーマカラー
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {COLORS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setColor(c)}
                  style={({ pressed }) => [
                    {
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      backgroundColor: c,
                      borderWidth: 2.5,
                      borderColor: color === c ? colors.primary : "transparent",
                      alignItems: "center",
                      justifyContent: "center",
                    },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  {color === c && <IconSymbol name="checkmark" size={16} color={colors.primary} />}
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
