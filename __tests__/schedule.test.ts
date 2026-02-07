import { describe, it, expect } from "vitest";
import { SCHEDULE } from "../data/schedule";
import { MEMBERS, getMemberById, getMemberColor, EVERYONE_MEMBER } from "../data/members";
import { DAYS } from "../data/days";
import { generateDays } from "../lib/store";
import type { ScheduleEvent, Member, DayInfo, PackingItem, Trip, EventLink, MapInfo } from "../data/types";

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

// ---- Schedule Data Tests ----
describe("Schedule Data", () => {
  it("should have events for all 4 days", () => {
    const dayIndices = new Set(SCHEDULE.map((e) => e.dayIndex));
    expect(dayIndices.size).toBe(4);
    expect(dayIndices.has(0)).toBe(true);
    expect(dayIndices.has(3)).toBe(true);
  });

  it("should have unique IDs for all events", () => {
    const ids = SCHEDULE.map((e) => e.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("should have valid time formats", () => {
    SCHEDULE.forEach((event) => {
      expect(event.startTime).toMatch(/^\d{2}:\d{2}$/);
      expect(event.endTime).toMatch(/^\d{2}:\d{2}$/);
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

// ---- Members Tests ----
describe("Members Data", () => {
  it("should have 5 members", () => {
    expect(MEMBERS.length).toBe(5);
  });

  it("should find member by ID", () => {
    const shohei = getMemberById("shohei");
    expect(shohei).toBeDefined();
    expect(shohei!.name).toBe("翔平");
  });

  it("should return everyone member", () => {
    const everyone = getMemberById("everyone");
    expect(everyone).toBeDefined();
    expect(everyone!.name).toBe("全員");
    expect(everyone!.emoji).toBe("🌈");
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

// ---- Days Tests ----
describe("Days Data", () => {
  it("should have 4 days", () => {
    expect(DAYS.length).toBe(4);
  });

  it("should have correct dates", () => {
    expect(DAYS[0].date).toBe("2026-03-19");
    expect(DAYS[3].date).toBe("2026-03-22");
  });

  it("should have sequential indices", () => {
    DAYS.forEach((day, i) => {
      expect(day.index).toBe(i);
    });
  });

  it("each day should have id", () => {
    DAYS.forEach((day) => {
      expect(day.id).toBeTruthy();
    });
  });
});

// ---- generateDays Tests ----
describe("generateDays", () => {
  it("should generate correct number of days", () => {
    const days = generateDays("2026-03-19", "2026-03-22");
    expect(days.length).toBe(4);
  });

  it("should generate single day for same start and end", () => {
    const days = generateDays("2026-05-01", "2026-05-01");
    expect(days.length).toBe(1);
    expect(days[0].date).toBe("2026-05-01");
  });

  it("should have sequential indices", () => {
    const days = generateDays("2026-01-01", "2026-01-05");
    expect(days.length).toBe(5);
    days.forEach((day, i) => {
      expect(day.index).toBe(i);
      expect(day.dayLabel).toBe(`${i + 1}日目`);
    });
  });

  it("should include day of week in label", () => {
    const days = generateDays("2026-03-19", "2026-03-19");
    expect(days[0].label).toContain("木");
  });

  it("each generated day should have id", () => {
    const days = generateDays("2026-06-01", "2026-06-03");
    days.forEach((day) => {
      expect(day.id).toBeTruthy();
    });
  });
});

// ---- Type Structure Tests ----
describe("Type Structures", () => {
  it("ScheduleEvent should support mapInfo with naver", () => {
    const event: ScheduleEvent = {
      id: "test-1",
      dayIndex: 0,
      startTime: "09:00",
      endTime: "10:00",
      title: "Test Event",
      members: ["everyone"],
      mapInfo: { type: "naver", query: "명동" },
    };
    expect(event.mapInfo?.type).toBe("naver");
    expect(event.mapInfo?.query).toBe("명동");
  });

  it("ScheduleEvent should support google map with URL", () => {
    const event: ScheduleEvent = {
      id: "test-2",
      dayIndex: 0,
      startTime: "09:00",
      endTime: "10:00",
      title: "Test Event",
      members: ["everyone"],
      mapInfo: { type: "google", url: "https://maps.google.com/test" },
    };
    expect(event.mapInfo?.type).toBe("google");
    expect(event.mapInfo?.url).toBe("https://maps.google.com/test");
  });

  it("ScheduleEvent should support multiple links", () => {
    const links: EventLink[] = [
      { id: "l1", label: "公式サイト", url: "https://example.com" },
      { id: "l2", label: "予約", url: "https://booking.com" },
    ];
    const event: ScheduleEvent = {
      id: "test-3",
      dayIndex: 0,
      startTime: "09:00",
      endTime: "10:00",
      title: "Test Event",
      members: ["everyone"],
      links,
    };
    expect(event.links?.length).toBe(2);
    expect(event.links?.[0].label).toBe("公式サイト");
  });

  it("PackingItem should have quantity and category", () => {
    const item: PackingItem = {
      id: "pkg-1",
      name: "パスポート",
      checked: false,
      category: "documents",
      quantity: 1,
    };
    expect(item.quantity).toBe(1);
    expect(item.checked).toBe(false);
    expect(item.category).toBe("documents");
  });

  it("Trip should contain all sub-collections", () => {
    const trip: Trip = {
      id: "trip-1",
      name: "韓国旅行",
      emoji: "🇰🇷",
      startDate: "2026-03-19",
      endDate: "2026-03-22",
      days: [],
      events: [],
      members: [],
      packingItems: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(trip.packingItems).toEqual([]);
    expect(trip.members).toEqual([]);
    expect(trip.days).toEqual([]);
    expect(trip.events).toEqual([]);
  });

  it("ScheduleEvent should support sortOrder", () => {
    const event: ScheduleEvent = {
      id: "test-sort",
      dayIndex: 0,
      startTime: "09:00",
      endTime: "10:00",
      title: "Test",
      members: ["everyone"],
      sortOrder: 5,
    };
    expect(event.sortOrder).toBe(5);
  });
});

// ---- Filter Logic Tests ----
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

// ---- Utility Functions Tests ----
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

// ---- CRUD Operations Tests ----
describe("CRUD Operations - Data Validation", () => {
  it("should create a valid event with mapInfo", () => {
    const newEvent: ScheduleEvent = {
      id: "test-crud-1",
      dayIndex: 0,
      startTime: "10:00",
      endTime: "11:00",
      title: "テスト予定",
      members: ["everyone"],
      category: "other",
      note: "テストメモ",
      mapInfo: { type: "naver", query: "명동" },
      location: "テスト場所",
    };
    expect(newEvent.mapInfo?.type).toBe("naver");
    expect(newEvent.location).toBe("テスト場所");
  });

  it("should create a valid member object", () => {
    const newMember: Member = {
      id: "test-member-1",
      name: "テストユーザー",
      emoji: "😎",
      color: "#FF5733",
    };
    expect(newMember.id).toBeTruthy();
    expect(newMember.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
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

// ---- Sort Logic Tests ----
describe("Sort Logic", () => {
  it("should sort by startTime when no sortOrder", () => {
    const events: ScheduleEvent[] = [
      { id: "a", dayIndex: 0, startTime: "12:00", endTime: "13:00", title: "B", members: [] },
      { id: "b", dayIndex: 0, startTime: "09:00", endTime: "10:00", title: "A", members: [] },
    ];
    const sorted = [...events].sort((a, b) => {
      if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
        return a.sortOrder - b.sortOrder;
      }
      return a.startTime.localeCompare(b.startTime);
    });
    expect(sorted[0].id).toBe("b");
  });

  it("should sort by sortOrder when present", () => {
    const events: ScheduleEvent[] = [
      { id: "a", dayIndex: 0, startTime: "09:00", endTime: "10:00", title: "A", members: [], sortOrder: 2 },
      { id: "b", dayIndex: 0, startTime: "12:00", endTime: "13:00", title: "B", members: [], sortOrder: 1 },
    ];
    const sorted = [...events].sort((a, b) => {
      if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
        return a.sortOrder - b.sortOrder;
      }
      return a.startTime.localeCompare(b.startTime);
    });
    expect(sorted[0].id).toBe("b");
  });
});

// ---- Packing Item Tests ----
describe("Packing Items", () => {
  it("should toggle checked state", () => {
    const item: PackingItem = { id: "p1", name: "パスポート", checked: false, quantity: 1 };
    const toggled = { ...item, checked: !item.checked };
    expect(toggled.checked).toBe(true);
  });

  it("should support categories", () => {
    const items: PackingItem[] = [
      { id: "p1", name: "パスポート", checked: false, category: "documents", quantity: 1 },
      { id: "p2", name: "Tシャツ", checked: false, category: "clothes", quantity: 3 },
      { id: "p3", name: "充電器", checked: true, category: "electronics", quantity: 1 },
    ];
    const docs = items.filter((i) => i.category === "documents");
    expect(docs.length).toBe(1);
    const checked = items.filter((i) => i.checked);
    expect(checked.length).toBe(1);
  });

  it("should support quantity", () => {
    const item: PackingItem = { id: "p1", name: "Tシャツ", checked: false, quantity: 3 };
    expect(item.quantity).toBe(3);
    const updated = { ...item, quantity: 5 };
    expect(updated.quantity).toBe(5);
  });
});

// ---- Trip Management Tests ----
describe("Trip Management", () => {
  it("should create a trip with all required fields", () => {
    const trip: Trip = {
      id: "trip-test",
      name: "テスト旅行",
      emoji: "✈️",
      startDate: "2026-06-01",
      endDate: "2026-06-05",
      days: generateDays("2026-06-01", "2026-06-05"),
      events: [],
      members: [],
      packingItems: [],
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };
    expect(trip.days.length).toBe(5);
    expect(trip.name).toBe("テスト旅行");
  });

  it("should add events to a trip", () => {
    const trip: Trip = {
      id: "trip-add",
      name: "追加テスト",
      emoji: "🏖️",
      startDate: "2026-07-01",
      endDate: "2026-07-02",
      days: generateDays("2026-07-01", "2026-07-02"),
      events: [],
      members: [{ id: "m1", name: "テスト", emoji: "😀", color: "#FF0000" }],
      packingItems: [],
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };
    const newEvent: ScheduleEvent = {
      id: "ev-new",
      dayIndex: 0,
      startTime: "10:00",
      endTime: "11:00",
      title: "新しい予定",
      members: ["m1"],
    };
    const updatedTrip = { ...trip, events: [...trip.events, newEvent] };
    expect(updatedTrip.events.length).toBe(1);
    expect(updatedTrip.events[0].title).toBe("新しい予定");
  });

  it("should share trip as text", () => {
    const trip: Trip = {
      id: "trip-share",
      name: "共有テスト",
      emoji: "🌏",
      startDate: "2026-08-01",
      endDate: "2026-08-02",
      days: generateDays("2026-08-01", "2026-08-02"),
      events: [
        { id: "s1", dayIndex: 0, startTime: "09:00", endTime: "10:00", title: "朝食", members: ["everyone"] },
        { id: "s2", dayIndex: 1, startTime: "14:00", endTime: "15:00", title: "観光", members: ["everyone"] },
      ],
      members: [],
      packingItems: [],
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };
    // Simulate share text generation
    const lines: string[] = [`🌏 ${trip.name}`];
    trip.days.forEach((day) => {
      lines.push(`\n--- ${day.dayLabel} (${day.label}) ---`);
      const dayEvents = trip.events.filter((e) => e.dayIndex === day.index);
      dayEvents.forEach((e) => {
        lines.push(`${e.startTime}-${e.endTime} ${e.title}`);
      });
    });
    const shareText = lines.join("\n");
    expect(shareText).toContain("共有テスト");
    expect(shareText).toContain("朝食");
    expect(shareText).toContain("観光");
  });
});
