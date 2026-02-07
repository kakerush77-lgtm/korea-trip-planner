import { createContext, useContext, useReducer, useEffect, useMemo, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScheduleEvent, Member, MemberId, Trip, DayInfo, PackingItem, EventLink, MapInfo, LinkItem, ShoppingItem } from "@/data/types";
import { SCHEDULE } from "@/data/schedule";
import { MEMBERS as DEFAULT_MEMBERS } from "@/data/members";
import { DAYS } from "@/data/days";

const STORAGE_KEY = "@korea_trip_v2";
const STORAGE_KEY_CURRENT = "@korea_trip_current_id";

// ---- Helpers ----
function genId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function getDayOfWeek(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
}

export function generateDays(startDate: string, endDate: string): DayInfo[] {
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  const days: DayInfo[] = [];
  let idx = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const y = cur.getFullYear();
    const m = cur.getMonth() + 1;
    const d = cur.getDate();
    const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dow = getDayOfWeek(dateStr);
    days.push({
      id: `day-${idx}`,
      index: idx,
      date: dateStr,
      label: `${m}/${d}(${dow})`,
      dayLabel: `${idx + 1}日目`,
    });
    cur.setDate(cur.getDate() + 1);
    idx++;
  }
  return days;
}

function migrateOldData(events: ScheduleEvent[]): ScheduleEvent[] {
  return events.map((e) => {
    if (e.naverQuery && !e.mapInfo) {
      return { ...e, mapInfo: { type: "naver" as const, query: e.naverQuery } };
    }
    return e;
  });
}

function ensureTripFields(trip: any): Trip {
  return {
    ...trip,
    packingItems: trip.packingItems ?? [],
    linkItems: trip.linkItems ?? [],
    shoppingItems: trip.shoppingItems ?? [],
  };
}

// ---- State ----
interface AppState {
  trips: Trip[];
  currentTripId: string | null;
  isLoaded: boolean;
}

// ---- Actions ----
type AppAction =
  | { type: "LOAD_DATA"; trips: Trip[]; currentTripId: string | null }
  | { type: "SET_CURRENT_TRIP"; tripId: string }
  | { type: "ADD_TRIP"; trip: Trip }
  | { type: "UPDATE_TRIP"; trip: Trip }
  | { type: "DELETE_TRIP"; tripId: string }
  | { type: "IMPORT_TRIP"; trip: Trip }
  | { type: "ADD_EVENT"; tripId: string; event: ScheduleEvent }
  | { type: "UPDATE_EVENT"; tripId: string; event: ScheduleEvent }
  | { type: "DELETE_EVENT"; tripId: string; eventId: string }
  | { type: "REORDER_EVENTS"; tripId: string; dayIndex: number; eventIds: string[] }
  | { type: "ADD_DAY"; tripId: string; day: DayInfo }
  | { type: "DELETE_DAY"; tripId: string; dayIndex: number }
  | { type: "ADD_MEMBER"; tripId: string; member: Member }
  | { type: "UPDATE_MEMBER"; tripId: string; member: Member }
  | { type: "DELETE_MEMBER"; tripId: string; memberId: string }
  | { type: "ADD_PACKING_ITEM"; tripId: string; item: PackingItem }
  | { type: "UPDATE_PACKING_ITEM"; tripId: string; item: PackingItem }
  | { type: "DELETE_PACKING_ITEM"; tripId: string; itemId: string }
  | { type: "TOGGLE_PACKING_ITEM"; tripId: string; itemId: string }
  | { type: "ADD_LINK_ITEM"; tripId: string; item: LinkItem }
  | { type: "UPDATE_LINK_ITEM"; tripId: string; item: LinkItem }
  | { type: "DELETE_LINK_ITEM"; tripId: string; itemId: string }
  | { type: "TOGGLE_LINK_ITEM"; tripId: string; itemId: string }
  | { type: "ADD_SHOPPING_ITEM"; tripId: string; item: ShoppingItem }
  | { type: "UPDATE_SHOPPING_ITEM"; tripId: string; item: ShoppingItem }
  | { type: "DELETE_SHOPPING_ITEM"; tripId: string; itemId: string }
  | { type: "TOGGLE_SHOPPING_ITEM"; tripId: string; itemId: string };

