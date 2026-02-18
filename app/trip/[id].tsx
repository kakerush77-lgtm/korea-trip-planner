import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { Fonts } from "@/constants/theme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trpc } from "@/lib/trpc";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

type TabType = "spots" | "splits" | "packing" | "info";

export default function TripDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const tripId = parseInt(id || "0");

  const [activeTab, setActiveTab] = useState<TabType>("spots");
  const [newSpotName, setNewSpotName] = useState("");
  const [newSplitTitle, setNewSplitTitle] = useState("");
  const [newSplitAmount, setNewSplitAmount] = useState("");
  const [newPackingItem, setNewPackingItem] = useState("");

  const tripQuery = trpc.trips.get.useQuery({ id: tripId }, { enabled: tripId > 0 });
  const spotsQuery = trpc.spots.list.useQuery({ tripId }, { enabled: tripId > 0 });
  const splitsQuery = trpc.splits.list.useQuery({ tripId }, { enabled: tripId > 0 });
  const packingQuery = trpc.lists.get.useQuery({ tripId, listType: "packing" }, { enabled: tripId > 0 });
  const membersQuery = trpc.members.list.useQuery({ tripId }, { enabled: tripId > 0 });

  const createSpotMutation = trpc.spots.create.useMutation({
    onSuccess: () => {
      setNewSpotName("");
      spotsQuery.refetch();
    },
  });

  const deleteSpotMutation = trpc.spots.delete.useMutation({
    onSuccess: () => spotsQuery.refetch(),
  });

  const createSplitMutation = trpc.splits.create.useMutation({
    onSuccess: () => {
      setNewSplitTitle("");
      setNewSplitAmount("");
      splitsQuery.refetch();
    },
  });

  const createPackingMutation = trpc.lists.create.useMutation({
    onSuccess: () => {
      setNewPackingItem("");
      packingQuery.refetch();
    },
  });

  const updatePackingMutation = trpc.lists.update.useMutation({
    onSuccess: () => packingQuery.refetch(),
  });

  const deleteTripMutation = trpc.trips.delete.useMutation({
    onSuccess: () => router.back(),
  });

  const trip = tripQuery.data;

  const handleAddSpot = useCallback(() => {
    if (!newSpotName.trim()) return;
    createSpotMutation.mutate({ tripId, name: newSpotName.trim() });
  }, [newSpotName, tripId, createSpotMutation]);

  const handleAddSplit = useCallback(() => {
    if (!newSplitTitle.trim() || !newSplitAmount) return;
    const members = membersQuery.data?.map((m) => m.name) || ["自分"];
    createSplitMutation.mutate({
      tripId,
      title: newSplitTitle.trim(),
      amount: parseInt(newSplitAmount) || 0,
      paidBy: members[0] || "自分",
      members,
    });
  }, [newSplitTitle, newSplitAmount, tripId, membersQuery.data, createSplitMutation]);

  const handleAddPacking = useCallback(() => {
    if (!newPackingItem.trim()) return;
    createPackingMutation.mutate({
      tripId,
      listType: "packing",
      title: newPackingItem.trim(),
    });
  }, [newPackingItem, tripId, createPackingMutation]);

  const handleDeleteTrip = useCallback(() => {
    if (Platform.OS === "web") {
      if (confirm("このしおりを削除しますか？")) {
        deleteTripMutation.mutate({ id: tripId });
      }
    } else {
      Alert.alert("しおりを削除", "このしおりを削除しますか？", [
        { text: "キャンセル", style: "cancel" },
        { text: "削除", style: "destructive", onPress: () => deleteTripMutation.mutate({ id: tripId }) },
      ]);
    }
  }, [tripId, deleteTripMutation]);

  if (tripQuery.isLoading) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (!trip) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ fontSize: 16, color: colors.muted }}>しおりが見つかりません</Text>
          <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
            <Text style={{ fontSize: 14, color: colors.primary, fontWeight: "600" }}>戻る</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: "spots", label: "スポット", icon: "📍" },
    { key: "splits", label: "割り勘", icon: "💰" },
    { key: "packing", label: "持ち物", icon: "🎒" },
    { key: "info", label: "情報", icon: "ℹ️" },
  ];

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      {/* Header */}
      <View
        style={{
          backgroundColor: (trip.color as string) || "#FFE5EC",
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 16,
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 20,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              { padding: 4 },
              pressed && { opacity: 0.6 },
            ]}
          >
            <IconSymbol name="arrow.left" size={22} color={colors.foreground} />
          </Pressable>
          <Pressable
            onPress={handleDeleteTrip}
            style={({ pressed }) => [
              { padding: 4 },
              pressed && { opacity: 0.6 },
            ]}
          >
            <IconSymbol name="xmark" size={18} color={colors.error} />
          </Pressable>
        </View>
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 36, marginBottom: 4 }}>{trip.cover || "✈️"}</Text>
          <Text style={{ fontSize: 18, fontWeight: "800", color: colors.foreground, fontFamily: Fonts.sans }}>
            {trip.title}
          </Text>
          {trip.date && (
            <Text style={{ fontSize: 11, color: colors.muted, fontFamily: Fonts.sans, marginTop: 2 }}>
              {trip.date}
            </Text>
          )}
          <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
              <IconSymbol name="location.fill" size={10} color={colors.muted} />
              <Text style={{ fontSize: 10, color: colors.muted, fontFamily: Fonts.sans }}>
                {spotsQuery.data?.length || 0}スポット
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
              <IconSymbol name="person.2.fill" size={10} color={colors.muted} />
              <Text style={{ fontSize: 10, color: colors.muted, fontFamily: Fonts.sans }}>
                {membersQuery.data?.length || 0}人
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
              <IconSymbol name="calendar" size={10} color={colors.muted} />
              <Text style={{ fontSize: 10, color: colors.muted, fontFamily: Fonts.sans }}>
                {trip.days}日間
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Tab Bar */}
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: 16,
          paddingVertical: 10,
          gap: 6,
        }}
      >
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={({ pressed }) => [
              {
                flex: 1,
                paddingVertical: 8,
                borderRadius: 10,
                alignItems: "center",
                backgroundColor: activeTab === tab.key ? colors.primary + "15" : "transparent",
                borderWidth: 1,
                borderColor: activeTab === tab.key ? colors.primary + "30" : "transparent",
              },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={{ fontSize: 14, marginBottom: 2 }}>{tab.icon}</Text>
            <Text
              style={{
                fontSize: 10,
                fontWeight: activeTab === tab.key ? "700" : "500",
                color: activeTab === tab.key ? colors.primary : colors.muted,
                fontFamily: Fonts.sans,
              }}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Tab Content */}
      <View style={{ flex: 1 }}>
        {activeTab === "spots" && (
          <View style={{ flex: 1 }}>
            {/* Add Spot Input */}
            <View style={{ flexDirection: "row", paddingHorizontal: 16, marginBottom: 8, gap: 8 }}>
              <TextInput
                value={newSpotName}
                onChangeText={setNewSpotName}
                placeholder="スポットを追加..."
                placeholderTextColor={colors.muted}
                style={{
                  flex: 1,
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  fontSize: 13,
                  color: colors.foreground,
                  fontFamily: Fonts.sans,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                returnKeyType="done"
                onSubmitEditing={handleAddSpot}
              />
              <Pressable
                onPress={handleAddSpot}
                disabled={!newSpotName.trim()}
                style={({ pressed }) => [
                  {
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: newSpotName.trim() ? colors.primary : colors.border,
                    alignItems: "center",
                    justifyContent: "center",
                  },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <IconSymbol name="plus.circle.fill" size={18} color="#fff" />
              </Pressable>
            </View>

            <FlatList
              data={spotsQuery.data || []}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
              ListEmptyComponent={
                <View style={{ alignItems: "center", paddingVertical: 40 }}>
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>📍</Text>
                  <Text style={{ fontSize: 13, color: colors.muted, fontFamily: Fonts.sans }}>
                    スポットを追加しましょう
                  </Text>
                </View>
              }
              renderItem={({ item }) => (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: colors.surface,
                    borderRadius: 14,
                    padding: 12,
                    marginBottom: 6,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: colors.primary + "15", alignItems: "center", justifyContent: "center", marginRight: 10 }}>
                    <IconSymbol name="location.fill" size={14} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, fontFamily: Fonts.sans }}>
                      {item.name}
                    </Text>
                    <Text style={{ fontSize: 10, color: colors.muted, fontFamily: Fonts.sans }}>
                      Day {item.day} · {item.time}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => deleteSpotMutation.mutate({ id: item.id })}
                    style={({ pressed }) => [
                      { padding: 6 },
                      pressed && { opacity: 0.5 },
                    ]}
                  >
                    <IconSymbol name="xmark" size={12} color={colors.muted} />
                  </Pressable>
                </View>
              )}
            />
          </View>
        )}

        {activeTab === "splits" && (
          <View style={{ flex: 1 }}>
            {/* Add Split Input */}
            <View style={{ paddingHorizontal: 16, marginBottom: 8, gap: 6 }}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TextInput
                  value={newSplitTitle}
                  onChangeText={setNewSplitTitle}
                  placeholder="費目（例：ランチ）"
                  placeholderTextColor={colors.muted}
                  style={{
                    flex: 1,
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    fontSize: 13,
                    color: colors.foreground,
                    fontFamily: Fonts.sans,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                  returnKeyType="done"
                />
                <TextInput
                  value={newSplitAmount}
                  onChangeText={setNewSplitAmount}
                  placeholder="金額"
                  placeholderTextColor={colors.muted}
                  keyboardType="number-pad"
                  style={{
                    width: 80,
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    fontSize: 13,
                    color: colors.foreground,
                    fontFamily: Fonts.mono,
                    borderWidth: 1,
                    borderColor: colors.border,
                    textAlign: "right",
                  }}
                />
                <Pressable
                  onPress={handleAddSplit}
                  disabled={!newSplitTitle.trim() || !newSplitAmount}
                  style={({ pressed }) => [
                    {
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: newSplitTitle.trim() && newSplitAmount ? colors.primary : colors.border,
                      alignItems: "center",
                      justifyContent: "center",
                    },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <IconSymbol name="plus.circle.fill" size={18} color="#fff" />
                </Pressable>
              </View>
            </View>

            <FlatList
              data={splitsQuery.data || []}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
              ListEmptyComponent={
                <View style={{ alignItems: "center", paddingVertical: 40 }}>
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>💰</Text>
                  <Text style={{ fontSize: 13, color: colors.muted, fontFamily: Fonts.sans }}>
                    割り勘を追加しましょう
                  </Text>
                </View>
              }
              renderItem={({ item }) => (
                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 14,
                    padding: 12,
                    marginBottom: 6,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, fontFamily: Fonts.sans }}>
                      {item.title}
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: "800", color: colors.primary, fontFamily: Fonts.mono }}>
                      ¥{item.amount.toLocaleString()}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 10, color: colors.muted, fontFamily: Fonts.sans, marginTop: 2 }}>
                    {item.paidBy}が支払い · {Array.isArray(item.members) ? (item.members as string[]).length : 0}人で割り勘
                  </Text>
                </View>
              )}
            />
          </View>
        )}

        {activeTab === "packing" && (
          <View style={{ flex: 1 }}>
            {/* Add Packing Item */}
            <View style={{ flexDirection: "row", paddingHorizontal: 16, marginBottom: 8, gap: 8 }}>
              <TextInput
                value={newPackingItem}
                onChangeText={setNewPackingItem}
                placeholder="持ち物を追加..."
                placeholderTextColor={colors.muted}
                style={{
                  flex: 1,
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  fontSize: 13,
                  color: colors.foreground,
                  fontFamily: Fonts.sans,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                returnKeyType="done"
                onSubmitEditing={handleAddPacking}
              />
              <Pressable
                onPress={handleAddPacking}
                disabled={!newPackingItem.trim()}
                style={({ pressed }) => [
                  {
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: newPackingItem.trim() ? colors.primary : colors.border,
                    alignItems: "center",
                    justifyContent: "center",
                  },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <IconSymbol name="plus.circle.fill" size={18} color="#fff" />
              </Pressable>
            </View>

            <FlatList
              data={packingQuery.data || []}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
              ListEmptyComponent={
                <View style={{ alignItems: "center", paddingVertical: 40 }}>
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>🎒</Text>
                  <Text style={{ fontSize: 13, color: colors.muted, fontFamily: Fonts.sans }}>
                    持ち物リストを作りましょう
                  </Text>
                </View>
              }
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => updatePackingMutation.mutate({ id: item.id, checked: !item.checked })}
                  style={({ pressed }) => [
                    {
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: colors.surface,
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 4,
                      borderWidth: 1,
                      borderColor: colors.border,
                      gap: 10,
                    },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      borderWidth: 2,
                      borderColor: item.checked ? colors.success : colors.border,
                      backgroundColor: item.checked ? colors.success : "transparent",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {item.checked && <IconSymbol name="checkmark" size={12} color="#fff" />}
                  </View>
                  <Text
                    style={{
                      fontSize: 13,
                      color: item.checked ? colors.muted : colors.foreground,
                      fontFamily: Fonts.sans,
                      textDecorationLine: item.checked ? "line-through" : "none",
                    }}
                  >
                    {item.title}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        )}

        {activeTab === "info" && (
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 20 }}>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.border,
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, fontFamily: Fonts.sans, marginBottom: 10 }}>
                メンバー
              </Text>
              {(membersQuery.data || []).map((m) => (
                <View key={m.id} style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: colors.primary + "20",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: "700", color: colors.primary }}>
                      {m.name[0]}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 13, color: colors.foreground, fontFamily: Fonts.sans }}>
                    {m.name}
                  </Text>
                  <Text style={{ fontSize: 10, color: colors.muted, fontFamily: Fonts.sans }}>
                    {m.role === "owner" ? "オーナー" : m.role === "editor" ? "編集者" : "閲覧者"}
                  </Text>
                </View>
              ))}
            </View>

            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, fontFamily: Fonts.sans, marginBottom: 10 }}>
                しおり情報
              </Text>
              {[
                { label: "日数", value: `${trip.days}日間` },
                { label: "日程", value: trip.date || "未設定" },
                { label: "作成日", value: new Date(trip.createdAt).toLocaleDateString("ja-JP") },
              ].map((info, i) => (
                <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                  <Text style={{ fontSize: 12, color: colors.muted, fontFamily: Fonts.sans }}>{info.label}</Text>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: colors.foreground, fontFamily: Fonts.sans }}>{info.value}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </View>
    </ScreenContainer>
  );
}
