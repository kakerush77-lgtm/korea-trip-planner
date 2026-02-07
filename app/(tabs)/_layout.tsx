import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Platform } from "react-native";
import { useColors } from "@/hooks/use-colors";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
        },
        tabBarLabelStyle: {
          fontSize: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "スケジュール",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={22} name="calendar" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: "行きたい",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={22} name="mappin.and.ellipse" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="shopping"
        options={{
          title: "買いたい",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={22} name="bag.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="packing"
        options={{
          title: "持ち物",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={22} name="suitcase.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="members"
        options={{
          title: "メンバー",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={22} name="person.2.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "管理",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={22} name="globe" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
