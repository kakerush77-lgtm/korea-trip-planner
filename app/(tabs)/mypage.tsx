import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import { Fonts } from "@/constants/theme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

export default function MyPageScreen() {
  const colors = useColors();
  const { user, loading, logout } = useAuth();

  const handleLogout = useCallback(() => {
    if (Platform.OS === "web") {
      logout();
      return;
    }
    Alert.alert("ログアウト", "ログアウトしますか？", [
      { text: "キャンセル", style: "cancel" },
      { text: "ログアウト", style: "destructive", onPress: logout },
    ]);
  }, [logout]);

  if (loading) {
    return (
      <ScreenContainer className="p-6">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  const settingItems = [
    { icon: "bell.fill" as const, label: "通知設定" },
    { icon: "gearshape.fill" as const, label: "アプリ設定" },
    { icon: "heart.fill" as const, label: "お気に入り" },
    { icon: "star.fill" as const, label: "アプリを評価" },
  ];

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
          <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground, fontFamily: Fonts.sans }}>
            マイページ
          </Text>
        </View>

        {/* Profile Hero */}
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <View
            style={{
              borderRadius: 22,
              padding: 20,
              backgroundColor: colors.foreground,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <View style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.04)" }} />
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: colors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "#E8A0BF",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.35,
                  shadowRadius: 8,
                }}
              >
                <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>
                  {(user?.name || "G")[0]}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: "800", color: colors.background, fontFamily: Fonts.sans }}>
                  {user?.name || "ゲスト"}
                </Text>
                <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: Fonts.sans, marginTop: 2 }}>
                  {user?.email || ""}
                </Text>
              </View>
            </View>

            {/* Points */}
            <View style={{ marginTop: 16, flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: Fonts.sans }}>
                保有ポイント
              </Text>
              <Text style={{ fontSize: 20, fontWeight: "800", color: "#FFD700", fontFamily: Fonts.mono }}>
                0
              </Text>
              <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: Fonts.sans }}>
                pt
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 16 }}>
          {[
            { value: "0", label: "しおり", icon: "airplane" as const, bgColor: "#EDE7F6", iconColor: "#7B1FA2" },
            { value: "0", label: "スポット", icon: "location.fill" as const, bgColor: "#E3F2FD", iconColor: "#1976D2" },
            { value: "0", label: "国・地域", icon: "map.fill" as const, bgColor: "#E8F5E9", iconColor: "#388E3C" },
          ].map((stat, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderRadius: 14,
                padding: 12,
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  backgroundColor: stat.bgColor,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 6,
                }}
              >
                <IconSymbol name={stat.icon} size={14} color={stat.iconColor} />
              </View>
              <Text style={{ fontSize: 18, fontWeight: "800", color: colors.foreground, fontFamily: Fonts.mono }}>
                {stat.value}
              </Text>
              <Text style={{ fontSize: 9, color: colors.muted, fontFamily: Fonts.sans }}>
                {stat.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Badges */}
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, fontFamily: Fonts.sans, marginBottom: 10 }}>
            実績バッジ
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {[
              { emoji: "🌏", name: "旅の始まり", done: false },
              { emoji: "📸", name: "フォトグラファー", done: false },
              { emoji: "🎯", name: "プランナー", done: false },
            ].map((badge, i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  backgroundColor: colors.surface,
                  borderRadius: 14,
                  padding: 12,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.border,
                  opacity: badge.done ? 1 : 0.5,
                }}
              >
                <Text style={{ fontSize: 24, marginBottom: 4, ...(badge.done ? {} : { opacity: 0.4 }) }}>
                  {badge.emoji}
                </Text>
                <Text style={{ fontSize: 9, fontWeight: "700", color: badge.done ? colors.foreground : colors.muted, fontFamily: Fonts.sans, textAlign: "center" }}>
                  {badge.name}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Settings */}
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, fontFamily: Fonts.sans, marginBottom: 10 }}>
            設定
          </Text>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            {settingItems.map((item, i) => (
              <Pressable
                key={i}
                style={({ pressed }) => [
                  {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: 14,
                    paddingVertical: 14,
                    borderBottomWidth: i < settingItems.length - 1 ? 0.5 : 0,
                    borderBottomColor: colors.border,
                  },
                  pressed && { backgroundColor: colors.background },
                ]}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      backgroundColor: colors.background,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <IconSymbol name={item.icon} size={14} color={colors.muted} />
                  </View>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, fontFamily: Fonts.sans }}>
                    {item.label}
                  </Text>
                </View>
                <IconSymbol name="chevron.right" size={14} color={colors.border} />
              </Pressable>
            ))}
          </View>
        </View>

        {/* Logout Button */}
        <View style={{ paddingHorizontal: 16 }}>
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [
              {
                backgroundColor: colors.surface,
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.error + "30",
              },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.error, fontFamily: Fonts.sans }}>
              ログアウト
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
