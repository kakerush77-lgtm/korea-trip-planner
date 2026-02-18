import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { Fonts } from "@/constants/theme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trpc } from "@/lib/trpc";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

export default function TripsScreen() {
  const colors = useColors();
  const router = useRouter();
  const [search, setSearch] = useState("");

  const tripsQuery = trpc.trips.list.useQuery(undefined, {
    retry: false,
  });

  const trips = tripsQuery.data || [];
  const filtered = trips.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.date || "").includes(search)
  );

  const renderTrip = ({ item }: { item: (typeof trips)[0] }) => (
    <Pressable
      onPress={() => router.push(`/trip/${item.id}` as any)}
      style={({ pressed }) => [
        {
          backgroundColor: (item.color as string) || "#FFE5EC",
          borderRadius: 18,
          padding: 16,
          marginBottom: 10,
          position: "relative",
          overflow: "hidden",
        },
        pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
      ]}
    >
      <View style={{ position: "absolute", top: -14, right: -14, width: 60, height: 60, borderRadius: 30, backgroundColor: "rgba(255,255,255,0.18)" }} />
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 28, marginBottom: 4 }}>{item.cover || "✈️"}</Text>
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground, fontFamily: Fonts.sans }}>
            {item.title}
          </Text>
          {item.date && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
              <IconSymbol name="calendar" size={10} color={colors.muted} />
              <Text style={{ fontSize: 10, color: colors.muted, fontFamily: Fonts.sans }}>{item.date}</Text>
            </View>
          )}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
            <IconSymbol name="calendar" size={9} color={colors.muted} />
            <Text style={{ fontSize: 10, color: colors.muted, fontFamily: Fonts.sans }}>{item.days}日間</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );

  return (
    <ScreenContainer>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <IconSymbol name="airplane" size={18} color={colors.foreground} />
              <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground, fontFamily: Fonts.sans }}>
                マイしおり
              </Text>
            </View>
            <Text style={{ fontSize: 11, color: colors.muted, fontFamily: Fonts.sans }}>
              {trips.length}件
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        {trips.length > 0 && (
          <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: colors.surface,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderWidth: 1,
                borderColor: colors.border,
                gap: 8,
              }}
            >
              <IconSymbol name="magnifyingglass" size={16} color={colors.muted} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="しおりを検索..."
                placeholderTextColor={colors.muted}
                style={{
                  flex: 1,
                  fontSize: 13,
                  color: colors.foreground,
                  fontFamily: Fonts.sans,
                  padding: 0,
                }}
                returnKeyType="done"
              />
            </View>
          </View>
        )}

        {/* Loading */}
        {tripsQuery.isLoading && (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}

        {/* Trip List or Empty State */}
        {!tripsQuery.isLoading && trips.length === 0 ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 40 }}>
            <Text style={{ fontSize: 44, marginBottom: 12 }}>✈️</Text>
            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.muted, fontFamily: Fonts.sans, marginBottom: 6 }}>
              まだしおりがありません
            </Text>
            <Text style={{ fontSize: 11, color: colors.muted, fontFamily: Fonts.sans, textAlign: "center", lineHeight: 16 }}>
              下の＋ボタンから旅を計画しよう
            </Text>
          </View>
        ) : (
          !tripsQuery.isLoading && (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderTrip}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 80 }}
              showsVerticalScrollIndicator={false}
            />
          )
        )}

        {/* FAB - Create Trip */}
        <Pressable
          onPress={() => router.push("/create-trip" as any)}
          style={({ pressed }) => [
            {
              position: "absolute",
              bottom: 20,
              right: 20,
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: colors.primary,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#E8A0BF",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 6,
            },
            pressed && { transform: [{ scale: 0.93 }] },
          ]}
        >
          <IconSymbol name="plus.circle.fill" size={28} color="#fff" />
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
