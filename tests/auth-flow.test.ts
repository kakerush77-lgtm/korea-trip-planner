import { describe, expect, it } from "vitest";
import { appRouter } from "../server/routers";
import type { TrpcContext } from "../server/_core/context";

function createAnonymousContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as unknown as TrpcContext["res"],
  };
}

function createAuthenticatedContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user-123",
      email: "test@example.com",
      name: "テストユーザー",
      loginMethod: "manus",
      role: "user",
      points: 0,
      streak: 0,
      lastStreakDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as unknown as TrpcContext["res"],
  };
}

describe("Auth Flow", () => {
  it("auth.me returns null for anonymous users", async () => {
    const ctx = createAnonymousContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("auth.me returns user data for authenticated users", async () => {
    const ctx = createAuthenticatedContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.id).toBe(1);
    expect(result?.email).toBe("test@example.com");
    expect(result?.name).toBe("テストユーザー");
  });

  it("auth.logout clears cookie and returns success", async () => {
    const clearedCookies: { name: string; options: Record<string, unknown> }[] = [];
    const ctx: TrpcContext = {
      ...createAuthenticatedContext(),
      req: {
        protocol: "https",
        hostname: "localhost",
        headers: { host: "localhost:3000" },
        get: (name: string) => name === "host" ? "localhost:3000" : undefined,
      } as unknown as TrpcContext["req"],
      res: {
        clearCookie: (name: string, options: Record<string, unknown>) => {
          clearedCookies.push({ name, options });
        },
      } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies.length).toBe(1);
    expect(clearedCookies[0]?.options).toHaveProperty("maxAge", -1);
  });

  it("protected routes reject anonymous users", async () => {
    const ctx = createAnonymousContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.trips.list()).rejects.toThrow();
  });
});
