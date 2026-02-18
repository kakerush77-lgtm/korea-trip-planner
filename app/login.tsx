import { ScreenContainer } from "@/components/screen-container";
import { startOAuthLogin } from "@/constants/oauth";
import { useColors } from "@/hooks/use-colors";
import { Fonts } from "@/constants/theme";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";

export default function LoginScreen() {
  const colors = useColors();
  const [loading, setLoading] = useState(false);

  const handleLogin = useCallback(async () => {
    setLoading(true);
    try {
      await startOAuthLogin();
    } catch (error) {
      console.error("[Login] Failed to start OAuth:", error);
    } finally {
      // Keep loading on native (browser opens externally)
      if (Platform.OS === "web") {
        // Web redirects away, so loading stays
      } else {
        // On native, reset after a delay (user may cancel)
        setTimeout(() => setLoading(false), 3000);
      }
    }
  }, []);

  return (
    <ScreenContainer
      edges={["top", "bottom", "left", "right"]}
      containerClassName="bg-background"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 32, paddingVertical: 48 }}>
          {/* Logo & Branding */}
          <Animated.View
            entering={FadeInUp.duration(600).delay(100)}
            style={{ alignItems: "center", marginBottom: 48 }}
          >
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 28,
                overflow: "hidden",
                marginBottom: 20,
                shadowColor: "#E8A0BF",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              <Image
                source={require("@/assets/images/icon.png")}
                style={{ width: 100, height: 100 }}
                resizeMode="cover"
              />
            </View>
            <Text
              style={{
                fontSize: 36,
                fontWeight: "800",
                color: colors.foreground,
                fontFamily: Fonts.sans,
                letterSpacing: -0.5,
              }}
            >
              tabi
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.muted,
                marginTop: 8,
                fontFamily: Fonts.sans,
                textAlign: "center",
                lineHeight: 20,
              }}
            >
              みんなで作る旅のしおり
            </Text>
          </Animated.View>

          {/* Features */}
          <Animated.View
            entering={FadeIn.duration(500).delay(300)}
            style={{ marginBottom: 48 }}
          >
            {[
              { emoji: "✈️", text: "旅行プランを簡単作成" },
              { emoji: "👥", text: "友達と共有・共同編集" },
              { emoji: "💰", text: "割り勘もスマートに管理" },
            ].map((feature, i) => (
              <View
                key={i}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  marginBottom: 8,
                  backgroundColor: colors.surface,
                  borderRadius: 14,
                }}
              >
                <Text style={{ fontSize: 20, marginRight: 12 }}>{feature.emoji}</Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.foreground,
                    fontWeight: "600",
                    fontFamily: Fonts.sans,
                  }}
                >
                  {feature.text}
                </Text>
              </View>
            ))}
          </Animated.View>

          {/* Login Button */}
          <Animated.View entering={FadeInDown.duration(500).delay(500)}>
            <Pressable
              onPress={handleLogin}
              disabled={loading}
              style={({ pressed }) => [
                {
                  backgroundColor: "#E8A0BF",
                  paddingVertical: 16,
                  borderRadius: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  gap: 8,
                  shadowColor: "#E8A0BF",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 12,
                  elevation: 4,
                  opacity: loading ? 0.7 : 1,
                },
                pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff", fontFamily: Fonts.sans }}>
                    ログインして始める
                  </Text>
                </>
              )}
            </Pressable>

            {/* Terms */}
            <Text
              style={{
                fontSize: 11,
                color: colors.muted,
                textAlign: "center",
                marginTop: 16,
                lineHeight: 16,
                fontFamily: Fonts.sans,
              }}
            >
              ログインすることで、利用規約とプライバシーポリシーに同意したものとみなされます
            </Text>
          </Animated.View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
