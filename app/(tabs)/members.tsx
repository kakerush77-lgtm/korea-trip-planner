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
  const { state } = useAppStore();

  const getMemberEventCount = useCallback(
    (memberId: string): number => {
      return state.events.filter(
        (e) => e.members.includes("everyone") || e.members.includes(memberId as any)
      ).length;
    },
    [state.events]
  );

  const getMemberDays = useCallback(
    (memberId: string): string => {
      const days = new Set<number>();
      state.events.forEach((e) => {
        if (e.members.includes("everyone") || e.members.includes(memberId as any)) {
          days.add(e.dayIndex);
        }
      });
      return Array.from(days)
        .sort()
        .map((d) => `${d + 1}日目`)
        .join(", ");
    },
    [state.events]
  );

  const renderItem = useCallback(
    ({ item }: { item: Member }) => {
      const eventCount = getMemberEventCount(item.id);
      const activeDays = getMemberDays(item.id);

      return (
        <Pressable
          onPress={() => router.push(`/member-form?memberId=${item.id}` as any)}
          style={({ pressed }) => [
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
            pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] },
          ]}
        >
          {/* Avatar circle */}
          <View style={[styles.avatar, { backgroundColor: item.color + "20" }]}>
            <Text style={styles.avatarEmoji}>{item.emoji}</Text>
          </View>

          {/* Info */}
          <View style={styles.info}>
            <Text style={[styles.name, { color: colors.foreground }]}>{item.name}</Text>
            <Text style={[styles.detail, { color: colors.muted }]}>
              {eventCount}件の予定 · {activeDays || "予定なし"}
            </Text>
          </View>

          {/* Color dot */}
          <View style={[styles.colorDot, { backgroundColor: item.color }]} />

          <MaterialIcons name="chevron-right" size={20} color={colors.muted} />
        </Pressable>
      );
    },
    [colors, router, getMemberEventCount, getMemberDays]
  );

  const keyExtractor = useCallback((item: Member) => item.id, []);

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerEmoji}>👥</Text>
          <View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>メンバー</Text>
            <Text style={[styles.headerSubtitle, { color: colors.muted }]}>
              {state.members.length}人の旅行メンバー
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
        data={state.members}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.legendCard}>
            <Text style={[styles.legendTitle, { color: colors.foreground }]}>凡例</Text>
            <View style={styles.legendGrid}>
              {state.members.map((m) => (
                <View key={m.id} style={styles.legendItem}>
                  <Text style={styles.legendEmoji}>{m.emoji}</Text>
                  <Text style={[styles.legendName, { color: colors.foreground }]}>{m.name}</Text>
                </View>
              ))}
              <View style={styles.legendItem}>
                <Text style={styles.legendEmoji}>{EVERYONE_MEMBER.emoji}</Text>
                <Text style={[styles.legendName, { color: colors.foreground }]}>全員</Text>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>👤</Text>
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              メンバーがいません
            </Text>
            <Pressable
              onPress={() => router.push("/member-form" as any)}
              style={({ pressed }) => [
                styles.emptyAddButton,
                { borderColor: colors.primary },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={[styles.emptyAddText, { color: colors.primary }]}>
                メンバーを追加する
              </Text>
            </Pressable>
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
  },
  headerEmoji: {
    fontSize: 28,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 1,
  },
  addButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
    gap: 10,
  },
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
  avatarEmoji: {
    fontSize: 22,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
  },
  detail: {
    fontSize: 12,
    fontWeight: "500",
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendCard: {
    marginBottom: 8,
    padding: 14,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 10,
  },
  legendGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendEmoji: {
    fontSize: 16,
  },
  legendName: {
    fontSize: 13,
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 40,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "500",
  },
  emptyAddButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1.5,
    marginTop: 4,
  },
  emptyAddText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
