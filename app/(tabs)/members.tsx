import { useCallback, useMemo } from "react";
import { FlatList, Text, View, Pressable, StyleSheet } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { MEMBERS } from "@/data/members";
import { SCHEDULE } from "@/data/schedule";
import { Member, ScheduleEvent } from "@/data/types";
import { useColors } from "@/hooks/use-colors";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

function getMemberEventCount(memberId: string): number {
  return SCHEDULE.filter(
    (e) => e.members.includes("everyone") || e.members.includes(memberId as any)
  ).length;
}

function getMemberDays(memberId: string): string {
  const days = new Set<number>();
  SCHEDULE.forEach((e) => {
    if (e.members.includes("everyone") || e.members.includes(memberId as any)) {
      days.add(e.dayIndex);
    }
  });
  return Array.from(days)
    .sort()
    .map((d) => `${d + 1}日目`)
    .join(", ");
}

export default function MembersScreen() {
  const colors = useColors();
  const router = useRouter();

  const renderItem = useCallback(
    ({ item }: { item: Member }) => {
      const eventCount = getMemberEventCount(item.id);
      const activeDays = getMemberDays(item.id);

      return (
        <Pressable
          onPress={() => {
            router.push(`/?member=${item.id}` as any);
          }}
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
              {eventCount}件の予定 · {activeDays}
            </Text>
          </View>

          {/* Color dot */}
          <View style={[styles.colorDot, { backgroundColor: item.color }]} />

          <MaterialIcons name="chevron-right" size={20} color={colors.muted} />
        </Pressable>
      );
    },
    [colors, router]
  );

  const keyExtractor = useCallback((item: Member) => item.id, []);

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={styles.headerEmoji}>👥</Text>
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>メンバー</Text>
          <Text style={[styles.headerSubtitle, { color: colors.muted }]}>
            {MEMBERS.length}人の旅行メンバー
          </Text>
        </View>
      </View>

      <FlatList
        data={MEMBERS}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.legendCard}>
            <Text style={[styles.legendTitle, { color: colors.foreground }]}>凡例</Text>
            <View style={styles.legendGrid}>
              {MEMBERS.map((m) => (
                <View key={m.id} style={styles.legendItem}>
                  <Text style={styles.legendEmoji}>{m.emoji}</Text>
                  <Text style={[styles.legendName, { color: colors.foreground }]}>{m.name}</Text>
                </View>
              ))}
              <View style={styles.legendItem}>
                <Text style={styles.legendEmoji}>🌈</Text>
                <Text style={[styles.legendName, { color: colors.foreground }]}>全員</Text>
              </View>
            </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 0.5,
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
});
