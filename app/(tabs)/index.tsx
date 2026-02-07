import { useCallback, useMemo, useState } from "react";
import { FlatList, Text, View, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { DaySelector } from "@/components/day-selector";
import { MemberFilter } from "@/components/member-filter";
import { TimelineCard } from "@/components/timeline-card";
import { DAYS } from "@/data/days";
import { MemberId, ScheduleEvent } from "@/data/types";
import { filterEventsByMember } from "@/data/utils";
import { useColors } from "@/hooks/use-colors";
import { useAppStore } from "@/lib/store";
import { EVERYONE_MEMBER } from "@/data/members";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function ScheduleScreen() {
  const colors = useColors();
  const router = useRouter();
  const { state } = useAppStore();
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedMembers, setSelectedMembers] = useState<MemberId[]>([]);

  const allMembers = useMemo(() => {
    return [EVERYONE_MEMBER, ...state.members];
  }, [state.members]);

  const handleToggleMember = useCallback((memberId: MemberId) => {
    setSelectedMembers((prev) => {
      if (prev.includes(memberId)) {
        return prev.filter((m) => m !== memberId);
      }
      return [...prev, memberId];
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedMembers([]);
  }, []);

  const filteredEvents = useMemo(() => {
    const dayEvents = state.events.filter((e) => e.dayIndex === selectedDay);
    const memberFiltered = filterEventsByMember(dayEvents, selectedMembers);
    return memberFiltered.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [selectedDay, selectedMembers, state.events]);

  const renderItem = useCallback(
    ({ item }: { item: ScheduleEvent }) => (
      <Pressable
        onPress={() => router.push(`/event-detail?eventId=${item.id}` as any)}
        style={({ pressed }) => [pressed && { opacity: 0.8 }]}
      >
        <TimelineCard event={item} members={state.members} />
      </Pressable>
    ),
    [router, state.members]
  );

  const keyExtractor = useCallback((item: ScheduleEvent) => item.id, []);

  const currentDay = DAYS[selectedDay];

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerEmoji}>🇰🇷</Text>
          <View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              韓国旅行 2026
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.muted }]}>
              3/19(木) - 3/22(日)
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => router.push(`/event-form?dayIndex=${selectedDay}` as any)}
          style={({ pressed }) => [
            styles.addButton,
            { backgroundColor: colors.primary },
            pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] },
          ]}
        >
          <MaterialIcons name="add" size={22} color="#fff" />
        </Pressable>
      </View>

      {/* Day Selector */}
      <DaySelector selectedDay={selectedDay} onSelectDay={setSelectedDay} />

      {/* Member Filter */}
      <MemberFilter
        selectedMembers={selectedMembers}
        onToggleMember={handleToggleMember}
        onSelectAll={handleSelectAll}
        members={allMembers}
      />

      {/* Timeline */}
      <FlatList
        data={filteredEvents}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              該当する予定がありません
            </Text>
            <Pressable
              onPress={() => router.push(`/event-form?dayIndex=${selectedDay}` as any)}
              style={({ pressed }) => [
                styles.emptyAddButton,
                { borderColor: colors.primary },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={[styles.emptyAddText, { color: colors.primary }]}>
                予定を追加する
              </Text>
            </Pressable>
          </View>
        }
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={[styles.dayTitle, { color: colors.foreground }]}>
              {currentDay.dayLabel} - {currentDay.label}
            </Text>
            <Text style={[styles.eventCount, { color: colors.muted }]}>
              {filteredEvents.length}件の予定
            </Text>
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
    paddingBottom: 100,
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  eventCount: {
    fontSize: 12,
    marginTop: 2,
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
