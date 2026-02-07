import React, { createContext, useContext, useEffect, useReducer, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScheduleEvent, Member, MemberId } from "@/data/types";
import { SCHEDULE } from "@/data/schedule";
import { MEMBERS as DEFAULT_MEMBERS } from "@/data/members";

// ---- Storage Keys ----
const STORAGE_KEYS = {
  SCHEDULE: "@korea_trip_schedule",
  MEMBERS: "@korea_trip_members",
  INITIALIZED: "@korea_trip_initialized",
};

// ---- State ----
interface AppState {
  events: ScheduleEvent[];
  members: Member[];
  isLoaded: boolean;
}

// ---- Actions ----
type AppAction =
  | { type: "LOAD_DATA"; events: ScheduleEvent[]; members: Member[] }
  | { type: "ADD_EVENT"; event: ScheduleEvent }
  | { type: "UPDATE_EVENT"; event: ScheduleEvent }
  | { type: "DELETE_EVENT"; eventId: string }
  | { type: "ADD_MEMBER"; member: Member }
  | { type: "UPDATE_MEMBER"; member: Member }
  | { type: "DELETE_MEMBER"; memberId: string };

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "LOAD_DATA":
      return { ...state, events: action.events, members: action.members, isLoaded: true };
    case "ADD_EVENT":
      return { ...state, events: [...state.events, action.event] };
    case "UPDATE_EVENT":
      return {
        ...state,
        events: state.events.map((e) => (e.id === action.event.id ? action.event : e)),
      };
    case "DELETE_EVENT":
      return { ...state, events: state.events.filter((e) => e.id !== action.eventId) };
    case "ADD_MEMBER":
      return { ...state, members: [...state.members, action.member] };
    case "UPDATE_MEMBER":
      return {
        ...state,
        members: state.members.map((m) => (m.id === action.member.id ? action.member : m)),
      };
    case "DELETE_MEMBER":
      return {
        ...state,
        members: state.members.filter((m) => m.id !== action.memberId),
        events: state.events.map((e) => ({
          ...e,
          members: e.members.filter((mid) => mid !== action.memberId),
        })),
      };
    default:
      return state;
  }
}

// ---- Context ----
interface AppContextType {
  state: AppState;
  addEvent: (event: Omit<ScheduleEvent, "id">) => void;
  updateEvent: (event: ScheduleEvent) => void;
  deleteEvent: (eventId: string) => void;
  addMember: (member: Omit<Member, "id">) => void;
  updateMember: (member: Member) => void;
  deleteMember: (memberId: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

// ---- Provider ----
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, {
    events: [],
    members: [],
    isLoaded: false,
  });

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Persist events whenever they change
  useEffect(() => {
    if (state.isLoaded) {
      AsyncStorage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(state.events));
    }
  }, [state.events, state.isLoaded]);

  // Persist members whenever they change
  useEffect(() => {
    if (state.isLoaded) {
      AsyncStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(state.members));
    }
  }, [state.members, state.isLoaded]);

  async function loadData() {
    try {
      const initialized = await AsyncStorage.getItem(STORAGE_KEYS.INITIALIZED);
      if (!initialized) {
        // First launch: use default data
        await AsyncStorage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(SCHEDULE));
        await AsyncStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(DEFAULT_MEMBERS));
        await AsyncStorage.setItem(STORAGE_KEYS.INITIALIZED, "true");
        dispatch({ type: "LOAD_DATA", events: SCHEDULE, members: DEFAULT_MEMBERS });
      } else {
        const eventsJson = await AsyncStorage.getItem(STORAGE_KEYS.SCHEDULE);
        const membersJson = await AsyncStorage.getItem(STORAGE_KEYS.MEMBERS);
        const events = eventsJson ? JSON.parse(eventsJson) : SCHEDULE;
        const members = membersJson ? JSON.parse(membersJson) : DEFAULT_MEMBERS;
        dispatch({ type: "LOAD_DATA", events, members });
      }
    } catch {
      dispatch({ type: "LOAD_DATA", events: SCHEDULE, members: DEFAULT_MEMBERS });
    }
  }

  const addEvent = useCallback((eventData: Omit<ScheduleEvent, "id">) => {
    const event: ScheduleEvent = {
      ...eventData,
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    };
    dispatch({ type: "ADD_EVENT", event });
  }, []);

  const updateEvent = useCallback((event: ScheduleEvent) => {
    dispatch({ type: "UPDATE_EVENT", event });
  }, []);

  const deleteEvent = useCallback((eventId: string) => {
    dispatch({ type: "DELETE_EVENT", eventId });
  }, []);

  const addMember = useCallback((memberData: Omit<Member, "id">) => {
    const member: Member = {
      ...memberData,
      id: `mbr-${Date.now()}` as MemberId,
    };
    dispatch({ type: "ADD_MEMBER", member });
  }, []);

  const updateMember = useCallback((member: Member) => {
    dispatch({ type: "UPDATE_MEMBER", member });
  }, []);

  const deleteMember = useCallback((memberId: string) => {
    dispatch({ type: "DELETE_MEMBER", memberId });
  }, []);

  const contextValue = useMemo(
    () => ({ state, addEvent, updateEvent, deleteEvent, addMember, updateMember, deleteMember }),
    [state, addEvent, updateEvent, deleteEvent, addMember, updateMember, deleteMember]
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
