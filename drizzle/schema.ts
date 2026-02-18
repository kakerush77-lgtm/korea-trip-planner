import {
  boolean,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Users ───
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  points: int("points").default(0).notNull(),
  streak: int("streak").default(0).notNull(),
  lastStreakDate: varchar("lastStreakDate", { length: 10 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Trips (しおり) ───
export const trips = mysqlTable("trips", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  date: varchar("date", { length: 64 }),
  days: int("days").default(1).notNull(),
  cover: varchar("cover", { length: 10 }).default("✈️"),
  color: varchar("color", { length: 20 }).default("#FFE5EC"),
  country: varchar("country", { length: 10 }),
  mapProvider: varchar("mapProvider", { length: 20 }).default("google"),
  budget: json("budget"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Trip = typeof trips.$inferSelect;
export type InsertTrip = typeof trips.$inferInsert;

// ─── Trip Members ───
export const tripMembers = mysqlTable("trip_members", {
  id: int("id").autoincrement().primaryKey(),
  tripId: int("tripId").notNull(),
  userId: int("userId"),
  name: varchar("name", { length: 100 }).notNull(),
  role: mysqlEnum("memberRole", ["owner", "editor", "viewer"]).default("editor").notNull(),
  isCompanion: boolean("isCompanion").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TripMember = typeof tripMembers.$inferSelect;
export type InsertTripMember = typeof tripMembers.$inferInsert;

// ─── Spots (スポット) ───
export const spots = mysqlTable("spots", {
  id: int("id").autoincrement().primaryKey(),
  tripId: int("tripId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  day: int("day").default(1).notNull(),
  time: varchar("time", { length: 10 }).default("09:00"),
  duration: int("duration").default(60),
  category: varchar("category", { length: 50 }),
  note: text("note"),
  address: text("address"),
  lat: varchar("lat", { length: 20 }),
  lng: varchar("lng", { length: 20 }),
  transport: json("transport"),
  reservation: json("reservation"),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Spot = typeof spots.$inferSelect;
export type InsertSpot = typeof spots.$inferInsert;

// ─── Splits (割り勘) ───
export const splits = mysqlTable("splits", {
  id: int("id").autoincrement().primaryKey(),
  tripId: int("tripId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  amount: int("amount").notNull(),
  paidBy: varchar("paidBy", { length: 100 }).notNull(),
  members: json("members").notNull(),
  category: varchar("category", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Split = typeof splits.$inferSelect;
export type InsertSplit = typeof splits.$inferInsert;

// ─── Lists (買い物/持ち物/リンク/行きたい場所) ───
export const listItems = mysqlTable("list_items", {
  id: int("id").autoincrement().primaryKey(),
  tripId: int("tripId").notNull(),
  listType: mysqlEnum("listType", ["shopping", "packing", "links", "places"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  checked: boolean("checked").default(false).notNull(),
  url: text("url"),
  assignees: json("assignees"),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ListItem = typeof listItems.$inferSelect;
export type InsertListItem = typeof listItems.$inferInsert;
