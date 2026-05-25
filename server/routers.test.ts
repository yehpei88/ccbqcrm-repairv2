import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock database functions
vi.mock("./db", () => ({
  getAllMinsu: vi.fn(() => Promise.resolve([])),
  getMinsuById: vi.fn(() => Promise.resolve(null)),
  getMinsuByArea: vi.fn(() => Promise.resolve([])),
  getMinsuByStaffId: vi.fn(() => Promise.resolve([])),
  upsertMinsu: vi.fn((data) => Promise.resolve(data)),
  createContactLog: vi.fn((data) => Promise.resolve(data)),
  getContactLogByMinsuId: vi.fn(() => Promise.resolve([])),
  createAutoReminder: vi.fn((data) => Promise.resolve(data)),
  getPendingReminders: vi.fn(() => Promise.resolve([])),
  updateReminderStatus: vi.fn(() => Promise.resolve()),
  upsertStaff: vi.fn((data) => Promise.resolve(data)),
  getStaffById: vi.fn(() => Promise.resolve(null)),
}));

// Mock LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(() =>
    Promise.resolve({
      choices: [
        {
          message: {
            content: JSON.stringify({
              classification: "hot",
              confidence: 0.95,
              summary: "客戶表達強烈預約意願",
              actionSuggestion: "立即跟進確認檔期",
            }),
          },
        },
      ],
    })
  ),
}));

// Mock notification
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn(() => Promise.resolve(true)),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("appRouter", () => {
  let ctx: TrpcContext;

  beforeEach(() => {
    ctx = createAuthContext();
  });

  describe("minsu", () => {
    it("should have getAll query", async () => {
      const caller = appRouter.createCaller(ctx);
      expect(caller.minsu.getAll).toBeDefined();
      const result = await caller.minsu.getAll();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should have getById query", async () => {
      const caller = appRouter.createCaller(ctx);
      expect(caller.minsu.getById).toBeDefined();
    });

    it("should have getByArea query", async () => {
      const caller = appRouter.createCaller(ctx);
      expect(caller.minsu.getByArea).toBeDefined();
    });

    it("should have getByStaffId query", async () => {
      const caller = appRouter.createCaller(ctx);
      expect(caller.minsu.getByStaffId).toBeDefined();
    });

    it("should have update mutation", async () => {
      const caller = appRouter.createCaller(ctx);
      expect(caller.minsu.update).toBeDefined();
    });
  });

  describe("contactLog", () => {
    it("should have getByMinsuId query", async () => {
      const caller = appRouter.createCaller(ctx);
      expect(caller.contactLog.getByMinsuId).toBeDefined();
    });

    it("should have create mutation", async () => {
      const caller = appRouter.createCaller(ctx);
      expect(caller.contactLog.create).toBeDefined();
    });
  });

  describe("aiClassify", () => {
    it("should have classifyIntent mutation", async () => {
      const caller = appRouter.createCaller(ctx);
      expect(caller.aiClassify.classifyIntent).toBeDefined();
    });
  });

  describe("reminder", () => {
    it("should have getPending query", async () => {
      const caller = appRouter.createCaller(ctx);
      expect(caller.reminder.getPending).toBeDefined();
    });

    it("should have sendPending mutation", async () => {
      const caller = appRouter.createCaller(ctx);
      expect(caller.reminder.sendPending).toBeDefined();
    });
  });

  describe("staff", () => {
    it("should have upsert mutation", async () => {
      const caller = appRouter.createCaller(ctx);
      expect(caller.staff.upsert).toBeDefined();
    });

    it("should have getById query", async () => {
      const caller = appRouter.createCaller(ctx);
      expect(caller.staff.getById).toBeDefined();
    });
  });
});
