export type MemberId = string;

export interface Member {
  id: MemberId;
  name: string;
  emoji: string;
  color: string;
}

export type MapType = "naver" | "google";

export interface EventLink {
  id: string;
  label: string;
  url: string;
}

export interface MapInfo {
  type: MapType;
  query?: string; // search query
  url?: string; // direct URL
}

export interface ScheduleEvent {
  id: string;
  dayIndex: number;
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  title: string;
  members: MemberId[];
  location?: string;
  naverQuery?: string; // legacy - kept for migration
  mapInfo?: MapInfo;
  links?: EventLink[];
  note?: string;
  sortOrder?: number; // for manual ordering
  category?: "transport" | "food" | "shopping" | "beauty" | "sightseeing" | "activity" | "other";
}

export interface DayInfo {
  id: string;
  index: number;
  date: string; // "2026-03-19"
  label: string; // "3/19(木)"
  dayLabel: string; // "1日目"
}

export interface PackingItem {
  id: string;
  name: string;
  checked: boolean;
  category?: string;
  quantity: number;
  memberId?: MemberId; // "everyone" or specific member id
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  price?: string;
  note?: string;
  bought: boolean;
  memberId?: MemberId;
}

export interface LinkItem {
  id: string;
  title: string;
  category?: string; // "restaurant", "hotel", "shopping", "sightseeing", "other"
  url: string;
  note?: string;
  memberId?: MemberId;
}

export interface Trip {
  id: string;
  name: string;
  emoji: string;
  startDate: string; // "2026-03-19"
  endDate: string; // "2026-03-22"
  days: DayInfo[];
  events: ScheduleEvent[];
  members: Member[];
  packingItems: PackingItem[];
  linkItems: LinkItem[];
  shoppingItems: ShoppingItem[];
  createdAt: string;
  updatedAt: string;
}
