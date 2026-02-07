import { useCallback, useMemo, useState } from "react";
import { FlatList, Text, View, Pressable, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { MemberFilter } from "@/components/member-filter";
import { TimelineCard } from "@/components/timeline-card";
import { MemberId, ScheduleEvent } from "@/data/types";
import { filterEventsByMember, sortEvents } from "@/data/utils";
import { useColors } from "@/hooks/use-colors";
import { useAppStore } from "@/lib/store";
import { EVERYONE_MEMBER } from "@/data/members";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function ScheduleScreen() {
  const colors = useColors();
  const router = useRouter();
  const { currentTrip, reorderEvents } = useAppStore();
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedMembers, setSelectedMembers] = useState<MemberId[]>([]);
  const [isReorderMode, setIsReorderMode] = useState(false);

  const days = currentTrip?.days ?? [];
  const events = currentTrip?.events ?? [];
  const members = currentTrip?.members ?? [];

  const allMembers = useMemo(() => {
    return [EVERYONE_MEMBER, ...members];
  }, [members]);

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
    const dayEvents = events.filter((e) => e.dayIndex === selectedDay);
    const memberFiltered = filterEventsByMember(dayEvents, selectedMembers);
    return sortEvents(memberFiltered);
  }, [selectedDay, selectedMembers, events]);

  function handleMoveUp(index: number) {
    if (index <= 0) return;
    const ids = filteredEvents.map((e) => e.id);
    const temp = ids[index];
    ids[index] = ids[index - 1];
    ids[index - 1] = temp;
    reorderEvents(selectedDay, ids);
  }

  function handleMoveDown(index: number) {
    if (index >= filteredEvents.length - 1) return;
    const ids = filteredEvents.map((e) => e.id);
    const temp = ids[index];
    ids[index] = ids[index + 1];
    ids[index + 1] = temp;
    reorderEvents(selectedDay, ids);
  }

  const renderItem = useCallback(
    ({ item, index }: { item: ScheduleEvent; index: number }) => (
      <View style={styles.itemRow}>
        {isReorderMode && (
          <View style={styles.reorderControls}>
            <Pressable
              onPress={() => handleMoveUp(index)}
              style={({ pressed }) => [
                styles.reorderButton,
                { backgroundColor: colors.surface, borderColor: colors.border },
                pressed && { opacity: 0.5 },
                index === 0 && { opacity: 0.3 },
              ]}
              disabled={index === 0}
            >
              <MaterialIcons name="keyboard-arrow-up" size={20} color={colors.foreground} />
            </Pressable>
            <Pressable
              onPress={() => handleMoveDown(index)}
              style={({ pressed }) => [
                styles.reorderButton,
                { backgroundColor: colors.surface, borderColor: colors.border },
                pressed && { opacity: 0.5 },
                index === filteredEvents.length - 1 && { opacity: 0.3 },
              ]}
              disabled={index === filteredEvents.length - 1}
            >
              <MaterialIcons name="keyboard-arrow-down" size={20} color={colors.foreground} />
            </Pressable>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Pressable
            onPress={() => {
              if (!isReorderMode) {
                router.push(`/event-detail?eventId=${item.id}` as any);
              }
            }}
            style={({ pressed }) => [!isReorderMode && pressed && { opacity: 0.8 }]}
          >
            <TimelineCard event={item} members={members} />
          </Pressable>
        </View>
      </View>
    ),
    [router, members, isReorderMode, filteredEvents, colors]
  );

  const keyExtractor = useCallback((item: ScheduleEvent) => item.id, []);

  const currentDay = days[selectedDay];

  if (!currentTrip) {
    return (
      <ScreenContainer>
        <View style={styles.emptyContainer}>
          <Text style={{ fontSize: 48 }}>✈️</Text>
          <Text style={[styles.emptyText, { color: colors.muted }]}>
            旅行を作成してください
          </Text>
          <Pressable
            onPress={() => router.push("/trip-form" as any)}
            style={({ pressed }) => [
              styles.createButton,
              { backgroundColor: colors.primary },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Text style={styles.createButtonText}>旅行を作成</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerEmoji}>{currentTrip.emoji}</Text>
          <View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              {currentTrip.name}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.muted }]}>
              {days[0]?.label} - {days[days.length - 1]?.label}
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          {/* Reorder toggle */}
          <Pressable
            onPress={() => setIsReorderMode(!isReorderMode)}
            style={({ pressed }) => [
              styles.iconButton,
              {
                backgroundColor: isReorderMode ? colors.primary : colors.surface,
                borderColor: isReorderMode ? colors.primary : colors.border,
              },
              pressed && { opacity: 0.8 },
            ]}
          >
            <MaterialIcons
              name="swap-vert"
              size={18}
              color={isReorderMode ? "#fff" : colors.foreground}
            />
          </Pressable>
          {/* Add */}
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
      </View>

      {/* Day Selector */}
      <View style={[styles.daySelectorContainer, { borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daySelectorScroll}>
          {days.map((day) => {
            const isSelected = day.index === selectedDay;
            return (
              <Pressable
                key={day.index}
                onPress={() => setSelectedDay(day.index)}
                style={({ pressed }) => [
                  styles.dayTab,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text
                  style={[
                    styles.dayTabLabel,
                    { color: isSelected ? colors.primary : colors.muted },
                  ]}
                >
                  {day.dayLabel}
                </Text>
                <Text
                  style={[
                    styles.dayTabDate,
                    {
                      color: isSelected ? colors.primary : colors.foreground,
                      fontWeight: isSelected ? "800" : "500",
                    },
                  ]}
                >
                  {day.label}
                </Text>
                {isSelected && (
                  <View style={[styles.dayTabIndicator, { backgroundColor: colors.primary }]} />
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Member Filter */}
      <MemberFilter
        selectedMembers={selectedMembers}
        onToggleMember={handleToggleMember}
        onSelectAll={handleSelectAll}
        members={allMembers}
      />

      {/* Reorder mode banner */}
      {isReorderMode && (
        <View style={[styles.reorderBanner, { backgroundColor: colors.primary + "15" }]}>
          <MaterialIcons name="swap-vert" size={16} color={colors.primary} />
          <Text style={[styles.reorderBannerText, { color: colors.primary }]}>
            並べ替えモード — 矢印で順序を変更
          </Text>
          <Pressable
            onPress={() => setIsReorderMode(false)}
            style={({ pressed }) => [pressed && { opacity: 0.6 }]}
          >
            <Text style={[styles.reorderDone, { color: colors.primary }]}>完了</Text>
          </Pressable>
        </View>
      )}

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
          currentDay ? (
            <View style={styles.listHeader}>
              <Text style={[styles.dayTitle, { color: colors.foreground }]}>
                {currentDay.dayLabel} - {currentDay.label}
              </Text>
              <Text style={[styles.eventCount, { color: colors.muted }]}>
                {filteredEvents.length}件の予定
              </Text>
            </View>
          ) : null
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
  headerEmoji: { fontSize: 28 },
  headerTitle: { fontSize: 18, fontWeight: "800", letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 12, fontWeight: "500", marginTop: 1 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  addButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  daySelectorContainer: { borderBottomWidth: 0.5 },
  daySelectorScroll: { paddingHorizontal: 4 },
  dayTab: {
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    position: "relative",
    minWidth: 70,
  },
  dayTabLabel: { fontSize: 10, fontWeight: "600", letterSpacing: 0.5 },
  dayTabDate: { fontSize: 13, marginTop: 2 },
  dayTabIndicator: {
    position: "absolute",
    bottom: 0,
    left: "15%",
    right: "15%",
    height: 3,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  listContent: { paddingBottom: 100 },
  listHeader: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  dayTitle: { fontSize: 16, fontWeight: "700" },
  eventCount: { fontSize: 12, marginTop: 2 },
  itemRow: { flexDirection: "row", alignItems: "center" },
  reorderControls: {
    paddingLeft: 8,
    gap: 2,
    alignItems: "center",
  },
  reorderButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  reorderBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  reorderBannerText: { flex: 1, fontSize: 12, fontWeight: "600" },
  reorderDone: { fontSize: 13, fontWeight: "700" },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyEmoji: { fontSize: 40 },
  emptyText: { fontSize: 14, fontWeight: "500" },
  emptyAddButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1.5,
    marginTop: 4,
  },
  emptyAddText: { fontSize: 14, fontWeight: "600" },
  createButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 22,
    marginTop: 8,
  },
  createButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
