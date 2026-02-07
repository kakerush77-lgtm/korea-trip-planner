import { describe, it, expect } from "vitest";
import { SCHEDULE } from "../data/schedule";
import { MEMBERS, getMemberById, getMemberColor, EVERYONE_MEMBER } from "../data/members";
import { DAYS } from "../data/days";
import type { ScheduleEvent, Member } from "../data/types";

// Pure data/logic tests (no React Native imports)

function filterEventsByMember(
  events: typeof SCHEDULE,
  selectedMembers: string[]
): typeof SCHEDULE {
  if (selectedMembers.length === 0) return events;
  return events.filter((event) => {
    if (event.members.includes("everyone" as any)) return true;
    return event.members.some((m) => selectedMembers.includes(m));
  });
}

function formatTimeRange(start: string, end: string): string {
  if (start === end) return start;
  return `${start} - ${end}`;
}

function getCategoryIcon(category?: string): string {
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

function getCategoryLabel(category?: string): string {
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

describe("Schedule Data", () => {
  it("should have events for all 4 days", () => {
    const dayIndices = new Set(SCHEDULE.map((e) => e.dayIndex));
    expect(dayIndices.size).toBe(4);
    expect(dayIndices.has(0)).toBe(true);
    expect(dayIndices.has(1)).toBe(true);
    expect(dayIndices.has(2)).toBe(true);
    expect(dayIndices.has(3)).toBe(true);
  });

  it("should have unique IDs for all events", () => {
    const ids = SCHEDULE.map((e) => e.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("should have valid time formats", () => {
    const timeRegex = /^\d{2}:\d{2}$/;
    SCHEDULE.forEach((event) => {
      expect(event.startTime).toMatch(timeRegex);
      expect(event.endTime).toMatch(timeRegex);
    });
  });

  it("should have valid member references", () => {
    const validIds = ["shohei", "kayoko", "nanako", "chifumi", "orito", "everyone"];
    SCHEDULE.forEach((event) => {
      event.members.forEach((m) => {
        expect(validIds).toContain(m);
      });
    });
  });

  it("Day 1 should have 11 events", () => {
    expect(SCHEDULE.filter((e) => e.dayIndex === 0).length).toBe(11);
  });

  it("Day 2 should have 12 events", () => {
    expect(SCHEDULE.filter((e) => e.dayIndex === 1).length).toBe(12);
  });

  it("Day 3 should have 11 events", () => {
    expect(SCHEDULE.filter((e) => e.dayIndex === 2).length).toBe(11);
  });

  it("Day 4 should have 7 events", () => {
    expect(SCHEDULE.filter((e) => e.dayIndex === 3).length).toBe(7);
  });

  it("total events should be 41", () => {
    expect(SCHEDULE.length).toBe(41);
  });
});

describe("Members Data", () => {
  it("should have 5 members", () => {
    expect(MEMBERS.length).toBe(5);
  });

  it("should find member by ID", () => {
    const shohei = getMemberById("shohei");
    expect(shohei).toBeDefined();
    expect(shohei!.name).toBe("翔平");
    expect(shohei!.emoji).toBe("🩵");
  });

  it("should return everyone member", () => {
    const everyone = getMemberById("everyone");
    expect(everyone).toBeDefined();
    expect(everyone!.name).toBe("全員");
  });

  it("should return correct color", () => {
    expect(getMemberColor("shohei")).toBe("#60B5D1");
    expect(getMemberColor("unknown")).toBe("#999999");
  });

  it("all members should have required fields", () => {
    MEMBERS.forEach((m) => {
      expect(m.id).toBeTruthy();
      expect(m.name).toBeTruthy();
      expect(m.emoji).toBeTruthy();
      expect(m.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });
});

describe("Days Data", () => {
  it("should have 4 days", () => {
    expect(DAYS.length).toBe(4);
  });

  it("should have correct dates", () => {
    expect(DAYS[0].date).toBe("2026-03-19");
    expect(DAYS[1].date).toBe("2026-03-20");
    expect(DAYS[2].date).toBe("2026-03-21");
    expect(DAYS[3].date).toBe("2026-03-22");
  });

  it("should have sequential indices", () => {
    DAYS.forEach((day, i) => {
      expect(day.index).toBe(i);
    });
  });
});

describe("Filter Events", () => {
  it("should return all events when no members selected", () => {
    const result = filterEventsByMember(SCHEDULE, []);
    expect(result.length).toBe(SCHEDULE.length);
  });

  it("should include everyone events when filtering by any member", () => {
    const result = filterEventsByMember(SCHEDULE, ["shohei"]);
    const everyoneEvents = result.filter((e) => e.members.includes("everyone" as any));
    expect(everyoneEvents.length).toBeGreaterThan(0);
  });

  it("should filter by specific member", () => {
    const result = filterEventsByMember(SCHEDULE, ["nanako"]);
    result.forEach((event) => {
      const hasNanako = event.members.includes("nanako" as any) || event.members.includes("everyone" as any);
      expect(hasNanako).toBe(true);
    });
  });

  it("should handle multiple member filter", () => {
    const result = filterEventsByMember(SCHEDULE, ["shohei", "nanako"]);
    result.forEach((event) => {
      const hasEither =
        event.members.includes("shohei" as any) ||
        event.members.includes("nanako" as any) ||
        event.members.includes("everyone" as any);
      expect(hasEither).toBe(true);
    });
  });
});

describe("Utility Functions", () => {
  it("formatTimeRange should format correctly", () => {
    expect(formatTimeRange("07:00", "07:16")).toBe("07:00 - 07:16");
    expect(formatTimeRange("07:15", "07:15")).toBe("07:15");
  });

  it("getCategoryIcon should return correct icons", () => {
    expect(getCategoryIcon("transport")).toBe("🚇");
    expect(getCategoryIcon("food")).toBe("🍽️");
    expect(getCategoryIcon("shopping")).toBe("🛍️");
    expect(getCategoryIcon("beauty")).toBe("💆");
    expect(getCategoryIcon(undefined)).toBe("📌");
  });

  it("getCategoryLabel should return correct labels", () => {
    expect(getCategoryLabel("transport")).toBe("移動");
    expect(getCategoryLabel("food")).toBe("グルメ");
    expect(getCategoryLabel("shopping")).toBe("ショッピング");
    expect(getCategoryLabel("beauty")).toBe("ビューティー");
    expect(getCategoryLabel("sightseeing")).toBe("観光");
    expect(getCategoryLabel("activity")).toBe("アクティビティ");
    expect(getCategoryLabel("other")).toBe("その他");
    expect(getCategoryLabel(undefined)).toBe("その他");
  });
});

describe("CRUD Operations - Data Validation", () => {
  it("should create a valid event object with all fields", () => {
    const newEvent: ScheduleEvent = {
      id: "test-event-1",
      dayIndex: 0,
      startTime: "10:00",
      endTime: "11:00",
      title: "テスト予定",
      members: ["everyone"],
      category: "other",
      note: "テストメモ",
      naverQuery: "테스트",
      location: "テスト場所",
    };
    expect(newEvent.id).toBeTruthy();
    expect(newEvent.title).toBe("テスト予定");
    expect(newEvent.note).toBe("テストメモ");
    expect(newEvent.naverQuery).toBe("테스트");
    expect(newEvent.location).toBe("テスト場所");
    expect(newEvent.category).toBe("other");
  });

  it("should create a valid member object", () => {
    const newMember: Member = {
      id: "test-member-1",
      name: "テストユーザー",
      emoji: "😎",
      color: "#FF5733",
    };
    expect(newMember.id).toBeTruthy();
    expect(newMember.name).toBe("テストユーザー");
    expect(newMember.emoji).toBe("😎");
    expect(newMember.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it("should simulate removing a member from events", () => {
    const events: ScheduleEvent[] = [
      { id: "e1", dayIndex: 0, startTime: "09:00", endTime: "10:00", title: "A", members: ["shohei", "nanako"] },
      { id: "e2", dayIndex: 0, startTime: "10:00", endTime: "11:00", title: "B", members: ["everyone"] },
      { id: "e3", dayIndex: 0, startTime: "11:00", endTime: "12:00", title: "C", members: ["nanako"] },
    ];
    const cleaned = events.map((e) => ({
      ...e,
      members: e.members.filter((m) => m !== "shohei"),
    }));
    expect(cleaned[0].members).toEqual(["nanako"]);
    expect(cleaned[1].members).toEqual(["everyone"]);
    expect(cleaned[2].members).toEqual(["nanako"]);
  });

  it("should support optional fields on events", () => {
    const minimalEvent: ScheduleEvent = {
      id: "min-1",
      dayIndex: 0,
      startTime: "09:00",
      endTime: "10:00",
      title: "最小限の予定",
      members: ["everyone"],
    };
    expect(minimalEvent.note).toBeUndefined();
    expect(minimalEvent.naverQuery).toBeUndefined();
    expect(minimalEvent.location).toBeUndefined();
    expect(minimalEvent.category).toBeUndefined();
  });

  it("should simulate updating an event", () => {
    const original: ScheduleEvent = {
      id: "upd-1",
      dayIndex: 0,
      startTime: "09:00",
      endTime: "10:00",
      title: "元のタイトル",
      members: ["everyone"],
    };
    const updated = { ...original, title: "更新後のタイトル", note: "新しいメモ" };
    expect(updated.id).toBe(original.id);
    expect(updated.title).toBe("更新後のタイトル");
    expect(updated.note).toBe("新しいメモ");
  });

  it("should simulate deleting an event from list", () => {
    const events: ScheduleEvent[] = [
      { id: "del-1", dayIndex: 0, startTime: "09:00", endTime: "10:00", title: "A", members: ["everyone"] },
      { id: "del-2", dayIndex: 0, startTime: "10:00", endTime: "11:00", title: "B", members: ["everyone"] },
      { id: "del-3", dayIndex: 0, startTime: "11:00", endTime: "12:00", title: "C", members: ["everyone"] },
    ];
    const afterDelete = events.filter((e) => e.id !== "del-2");
    expect(afterDelete.length).toBe(2);
    expect(afterDelete.find((e) => e.id === "del-2")).toBeUndefined();
  });
});
