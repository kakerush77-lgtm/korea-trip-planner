import { View, Text, Pressable, StyleSheet } from "react-native";
import { ScheduleEvent } from "@/data/types";
import { MEMBERS, EVERYONE_MEMBER, getMemberById } from "@/data/members";
import { getCategoryIcon, formatTimeRange, openNaverMap } from "@/data/utils";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";

interface TimelineCardProps {
  event: ScheduleEvent;
}

export function TimelineCard({ event }: TimelineCardProps) {
  const colors = useColors();
  const categoryIcon = getCategoryIcon(event.category);
  const timeRange = formatTimeRange(event.startTime, event.endTime);
  const hasNaverLink = !!event.naverQuery;

  // Determine border color based on members
  const borderColor = getBorderColor(event);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Left color bar */}
      <View style={[styles.colorBar, { backgroundColor: borderColor }]} />

      <View style={styles.content}>
        {/* Time row */}
        <View style={styles.timeRow}>
          <MaterialIcons name="schedule" size={14} color={colors.muted} />
          <Text style={[styles.timeText, { color: colors.muted }]}>{timeRange}</Text>
          <Text style={styles.categoryIcon}>{categoryIcon}</Text>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>
          {event.title}
        </Text>

        {/* Note */}
        {event.note ? (
          <Text style={[styles.note, { color: colors.muted }]} numberOfLines={2}>
            {event.note}
          </Text>
        ) : null}

        {/* Bottom row: members + location */}
        <View style={styles.bottomRow}>
          {/* Member badges */}
          <View style={styles.memberRow}>
            {event.members.includes("everyone") ? (
              <View style={[styles.memberBadge, { backgroundColor: EVERYONE_MEMBER.color + "20" }]}>
                <Text style={styles.memberEmoji}>{EVERYONE_MEMBER.emoji}</Text>
                <Text style={[styles.memberName, { color: EVERYONE_MEMBER.color }]}>全員</Text>
              </View>
            ) : (
              event.members.map((memberId) => {
                const member = getMemberById(memberId);
                if (!member) return null;
                return (
                  <View
                    key={memberId}
                    style={[styles.memberBadge, { backgroundColor: member.color + "20" }]}
                  >
                    <Text style={styles.memberEmoji}>{member.emoji}</Text>
                  </View>
                );
              })
            )}
          </View>

          {/* Naver Map button */}
          {hasNaverLink ? (
            <Pressable
              onPress={() => openNaverMap(event.naverQuery!)}
              style={({ pressed }) => [
                styles.mapButton,
                { backgroundColor: "#03C75A" + "18" },
                pressed && { opacity: 0.6 },
              ]}
            >
              <MaterialIcons name="map" size={14} color="#03C75A" />
              <Text style={styles.mapButtonText}>Naver Map</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function getBorderColor(event: ScheduleEvent): string {
  if (event.members.includes("everyone")) {
    return "#1E88E5";
  }
  if (event.members.length === 1) {
    const member = getMemberById(event.members[0]);
    return member?.color ?? "#999";
  }
  // Multiple members - use first member's color
  const member = getMemberById(event.members[0]);
  return member?.color ?? "#999";
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 0.5,
    overflow: "hidden",
  },
  colorBar: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: 12,
    gap: 6,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  categoryIcon: {
    fontSize: 13,
    marginLeft: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 21,
  },
  note: {
    fontSize: 12,
    lineHeight: 17,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
    flex: 1,
  },
  memberBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 2,
  },
  memberEmoji: {
    fontSize: 12,
  },
  memberName: {
    fontSize: 11,
    fontWeight: "600",
  },
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 3,
  },
  mapButtonText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#03C75A",
  },
});
