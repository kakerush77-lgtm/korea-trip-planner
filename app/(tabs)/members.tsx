import { useCallback, useMemo } from "react";
import { FlatList, Text, View, Pressable, StyleSheet } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { EVERYONE_MEMBER } from "@/data/members";
import { Member } from "@/data/types";
import { useColors } from "@/hooks/use-colors";
import { useRouter } from "expo-router";
import { useAppStore } from "@/lib/store";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function MembersScreen() {
  const colors = useColors();
  const router = useRouter();
  const { currentTrip } = useAppStore();

  const members = currentTrip?.members ?? [];
  const events = currentTrip?.events ?? [];

  const getMemberEventCount = useCallback(
    (memberId: string): number => {
      return events.filter(
        (e) => e.members.includes("everyone") || e.members.includes(memberId as any)
      ).length;
    },
    [events]
  );

  const renderItem = useCallback(
    ({ item }: { item: Member }) => {
      const eventCount = getMemberEventCount(item.id);
      const isEveryone = item.id === "everyone";

      return (
        <Pressable
          onPress={isEveryone ? undefined : () => router.push(`/member-form?memberId=${item.id}` as any)}
          style={({ pressed }) => [
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
            !isEveryone && pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] },
          ]}
        >
          <View style={[styles.avatar, { backgroundColor: item.color + "20" }]}>
            <Text style={styles.avatarEmoji}>{item.emoji}</Text>
          </View>
          <View style={styles.info}>
            <Text style={[styles.name, { color: colors.foreground }]}>{item.name}</Text>
            <Text style={[styles.detail, { color: colors.muted }]}>
              {eventCount}件の予定
            </Text>
          </View>
          <View style={[styles.colorDot, { backgroundColor: item.color }]} />
          {!isEveryone && (
            <MaterialIcons name="chevron-right" size={20} color={colors.muted} />
          )}
        </Pressable>
      );
    },
    [colors, router, getMemberEventCount]
  );

  const allMembers = useMemo(() => [EVERYONE_MEMBER, ...members], [members]);
  const keyExtractor = useCallback((item: Member) => item.id, []);

  return (
    <ScreenContainer>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Pressable
            onPress={() => router.replace("/home" as any)}
            style={({ pressed }) => [
              styles.homeButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
              pressed && { opacity: 0.6 },
            ]}
          >
            <MaterialIcons name="home" size={20} color={colors.primary} />
          </Pressable>
          <Text style={styles.headerEmoji}>👥</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>メンバー</Text>
            <Text style={[styles.headerSubtitle, { color: colors.muted }]}>
              {members.length}人の旅行メンバー
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => router.push("/member-form" as any)}
          style={({ pressed }) => [
            styles.addButton,
            { backgroundColor: colors.primary },
            pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] },
          ]}
        >
          <MaterialIcons name="person-add" size={20} color="#fff" />
        </Pressable>
      </View>

      <FlatList
        data={allMembers}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>👤</Text>
            <Text style={[styles.emptyText, { color: colors.muted }]}>メンバーがいません</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  homeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  headerEmoji: { fontSize: 28 },
  headerTitle: { fontSize: 20, fontWeight: "800", letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 12, fontWeight: "500", marginTop: 1 },
  addButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: { padding: 16, paddingBottom: 100, gap: 10 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 0.5,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: { fontSize: 22 },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 16, fontWeight: "700" },
  detail: { fontSize: 12, fontWeight: "500" },
  colorDot: { width: 10, height: 10, borderRadius: 5 },
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 12 },
  emptyEmoji: { fontSize: 40 },
  emptyText: { fontSize: 14, fontWeight: "500" },
});