function updateTripInState(state: AppState, tripId: string, updater: (trip: Trip) => Trip): AppState {
  return {
    ...state,
    trips: state.trips.map((t) => (t.id === tripId ? { ...updater(t), updatedAt: new Date().toISOString() } : t)),
  };
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "LOAD_DATA":
      return { ...state, trips: action.trips.map(ensureTripFields), currentTripId: action.currentTripId, isLoaded: true };
    case "SET_CURRENT_TRIP":
      return { ...state, currentTripId: action.tripId };
    case "ADD_TRIP":
      return { ...state, trips: [...state.trips, action.trip], currentTripId: action.trip.id };
    case "UPDATE_TRIP":
      return { ...state, trips: state.trips.map((t) => (t.id === action.trip.id ? action.trip : t)) };
    case "DELETE_TRIP": {
      const remaining = state.trips.filter((t) => t.id !== action.tripId);
      return {
        ...state,
        trips: remaining,
        currentTripId: state.currentTripId === action.tripId ? (remaining[0]?.id ?? null) : state.currentTripId,
      };
    }
    case "IMPORT_TRIP":
      return { ...state, trips: [...state.trips, action.trip], currentTripId: action.trip.id };
    case "ADD_EVENT":
      return updateTripInState(state, action.tripId, (t) => ({ ...t, events: [...t.events, action.event] }));
    case "UPDATE_EVENT":
      return updateTripInState(state, action.tripId, (t) => ({
        ...t,
        events: t.events.map((e) => (e.id === action.event.id ? action.event : e)),
      }));
    case "DELETE_EVENT":
      return updateTripInState(state, action.tripId, (t) => ({
        ...t,
        events: t.events.filter((e) => e.id !== action.eventId),
      }));
    case "REORDER_EVENTS":
      return updateTripInState(state, action.tripId, (t) => ({
        ...t,
        events: t.events.map((e) => {
          if (e.dayIndex !== action.dayIndex) return e;
          const idx = action.eventIds.indexOf(e.id);
          return idx >= 0 ? { ...e, sortOrder: idx } : e;
        }),
      }));
    case "ADD_DAY":
      return updateTripInState(state, action.tripId, (t) => ({ ...t, days: [...t.days, action.day] }));
    case "DELETE_DAY":
      return updateTripInState(state, action.tripId, (t) => ({
        ...t,
        days: t.days.filter((d) => d.index !== action.dayIndex).map((d, i) => ({
          ...d,
          index: i,
          dayLabel: `${i + 1}日目`,
        })),
        events: t.events
          .filter((e) => e.dayIndex !== action.dayIndex)
          .map((e) => ({
            ...e,
            dayIndex: e.dayIndex > action.dayIndex ? e.dayIndex - 1 : e.dayIndex,
          })),
      }));
    case "ADD_MEMBER":
      return updateTripInState(state, action.tripId, (t) => ({ ...t, members: [...t.members, action.member] }));
    case "UPDATE_MEMBER":
      return updateTripInState(state, action.tripId, (t) => ({
        ...t,
        members: t.members.map((m) => (m.id === action.member.id ? action.member : m)),
      }));
    case "DELETE_MEMBER":
      return updateTripInState(state, action.tripId, (t) => ({
        ...t,
        members: t.members.filter((m) => m.id !== action.memberId),
        events: t.events.map((e) => ({
          ...e,
          members: e.members.filter((mid) => mid !== action.memberId),
        })),
      }));
    case "ADD_PACKING_ITEM":
      return updateTripInState(state, action.tripId, (t) => ({
        ...t,
        packingItems: [...t.packingItems, action.item],
      }));
    case "UPDATE_PACKING_ITEM":
      return updateTripInState(state, action.tripId, (t) => ({
        ...t,
        packingItems: t.packingItems.map((i) => (i.id === action.item.id ? action.item : i)),
      }));
    case "DELETE_PACKING_ITEM":
      return updateTripInState(state, action.tripId, (t) => ({
        ...t,
        packingItems: t.packingItems.filter((i) => i.id !== action.itemId),
      }));
    case "TOGGLE_PACKING_ITEM":
      return updateTripInState(state, action.tripId, (t) => ({
        ...t,
        packingItems: t.packingItems.map((i) =>
          i.id === action.itemId ? { ...i, checked: !i.checked } : i
        ),
      }));
    // Link
    case "ADD_LINK_ITEM":
      return updateTripInState(state, action.tripId, (t) => ({
        ...t,
        linkItems: [...t.linkItems, action.item],
      }));
    case "UPDATE_LINK_ITEM":
      return updateTripInState(state, action.tripId, (t) => ({
        ...t,
        linkItems: t.linkItems.map((i) => (i.id === action.item.id ? action.item : i)),
      }));
    case "DELETE_LINK_ITEM":
      return updateTripInState(state, action.tripId, (t) => ({
        ...t,
        linkItems: t.linkItems.filter((i) => i.id !== action.itemId),
      }));
    case "TOGGLE_LINK_ITEM":
      // LinkItem does not have checked field, no-op
      return state;
    // Shopping
    case "ADD_SHOPPING_ITEM":
      return updateTripInState(state, action.tripId, (t) => ({
        ...t,
        shoppingItems: [...t.shoppingItems, action.item],
      }));
    case "UPDATE_SHOPPING_ITEM":
      return updateTripInState(state, action.tripId, (t) => ({
        ...t,
        shoppingItems: t.shoppingItems.map((i) => (i.id === action.item.id ? action.item : i)),
      }));
    case "DELETE_SHOPPING_ITEM":
      return updateTripInState(state, action.tripId, (t) => ({
        ...t,
        shoppingItems: t.shoppingItems.filter((i) => i.id !== action.itemId),
      }));
    case "TOGGLE_SHOPPING_ITEM":
      return updateTripInState(state, action.tripId, (t) => ({
        ...t,
        shoppingItems: t.shoppingItems.map((i) =>
          i.id === action.itemId ? { ...i, bought: !i.bought } : i
        ),
      }));
    default:
      return state;
  }
}

