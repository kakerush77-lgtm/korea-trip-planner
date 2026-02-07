export type MemberId = "shohei" | "kayoko" | "nanako" | "chifumi" | "orito" | "everyone";

export interface Member {
  id: MemberId;
  name: string;
  emoji: string;
  color: string;
}

export interface ScheduleEvent {
  id: string;
  dayIndex: number; // 0-3 (Day 1-4)
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  title: string;
  members: MemberId[];
  location?: string;
  naverQuery?: string; // Naver Map search query (Korean)
  note?: string;
  category?: "transport" | "food" | "shopping" | "beauty" | "sightseeing" | "activity" | "other";
}

export interface DayInfo {
  index: number;
  date: string; // "2026-03-19"
  label: string; // "3/19(木)"
  dayLabel: string; // "1日目"
}
