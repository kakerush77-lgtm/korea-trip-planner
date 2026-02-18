import { and, eq, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  trips,
  InsertTrip,
  Trip,
  tripMembers,
  InsertTripMember,
  spots,
  InsertSpot,
  splits,
  InsertSplit,
  listItems,
  InsertListItem,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── User Queries ───

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Trip Queries ───

export async function getUserTrips(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(trips).where(eq(trips.userId, userId)).orderBy(desc(trips.createdAt));
}

export async function getTripById(tripId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(trips).where(eq(trips.id, tripId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createTrip(data: InsertTrip) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(trips).values(data).$returningId();
  return result.id;
}

export async function updateTrip(id: number, data: Partial<InsertTrip>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(trips).set(data).where(eq(trips.id, id));
}

export async function deleteTrip(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Delete related data first
  await db.delete(spots).where(eq(spots.tripId, id));
  await db.delete(splits).where(eq(splits.tripId, id));
  await db.delete(listItems).where(eq(listItems.tripId, id));
  await db.delete(tripMembers).where(eq(tripMembers.tripId, id));
  await db.delete(trips).where(eq(trips.id, id));
}

// ─── Trip Members ───

export async function getTripMembers(tripId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tripMembers).where(eq(tripMembers.tripId, tripId));
}

export async function addTripMember(data: InsertTripMember) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(tripMembers).values(data).$returningId();
  return result.id;
}

export async function removeTripMember(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(tripMembers).where(eq(tripMembers.id, id));
}

// ─── Spot Queries ───

export async function getTripSpots(tripId: number, day?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(spots.tripId, tripId)];
  if (day !== undefined) conditions.push(eq(spots.day, day));
  return db.select().from(spots).where(and(...conditions)).orderBy(asc(spots.sortOrder), asc(spots.time));
}

export async function createSpot(data: InsertSpot) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(spots).values(data).$returningId();
  return result.id;
}

export async function updateSpot(id: number, data: Partial<InsertSpot>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(spots).set(data).where(eq(spots.id, id));
}

export async function deleteSpot(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(spots).where(eq(spots.id, id));
}

// ─── Split Queries ───

export async function getTripSplits(tripId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(splits).where(eq(splits.tripId, tripId)).orderBy(desc(splits.createdAt));
}

export async function createSplit(data: InsertSplit) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(splits).values(data).$returningId();
  return result.id;
}

export async function deleteSplit(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(splits).where(eq(splits.id, id));
}

// ─── List Items ───

export async function getTripListItems(tripId: number, listType: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(listItems)
    .where(and(eq(listItems.tripId, tripId), eq(listItems.listType, listType as any)))
    .orderBy(asc(listItems.sortOrder));
}

export async function createListItem(data: InsertListItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(listItems).values(data).$returningId();
  return result.id;
}

export async function updateListItem(id: number, data: Partial<InsertListItem>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(listItems).set(data).where(eq(listItems.id, id));
}

export async function deleteListItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(listItems).where(eq(listItems.id, id));
}
