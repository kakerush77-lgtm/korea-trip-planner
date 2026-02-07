import { View, Text, Pressable, ScrollView, StyleSheet, Linking, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAppStore } from "@/lib/store";
import { EVERYONE_MEMBER } from "@/data/members";
import { getCategoryIcon, getCategoryLabel, formatTimeRange, openMap } from "@/data/utils";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function EventDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ eventId: string }>();
  const { currentTrip } = useAppStore();

  const events = currentTrip?.events ?? [];
  const members = currentTrip?.members ?? [];
  const days = currentTrip?.days ?? [];

  const event = events.find((e) => e.id === params.eventId);
  if (!event) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]}>
        <View style={styles.notFound}>
          <Text style={[styles.notFoundText, { color: colors.muted }]}>予定が見つかりません</Text>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
            <Text style={[styles.backLink, { color: colors.primary }]}>戻る</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  const day = days[event.dayIndex];
  const categoryIcon = getCategoryIcon(event.category);
  const categoryLabel = getCategoryLabel(event.category);
  const timeRange = formatTimeRange(event.startTime, event.endTime);

  const allMembers = [EVERYONE_MEMBER, ...members];

  function getMemberInfo(memberId: string) {
    return allMembers.find((m) => m.id === memberId);
  }

  function openLink(url: string) {
    if (Platform.OS === "web") {
      window.open(url, "_blank");
    } else {
      Linking.openURL(url).catch(() => {});
    }
  }

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>予定の詳細</Text>
        <Pressable
          onPress={() => router.push(`/event-form?eventId=${event.id}` as any)}
          style={({ pressed }) => [pressed && { opacity: 0.6 }]}
        >
          <MaterialIcons name="edit" size={22} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Badges */}
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: colors.primary + "15" }]}>
            <Text style={styles.badgeIcon}>{categoryIcon}</Text>
            <Text style={[styles.badgeText, { color: colors.primary }]}>{categoryLabel}</Text>
          </View>
          {day && (
            <View style={[styles.badge, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
              <Text style={[styles.badgeText, { color: colors.foreground }]}>
                {day.dayLabel} · {day.label}
              </Text>
            </View>
          )}
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.foreground }]}>{event.title}</Text>

        {/* Time */}
        <View style={styles.infoRow}>
          <MaterialIcons name="schedule" size={20} color={colors.muted} />
          <Text style={[styles.infoText, { color: colors.foreground }]}>{timeRange}</Text>
        </View>

        {/* Location */}
        {event.location ? (
          <View style={styles.infoRow}>
            <MaterialIcons name="location-on" size={20} color={colors.muted} />
            <Text style={[styles.infoText, { color: colors.foreground }]}>{event.location}</Text>
          </View>
        ) : null}

        {/* Members */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>参加メンバー</Text>
          <View style={styles.memberList}>
            {event.members.map((memberId) => {
              const member = getMemberInfo(memberId);
              if (!member) return null;
              return (
                <View key={memberId} style={[styles.memberChip, { backgroundColor: member.color + "18" }]}>
                  <Text style={styles.memberEmoji}>{member.emoji}</Text>
                  <Text style={[styles.memberName, { color: member.color }]}>{member.name}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Note */}
        {event.note ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>メモ</Text>
            <View style={[styles.noteBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.noteText, { color: colors.foreground }]}>{event.note}</Text>
            </View>
          </View>
        ) : null}

        {/* Map */}
        {event.mapInfo ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>マップ</Text>
            <Pressable
              onPress={() => openMap(event.mapInfo!)}
              style={({ pressed }) => [
                styles.mapCard,
                {
                  backgroundColor: (event.mapInfo!.type === "google" ? "#4285F4" : "#03C75A") + "10",
                  borderColor: (event.mapInfo!.type === "google" ? "#4285F4" : "#03C75A") + "40",
                },
                pressed && { opacity: 0.7 },
              ]}
            >
              <MaterialIcons
                name="map"
                size={22}
                color={event.mapInfo.type === "google" ? "#4285F4" : "#03C75A"}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.mapTitle, { color: event.mapInfo.type === "google" ? "#4285F4" : "#03C75A" }]}>
                  {event.mapInfo.type === "google" ? "Google Map" : "Naver Map"}で開く
                </Text>
                {event.mapInfo.url ? (
                  <Text style={[styles.mapQuery, { color: colors.muted }]} numberOfLines={1}>
                    {event.mapInfo.url}
                  </Text>
                ) : null}
              </View>
              <MaterialIcons
                name="open-in-new"
                size={18}
                color={event.mapInfo.type === "google" ? "#4285F4" : "#03C75A"}
              />
            </Pressable>
          </View>
        ) : null}

        {/* Links */}
        {event.links && event.links.length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>リンク</Text>
            {event.links.map((link) => (
              <Pressable
                key={link.id}
                onPress={() => openLink(link.url)}
                style={({ pressed }) => [
                  styles.linkCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <MaterialIcons name="link" size={18} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.linkLabel, { color: colors.foreground }]}>
                    {link.label || "リンク"}
                  </Text>
                  <Text style={[styles.linkUrl, { color: colors.muted }]} numberOfLines={1}>
                    {link.url}
                  </Text>
                </View>
                <MaterialIcons name="open-in-new" size={16} color={colors.muted} />
              </Pressable>
            ))}
          </View>
        ) : null}

        {/* Edit button */}
        <Pressable
          onPress={() => router.push(`/event-form?eventId=${event.id}` as any)}
          style={({ pressed }) => [
            styles.editButton,
            { backgroundColor: colors.primary },
            pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
          ]}
        >
          <MaterialIcons name="edit" size={18} color="#fff" />
          <Text style={styles.editButtonText}>この予定を編集</Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  headerTitle: { fontSize: 17, fontWeight: "700" },
  content: { padding: 16, gap: 16 },
  badgeRow: { flexDirection: "row", gap: 8 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 4,
  },
  badgeIcon: { fontSize: 14 },
  badgeText: { fontSize: 12, fontWeight: "600" },
  title: { fontSize: 24, fontWeight: "800", lineHeight: 32 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  infoText: { fontSize: 15, fontWeight: "500" },
  section: { gap: 10, marginTop: 4 },
  sectionTitle: { fontSize: 14, fontWeight: "700", letterSpacing: 0.5 },
  memberList: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  memberChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 5,
  },
  memberEmoji: { fontSize: 16 },
  memberName: { fontSize: 13, fontWeight: "600" },
  noteBox: { padding: 14, borderRadius: 12, borderWidth: 0.5 },
  noteText: { fontSize: 14, lineHeight: 21 },
  mapCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  mapTitle: { fontSize: 14, fontWeight: "700" },
  mapQuery: { fontSize: 12, marginTop: 2 },
  linkCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 0.5,
    gap: 10,
  },
  linkLabel: { fontSize: 14, fontWeight: "600" },
  linkUrl: { fontSize: 11, marginTop: 1 },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
    marginTop: 8,
  },
  editButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notFoundText: { fontSize: 16 },
  backLink: { fontSize: 15, fontWeight: "600" },
});
