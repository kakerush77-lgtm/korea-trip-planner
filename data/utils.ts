import { Linking, Platform } from "react-native";
import { ScheduleEvent, MemberId } from "./types";

export function getCategoryIcon(category?: string): string {
  switch (category) {
    case "transport":
      return "🚇";
    case "food":
      return "🍽️";
    case "shopping":
      return "🛍️";
    case "beauty":
      return "💆";
    case "sightseeing":
      return "📸";
    case "activity":
      return "🎮";
    default:
      return "📌";
  }
}

export function getCategoryLabel(category?: string): string {
  switch (category) {
    case "transport":
      return "移動";
    case "food":
      return "グルメ";
    case "shopping":
      return "ショッピング";
    case "beauty":
      return "ビューティー";
    case "sightseeing":
      return "観光";
    case "activity":
      return "アクティビティ";
    default:
      return "その他";
  }
}

export function openNaverMap(query: string): void {
  if (!query) return;

  const encodedQuery = encodeURIComponent(query);

  // Try Naver Map app first, fallback to web
  const appUrl = `nmap://search?query=${encodedQuery}&appname=com.koreatrip`;
  const webUrl = `https://map.naver.com/v5/search/${encodedQuery}`;

  if (Platform.OS === "web") {
    // On web, open in new tab
    window.open(webUrl, "_blank");
    return;
  }

  Linking.canOpenURL(appUrl)
    .then((supported) => {
      if (supported) {
        Linking.openURL(appUrl);
      } else {
        Linking.openURL(webUrl);
      }
    })
    .catch(() => {
      Linking.openURL(webUrl);
    });
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