// ---- Context ----
interface AppContextType {
  state: AppState;
  currentTrip: Trip | null;
  setCurrentTrip: (tripId: string) => void;
  addTrip: (data: { name: string; emoji: string; startDate: string; endDate: string }) => string;
  updateTrip: (trip: Trip) => void;
  deleteTrip: (tripId: string) => void;
  importTrip: (tripData: any) => void;
  addEvent: (event: Omit<ScheduleEvent, "id">) => void;
  updateEvent: (event: ScheduleEvent) => void;
  deleteEvent: (eventId: string) => void;
  reorderEvents: (dayIndex: number, eventIds: string[]) => void;
  addDay: (date?: string) => void;
  deleteDay: (dayIndex: number) => void;
  addMember: (member: Omit<Member, "id">) => void;
  updateMember: (member: Member) => void;
  deleteMember: (memberId: string) => void;
  addPackingItem: (item: Omit<PackingItem, "id">) => void;
  updatePackingItem: (item: PackingItem) => void;
  deletePackingItem: (itemId: string) => void;
  togglePackingItem: (itemId: string) => void;
  addLinkItem: (item: Omit<LinkItem, "id">) => void;
  updateLinkItem: (item: LinkItem) => void;
  deleteLinkItem: (itemId: string) => void;
  toggleLinkItem: (itemId: string) => void;
  addShoppingItem: (item: Omit<ShoppingItem, "id">) => void;
  updateShoppingItem: (item: ShoppingItem) => void;
  deleteShoppingItem: (itemId: string) => void;
  toggleShoppingItem: (itemId: string) => void;
  exportTripText: () => string;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, {
    trips: [],
    currentTripId: null,
    isLoaded: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  // Persist
  useEffect(() => {
    if (state.isLoaded) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state.trips));
      if (state.currentTripId) {
        AsyncStorage.setItem(STORAGE_KEY_CURRENT, state.currentTripId);
      }
    }
  }, [state.trips, state.currentTripId, state.isLoaded]);

  async function loadData() {
    try {
      const tripsJson = await AsyncStorage.getItem(STORAGE_KEY);
      const currentId = await AsyncStorage.getItem(STORAGE_KEY_CURRENT);

      if (tripsJson) {
        const trips: Trip[] = JSON.parse(tripsJson);
        dispatch({ type: "LOAD_DATA", trips, currentTripId: currentId || trips[0]?.id || null });
      } else {
        const oldInitialized = await AsyncStorage.getItem("@korea_trip_initialized");
        let events = SCHEDULE;
        let members = DEFAULT_MEMBERS;

        if (oldInitialized) {
          const oldEventsJson = await AsyncStorage.getItem("@korea_trip_schedule");
          const oldMembersJson = await AsyncStorage.getItem("@korea_trip_members");
          if (oldEventsJson) events = JSON.parse(oldEventsJson);
          if (oldMembersJson) members = JSON.parse(oldMembersJson);
        }

        const defaultTrip: Trip = {
          id: genId("trip"),
          name: "韓国旅行 2026",
          emoji: "🇰🇷",
          startDate: "2026-03-19",
          endDate: "2026-03-22",
          days: DAYS,
          events: migrateOldData(events),
          members,
          packingItems: [],
          linkItems: [],
          shoppingItems: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        dispatch({ type: "LOAD_DATA", trips: [defaultTrip], currentTripId: defaultTrip.id });
      }
    } catch {
      const defaultTrip: Trip = {
        id: genId("trip"),
        name: "韓国旅行 2026",
        emoji: "🇰🇷",
        startDate: "2026-03-19",
        endDate: "2026-03-22",
        days: DAYS,
        events: migrateOldData(SCHEDULE),
        members: DEFAULT_MEMBERS,
        packingItems: [],
        linkItems: [],
        shoppingItems: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      dispatch({ type: "LOAD_DATA", trips: [defaultTrip], currentTripId: defaultTrip.id });
    }
  }

  const currentTrip = useMemo(() => {
    return state.trips.find((t) => t.id === state.currentTripId) ?? null;
  }, [state.trips, state.currentTripId]);

  const tripId = state.currentTripId ?? "";

  const setCurrentTrip = useCallback((id: string) => {
    dispatch({ type: "SET_CURRENT_TRIP", tripId: id });
  }, []);

  const addTrip = useCallback((data: { name: string; emoji: string; startDate: string; endDate: string }) => {
    const days = generateDays(data.startDate, data.endDate);
    const trip: Trip = {
      id: genId("trip"),
      name: data.name,
      emoji: data.emoji,
      startDate: data.startDate,
      endDate: data.endDate,
      days,
      events: [],
      members: [],
      packingItems: [],
      linkItems: [],
      shoppingItems: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dispatch({ type: "ADD_TRIP", trip });
    return trip.id;
  }, []);

  const updateTripAction = useCallback((trip: Trip) => {
    dispatch({ type: "UPDATE_TRIP", trip });
  }, []);

  const deleteTrip = useCallback((id: string) => {
    dispatch({ type: "DELETE_TRIP", tripId: id });
  }, []);

  const importTrip = useCallback((tripData: any) => {
    const newTrip: Trip = {
      id: genId("trip"),
      name: tripData.name ?? "取り込んだ旅行",
      emoji: tripData.emoji ?? "✈️",
      startDate: tripData.startDate ?? "",
      endDate: tripData.endDate ?? "",
      days: tripData.days ?? [],
      events: (tripData.events ?? []).map((e: any) => ({ ...e, id: genId("evt") })),
      members: (tripData.members ?? []).map((m: any) => ({ ...m, id: genId("mbr") })),
      packingItems: (tripData.packingItems ?? []).map((i: any) => ({ ...i, id: genId("pkg") })),
      linkItems: (tripData.linkItems ?? []).map((i: any) => ({ ...i, id: genId("wsh") })),
      shoppingItems: (tripData.shoppingItems ?? []).map((i: any) => ({ ...i, id: genId("shp") })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dispatch({ type: "IMPORT_TRIP", trip: newTrip });
  }, []);

  const addEvent = useCallback((eventData: Omit<ScheduleEvent, "id">) => {
    const event: ScheduleEvent = { ...eventData, id: genId("evt") };
    dispatch({ type: "ADD_EVENT", tripId, event });
  }, [tripId]);

  const updateEvent = useCallback((event: ScheduleEvent) => {
    dispatch({ type: "UPDATE_EVENT", tripId, event });
  }, [tripId]);

  const deleteEvent = useCallback((eventId: string) => {
    dispatch({ type: "DELETE_EVENT", tripId, eventId });
  }, [tripId]);

  const reorderEvents = useCallback((dayIndex: number, eventIds: string[]) => {
    dispatch({ type: "REORDER_EVENTS", tripId, dayIndex, eventIds });
  }, [tripId]);

  const addDay = useCallback((date?: string) => {
    if (!currentTrip) return;
    let dateStr: string;
    if (date) {
      dateStr = date;
    } else {
      const lastDay = currentTrip.days[currentTrip.days.length - 1];
      const lastDate = new Date(lastDay.date + "T00:00:00");
      lastDate.setDate(lastDate.getDate() + 1);
      const y = lastDate.getFullYear();
      const m = lastDate.getMonth() + 1;
      const d = lastDate.getDate();
      dateStr = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
    const parsed = new Date(dateStr + "T00:00:00");
    const mo = parsed.getMonth() + 1;
    const da = parsed.getDate();
    const dow = getDayOfWeek(dateStr);
    const newIdx = currentTrip.days.length;
    const newDay: DayInfo = {
      id: `day-${newIdx}`,
      index: newIdx,
      date: dateStr,
      label: `${mo}/${da}(${dow})`,
      dayLabel: `${newIdx + 1}日目`,
    };
    dispatch({ type: "ADD_DAY", tripId, day: newDay });
  }, [tripId, currentTrip]);

  const deleteDay = useCallback((dayIndex: number) => {
    dispatch({ type: "DELETE_DAY", tripId, dayIndex });
  }, [tripId]);

  const addMember = useCallback((memberData: Omit<Member, "id">) => {
    const member: Member = { ...memberData, id: genId("mbr") as MemberId };
    dispatch({ type: "ADD_MEMBER", tripId, member });
  }, [tripId]);

  const updateMember = useCallback((member: Member) => {
    dispatch({ type: "UPDATE_MEMBER", tripId, member });
  }, [tripId]);

  const deleteMember = useCallback((memberId: string) => {
    dispatch({ type: "DELETE_MEMBER", tripId, memberId });
  }, [tripId]);

  const addPackingItem = useCallback((itemData: Omit<PackingItem, "id">) => {
    const item: PackingItem = { ...itemData, id: genId("pkg") };
    dispatch({ type: "ADD_PACKING_ITEM", tripId, item });
  }, [tripId]);

  const updatePackingItem = useCallback((item: PackingItem) => {
    dispatch({ type: "UPDATE_PACKING_ITEM", tripId, item });
  }, [tripId]);

  const deletePackingItem = useCallback((itemId: string) => {
    dispatch({ type: "DELETE_PACKING_ITEM", tripId, itemId });
  }, [tripId]);

  const togglePackingItem = useCallback((itemId: string) => {
    dispatch({ type: "TOGGLE_PACKING_ITEM", tripId, itemId });
  }, [tripId]);

  // Link
  const addLinkItem = useCallback((itemData: Omit<LinkItem, "id">) => {
    const item: LinkItem = { ...itemData, id: genId("wsh") };
    dispatch({ type: "ADD_LINK_ITEM", tripId, item });
  }, [tripId]);

  const updateLinkItem = useCallback((item: LinkItem) => {
    dispatch({ type: "UPDATE_LINK_ITEM", tripId, item });
  }, [tripId]);

  const deleteLinkItem = useCallback((itemId: string) => {
    dispatch({ type: "DELETE_LINK_ITEM", tripId, itemId });
  }, [tripId]);

  const toggleLinkItem = useCallback((itemId: string) => {
    dispatch({ type: "TOGGLE_LINK_ITEM", tripId, itemId });
  }, [tripId]);

  // Shopping
  const addShoppingItem = useCallback((itemData: Omit<ShoppingItem, "id">) => {
    const item: ShoppingItem = { ...itemData, id: genId("shp") };
    dispatch({ type: "ADD_SHOPPING_ITEM", tripId, item });
  }, [tripId]);

  const updateShoppingItem = useCallback((item: ShoppingItem) => {
    dispatch({ type: "UPDATE_SHOPPING_ITEM", tripId, item });
  }, [tripId]);

  const deleteShoppingItem = useCallback((itemId: string) => {
    dispatch({ type: "DELETE_SHOPPING_ITEM", tripId, itemId });
  }, [tripId]);

  const toggleShoppingItem = useCallback((itemId: string) => {
    dispatch({ type: "TOGGLE_SHOPPING_ITEM", tripId, itemId });
  }, [tripId]);

  const exportTripText = useCallback(() => {
    if (!currentTrip) return "";
    let text = `${currentTrip.emoji} ${currentTrip.name}\n`;
    text += `${currentTrip.startDate} 〜 ${currentTrip.endDate}\n\n`;

    for (const day of currentTrip.days) {
      text += `★☆★ ${day.dayLabel} ${day.label} ★☆★\n`;
      const dayEvents = currentTrip.events
        .filter((e) => e.dayIndex === day.index)
        .sort((a, b) => {
          if (a.sortOrder !== undefined && b.sortOrder !== undefined) return a.sortOrder - b.sortOrder;
          return a.startTime.localeCompare(b.startTime);
        });

      for (const evt of dayEvents) {
        const memberNames = evt.members.includes("everyone")
          ? "全員"
          : evt.members
              .map((mid) => currentTrip.members.find((m) => m.id === mid)?.name ?? mid)
              .join(", ");
        text += `[${evt.startTime}-${evt.endTime}] ${evt.title}`;
        if (memberNames) text += ` (${memberNames})`;
        text += "\n";
        if (evt.note) text += `  📝 ${evt.note}\n`;
        if (evt.mapInfo?.url) text += `  🗺️ ${evt.mapInfo.url}\n`;
        if (evt.links?.length) {
          for (const link of evt.links) {
            text += `  🔗 ${link.label}: ${link.url}\n`;
          }
        }
      }
      text += "\n";
    }

    if (currentTrip.packingItems.length > 0) {
      text += "📦 持ち物リスト\n";
      for (const item of currentTrip.packingItems) {
        text += `${item.checked ? "✅" : "⬜"} ${item.name}${item.quantity > 1 ? ` ×${item.quantity}` : ""}\n`;
      }
      text += "\n";
    }

    if (currentTrip.linkItems.length > 0) {
      text += "🔗 リンク集\n";
      for (const item of currentTrip.linkItems) {
        text += `${item.title}${item.note ? ` - ${item.note}` : ""}\n${item.url}\n`;
      }
      text += "\n";
    }

    if (currentTrip.shoppingItems.length > 0) {
      text += "🛒 買いたいもの\n";
      for (const item of currentTrip.shoppingItems) {
        text += `${item.bought ? "✅" : "⬜"} ${item.name}${item.quantity > 1 ? ` ×${item.quantity}` : ""}${item.price ? ` ${item.price}` : ""}\n`;
      }
    }

    return text;
  }, [currentTrip]);

  const contextValue = useMemo(
    () => ({
      state,
      currentTrip,
      setCurrentTrip,
      addTrip,
      updateTrip: updateTripAction,
      deleteTrip,
      importTrip,
      addEvent,
      updateEvent,
      deleteEvent,
      reorderEvents,
      addDay,
      deleteDay,
      addMember,
      updateMember,
      deleteMember,
      addPackingItem,
      updatePackingItem,
      deletePackingItem,
      togglePackingItem,
      addLinkItem,
      updateLinkItem,
      deleteLinkItem,
      toggleLinkItem,
      addShoppingItem,
      updateShoppingItem,
      deleteShoppingItem,
      toggleShoppingItem,
      exportTripText,
    }),
    [state, currentTrip, setCurrentTrip, addTrip, updateTripAction, deleteTrip, importTrip, addEvent, updateEvent, deleteEvent, reorderEvents, addDay, deleteDay, addMember, updateMember, deleteMember, addPackingItem, updatePackingItem, deletePackingItem, togglePackingItem, addLinkItem, updateLinkItem, deleteLinkItem, toggleLinkItem, addShoppingItem, updateShoppingItem, deleteShoppingItem, toggleShoppingItem, exportTripText]
  );

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}

export function useAppStore() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppStore must be used within AppProvider");
  }
  return context;
}
