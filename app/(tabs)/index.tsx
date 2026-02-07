import { useCallback, useMemo, useState } from "react";
import { FlatList, Text, View, StyleSheet } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { DaySelector } from "@/components/day-selector";
import { MemberFilter } from "@/components/member-filter";
import { TimelineCard } from "@/components/timeline-card";
import { SCHEDULE } from "@/data/schedule";
import { DAYS } from "@/data/days";
import { MemberId, ScheduleEvent } from "@/data/types";
import { filterEventsByMember } from "@/data/utils";
import { useColors } from "@/hooks/use-colors";

export default function ScheduleScreen() {
  const colors = useColors();
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedMembers, setSelectedMembers] = useState<MemberId[]>([]);

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
    const dayEvents = SCHEDULE.filter((e) => e.dayIndex === selectedDay);
    const memberFiltered = filterEventsByMember(dayEvents, selectedMembers);
    // Sort by start time
    return memberFiltered.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [selectedDay, selectedMembers]);

  const renderItem = useCallback(
    ({ item }: { item: ScheduleEvent }) => <TimelineCard event={item} />,
    []
  );

  const keyExtractor = useCallback((item: ScheduleEvent) => item.id, []);

  const currentDay = DAYS[selectedDay];

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
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

      {/* Day Selector */}
      <DaySelector selectedDay={selectedDay} onSelectDay={setSelectedDay} />

      {/* Member Filter */}
      <MemberFilter
        selectedMembers={selectedMembers}
        onToggleMember={handleToggleMember}
        onSelectAll={handleSelectAll}
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
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
