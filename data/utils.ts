import { Linking, Platform } from "react-native";
import { ScheduleEvent, MemberId, MapInfo } from "./types";

export function getCategoryIcon(category?: string): string {
  switch (category) {
    case "transport": return "🚇";
    case "food": return "🍽️";
    case "shopping": return "🛍️";
    case "beauty": return "💆";
    case "sightseeing": return "📸";
    case "activity": return "🎮";
    default: return "📌";
  }
}

export function getCategoryLabel(category?: string): string {
  switch (category) {
    case "transport": return "移動";
    case "food": return "グルメ";
    case "shopping": return "ショッピング";
    case "beauty": return "ビューティー";
    case "sightseeing": return "観光";
    case "activity": return "アクティビティ";
    default: return "その他";
  }
}

export function openNaverMap(query: string): void {
  if (!query) return;
  const encodedQuery = encodeURIComponent(query);
  const appUrl = `nmap://search?query=${encodedQuery}&appname=com.koreatrip`;
  const webUrl = `https://map.naver.com/v5/search/${encodedQuery}`;
  if (Platform.OS === "web") {
    window.open(webUrl, "_blank");
    return;
  }
  Linking.canOpenURL(appUrl)
    .then((supported) => Linking.openURL(supported ? appUrl : webUrl))
    .catch(() => Linking.openURL(webUrl));
}

export function openGoogleMap(query: string): void {
  if (!query) return;
  const encodedQuery = encodeURIComponent(query);
  const webUrl = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;
  if (Platform.OS === "web") {
    window.open(webUrl, "_blank");
    return;
  }
  Linking.openURL(webUrl).catch(() => {});
}

export function openMap(mapInfo: MapInfo): void {
  if (mapInfo.url) {
    if (Platform.OS === "web") {
      window.open(mapInfo.url, "_blank");
    } else {
      Linking.openURL(mapInfo.url).catch(() => {});
    }
    return;
  }
  if (mapInfo.query) {
    if (mapInfo.type === "google") {
      openGoogleMap(mapInfo.query);
    } else {
      openNaverMap(mapInfo.query);
    }
  }
}

export function filterEventsByMember(
  events: ScheduleEvent[],
  selectedMembers: MemberId[]
): ScheduleEvent[] {
  if (selectedMembers.length === 0) return events;
  return events.filter((event) => {
    if (event.members.includes("everyone")) return true;
    return event.members.some((m) => selectedMembers.includes(m));
  });
}

export function formatTimeRange(start: string, end: string): string {
  if (start === end) return start;
  return `${start} - ${end}`;
}

export function sortEvents(events: ScheduleEvent[]): ScheduleEvent[] {
  return [...events].sort((a, b) => {
    if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
      return a.sortOrder - b.sortOrder;
    }
    return a.startTime.localeCompare(b.startTime);
  });
}
