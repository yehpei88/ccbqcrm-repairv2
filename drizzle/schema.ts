import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * 民宿 (Minsu) 表 - 存儲所有民宿信息
 */
export const minsu = mysqlTable("minsu", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  address: varchar("address", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  area: varchar("area", { length: 50 }).notNull(), // 地區
  pinStatus: mysqlEnum("pinStatus", ["red-star", "red", "green", "purple", "gold"]).default("red").notNull(),
  aiScore: decimal("aiScore", { precision: 3, scale: 1 }).default("0"),
  callResult: mysqlEnum("callResult", ["agreed", "hesitating", "rejected", "invalid", "closed", "missed"]),
  intentLabel: mysqlEnum("intentLabel", ["hot", "inquiring", "rejected", "seen"]).default("seen"),
  cooperationCount: int("cooperationCount").default(0),
  lastCoopDate: timestamp("lastCoopDate"),
  totalRevenue: decimal("totalRevenue", { precision: 12, scale: 2 }).default("0"),
  hasRainShelter: boolean("hasRainShelter").default(false),
  isPackage: boolean("isPackage").default(false),
  distanceFromCity: decimal("distanceFromCity", { precision: 5, scale: 2 }).default("0"),
  note: text("note"),
  lineAdded: boolean("lineAdded").default(false),
  lineId: varchar("lineId", { length: 100 }),
  quickTags: json("quickTags").$type<string[]>().default([]),
  rfmR: int("rfmR"),
  rfmF: int("rfmF"),
  rfmM: int("rfmM"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  missedCallDate: timestamp("missedCallDate"),
  missedCallRemindDays: int("missedCallRemindDays").default(7),
  phoneStatus: mysqlEnum("phoneStatus", ["pending", "confirmed"]).default("pending"),
  assignedStaffId: varchar("assignedStaffId", { length: 64 }), // 分配給的顧客開發人員
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Minsu = typeof minsu.$inferSelect;
export type InsertMinsu = typeof minsu.$inferInsert;

/**
 * 聯繫記錄 (Contact Log) 表 - 記錄每次聯繫的詳細信息
 */
export const contactLog = mysqlTable("contactLog", {
  id: varchar("id", { length: 64 }).primaryKey(),
  minsuId: varchar("minsuId", { length: 64 }).notNull(),
  staffId: varchar("staffId", { length: 64 }).notNull(),
  callResult: mysqlEnum("callResult", ["agreed", "hesitating", "rejected", "invalid", "closed", "missed"]).notNull(),
  intentLabel: mysqlEnum("intentLabel", ["hot", "inquiring", "rejected", "seen"]).default("seen"),
  lineId: varchar("lineId", { length: 100 }),
  quickTags: json("quickTags").$type<string[]>().default([]),
  note: text("note"),
  followUpDays: int("followUpDays"), // 後續追蹤天數
  followUpDate: timestamp("followUpDate"), // 計算出的後續追蹤日期
  aiSummary: text("aiSummary"), // AI 生成的摘要
  aiIntentClassification: mysqlEnum("aiIntentClassification", ["hot", "inquiring", "rejected", "seen"]).default("seen"),
  aiConfidence: decimal("aiConfidence", { precision: 3, scale: 2 }), // AI 分類置信度
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ContactLog = typeof contactLog.$inferSelect;
export type InsertContactLog = typeof contactLog.$inferInsert;

/**
 * 自動提醒 (Auto Reminder) 表 - 存儲待發送的自動提醒
 */
export const autoReminder = mysqlTable("autoReminder", {
  id: varchar("id", { length: 64 }).primaryKey(),
  minsuId: varchar("minsuId", { length: 64 }).notNull(),
  staffId: varchar("staffId", { length: 64 }).notNull(),
  reminderType: mysqlEnum("reminderType", ["follow_up", "missed_call", "high_heat"]).notNull(),
  scheduledDate: timestamp("scheduledDate").notNull(), // 計劃發送日期
  message: text("message").notNull(),
  status: mysqlEnum("status", ["pending", "sent", "failed"]).default("pending"),
  sentAt: timestamp("sentAt"),
  failureReason: text("failureReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AutoReminder = typeof autoReminder.$inferSelect;
export type InsertAutoReminder = typeof autoReminder.$inferInsert;

/**
 * 顧客開發人員 (Staff) 表 - 存儲顧客開發人員信息
 */
export const staff = mysqlTable("staff", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  userId: int("userId"), // 關聯到 users 表
  assignedAreas: json("assignedAreas").$type<string[]>().default([]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Staff = typeof staff.$inferSelect;
export type InsertStaff = typeof staff.$inferInsert;

// TODO: Add your tables here
