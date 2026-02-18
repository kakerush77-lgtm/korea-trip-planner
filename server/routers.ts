import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Trips ───
  trips: router({
    list: protectedProcedure.query(({ ctx }) => {
      return db.getUserTrips(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const trip = await db.getTripById(input.id);
        if (!trip || trip.userId !== ctx.user.id) {
          return null;
        }
        return trip;
      }),

    create: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1).max(255),
          date: z.string().optional(),
          days: z.number().min(1).max(30).default(1),
          cover: z.string().max(10).default("✈️"),
          color: z.string().max(20).default("#FFE5EC"),
          country: z.string().max(10).optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const tripId = await db.createTrip({
          userId: ctx.user.id,
          title: input.title,
          date: input.date,
          days: input.days,
          cover: input.cover,
          color: input.color,
          country: input.country,
        });
        // Add creator as owner member
        await db.addTripMember({
          tripId,
          userId: ctx.user.id,
          name: ctx.user.name || "オーナー",
          role: "owner",
        });
        return { id: tripId };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().min(1).max(255).optional(),
          date: z.string().optional(),
          days: z.number().min(1).max(30).optional(),
          cover: z.string().max(10).optional(),
          color: z.string().max(20).optional(),
          country: z.string().max(10).optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const trip = await db.getTripById(input.id);
        if (!trip || trip.userId !== ctx.user.id) {
          throw new Error("Trip not found or access denied");
        }
        const { id, ...data } = input;
        await db.updateTrip(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const trip = await db.getTripById(input.id);
        if (!trip || trip.userId !== ctx.user.id) {
          throw new Error("Trip not found or access denied");
        }
        await db.deleteTrip(input.id);
        return { success: true };
      }),
  }),

  // ─── Trip Members ───
  members: router({
    list: protectedProcedure
      .input(z.object({ tripId: z.number() }))
      .query(({ input }) => db.getTripMembers(input.tripId)),

    add: protectedProcedure
      .input(
        z.object({
          tripId: z.number(),
          name: z.string().min(1).max(100),
          isCompanion: z.boolean().default(false),
        }),
      )
      .mutation(({ input }) =>
        db.addTripMember({
          tripId: input.tripId,
          name: input.name,
          isCompanion: input.isCompanion,
        }),
      ),

    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.removeTripMember(input.id)),
  }),

  // ─── Spots ───
  spots: router({
    list: protectedProcedure
      .input(z.object({ tripId: z.number(), day: z.number().optional() }))
      .query(({ input }) => db.getTripSpots(input.tripId, input.day)),

    create: protectedProcedure
      .input(
        z.object({
          tripId: z.number(),
          name: z.string().min(1).max(255),
          day: z.number().default(1),
          time: z.string().max(10).default("09:00"),
          duration: z.number().default(60),
          category: z.string().max(50).optional(),
          note: z.string().optional(),
          address: z.string().optional(),
          lat: z.string().max(20).optional(),
          lng: z.string().max(20).optional(),
        }),
      )
      .mutation(({ input }) => db.createSpot(input)),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).max(255).optional(),
          day: z.number().optional(),
          time: z.string().max(10).optional(),
          duration: z.number().optional(),
          category: z.string().max(50).optional(),
          note: z.string().optional(),
          address: z.string().optional(),
          lat: z.string().max(20).optional(),
          lng: z.string().max(20).optional(),
          sortOrder: z.number().optional(),
        }),
      )
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return db.updateSpot(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteSpot(input.id)),
  }),

  // ─── Splits (割り勘) ───
  splits: router({
    list: protectedProcedure
      .input(z.object({ tripId: z.number() }))
      .query(({ input }) => db.getTripSplits(input.tripId)),

    create: protectedProcedure
      .input(
        z.object({
          tripId: z.number(),
          title: z.string().min(1).max(255),
          amount: z.number().min(0),
          paidBy: z.string().min(1).max(100),
          members: z.array(z.string()),
          category: z.string().max(50).optional(),
        }),
      )
      .mutation(({ input }) => db.createSplit(input)),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteSplit(input.id)),
  }),

  // ─── List Items ───
  lists: router({
    get: protectedProcedure
      .input(
        z.object({
          tripId: z.number(),
          listType: z.enum(["shopping", "packing", "links", "places"]),
        }),
      )
      .query(({ input }) => db.getTripListItems(input.tripId, input.listType)),

    create: protectedProcedure
      .input(
        z.object({
          tripId: z.number(),
          listType: z.enum(["shopping", "packing", "links", "places"]),
          title: z.string().min(1).max(255),
          url: z.string().optional(),
        }),
      )
      .mutation(({ input }) => db.createListItem(input)),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().min(1).max(255).optional(),
          checked: z.boolean().optional(),
          url: z.string().optional(),
        }),
      )
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return db.updateListItem(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteListItem(input.id)),
  }),
});

export type AppRouter = typeof appRouter;
