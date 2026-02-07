import { describe, it, expect } from "vitest";
import { SCHEDULE } from "../data/schedule";
import { MEMBERS, getMemberById, getMemberColor, EVERYONE_MEMBER } from "../data/members";
import { DAYS } from "../data/days";

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
    const day1 = SCHEDULE.filter((e) => e.dayIndex === 0);
    expect(day1.length).toBe(11);
  });

  it("Day 2 should have 12 events", () => {
    const day2 = SCHEDULE.filter((e) => e.dayIndex === 1);
    expect(day2.length).toBe(12);
  });

  it("Day 3 should have 11 events", () => {
    const day3 = SCHEDULE.filter((e) => e.dayIndex === 2);
    expect(day3.length).toBe(11);
  });

  it("Day 4 should have 7 events", () => {
    const day4 = SCHEDULE.filter((e) => e.dayIndex === 3);
    expect(day4.length).toBe(7);
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
});
