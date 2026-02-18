import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import { Fonts } from "@/constants/theme";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function HomeScreen() {
  const colors = useColors();
  const { user, loading } = useAuth();
  const router = useRouter();

  const greeting = useCallback(() => {
    const hour = new Date().getHours();
    if (hour < 6) return "こんばんは";
    if (hour < 12) return "おはようございます";
    if (hour < 18) return "こんにちは";
    return "こんばんは";
  }, []);

  if (loading) {
    return (
      <ScreenContainer className="p-6">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View>
              <Text style={{ fontSize: 13, color: colors.muted, fontFamily: Fonts.sans }}>
                {greeting()}
              </Text>
              <Text style={{ fontSize: 22, fontWeight: "800", color: colors.foreground, fontFamily: Fonts.sans, marginTop: 2 }}>
                {user?.name || "ゲスト"} さん
              </Text>
            </View>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: "#fff" }}>
                {(user?.name || "G")[0]}
              </Text>
            </View>
          </View>
        </View>

        {/* Next Trip Card (Empty State) */}
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <View
            style={{
              borderRadius: 20,
              padding: 20,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={{ alignItems: "center", paddingVertical: 16 }}>
              <Text style={{ fontSize: 44, marginBottom: 12 }}>✈️</Text>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, fontFamily: Fonts.sans, marginBottom: 4 }}>
                次の旅行を計画しよう
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted, fontFamily: Fonts.sans, textAlign: "center", lineHeight: 18 }}>
                しおりタブから新しい旅行を作成して{"\n"}友達と共有しましょう
              </Text>
              <Pressable
                onPress={() => router.push("/trips" as any)}
                style={({ pressed }) => [
                  {
                    marginTop: 16,
                    backgroundColor: colors.primary,
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    borderRadius: 12,
                  },
                  pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
                ]}
              >
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#fff", fontFamily: Fonts.sans }}>
                  しおりを作成
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, fontFamily: Fonts.sans, marginBottom: 10 }}>
            クイックアクション
          </Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {[
              { icon: "airplane" as const, label: "しおり作成", color: "#E8A0BF", onPress: () => router.push("/trips" as any) },
              { icon: "magnifyingglass" as const, label: "スポット検索", color: "#957DAD", onPress: () => {} },
              { icon: "person.2.fill" as const, label: "友達招待", color: "#4CAF50", onPress: () => {} },
            ].map((action, i) => (
              <Pressable
                key={i}
                onPress={action.onPress}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    backgroundColor: colors.surface,
                    borderRadius: 16,
                    padding: 14,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: colors.border,
                  },
                  pressed && { transform: [{ scale: 0.97 }], opacity: 0.8 },
                ]}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: action.color + "15",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 8,
                  }}
                >
                  <IconSymbol name={action.icon} size={20} color={action.color} />
                </View>
                <Text style={{ fontSize: 11, fontWeight: "600", color: colors.foreground, fontFamily: Fonts.sans }}>
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Recommended Articles */}
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, fontFamily: Fonts.sans, marginBottom: 10 }}>
            おすすめ
          </Text>
          {[
            { emoji: "🗼", title: "東京の隠れた名所10選", tag: "国内旅行", color: "#FFE5EC" },
            { emoji: "🌸", title: "春の京都 桜スポット完全ガイド", tag: "季節特集", color: "#E8F5E9" },
            { emoji: "🍜", title: "台湾グルメ 夜市の歩き方", tag: "海外旅行", color: "#E3F2FD" },
          ].map((article, i) => (
            <Pressable
              key={i}
              style={({ pressed }) => [
                {
                  backgroundColor: article.color,
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 10,
                  position: "relative",
                  overflow: "hidden",
                },
                pressed && { opacity: 0.8 },
              ]}
            >
              <View style={{ position: "absolute", top: -10, right: -10, width: 46, height: 46, borderRadius: 23, backgroundColor: "rgba(255,255,255,0.3)" }} />
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 6 }}>
                <IconSymbol name="magnifyingglass" size={10} color={colors.muted} />
                <Text style={{ fontSize: 10, fontWeight: "600", color: colors.muted, fontFamily: Fonts.sans }}>{article.tag}</Text>
              </View>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, fontFamily: Fonts.sans }}>
                {article.emoji} {article.title}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
