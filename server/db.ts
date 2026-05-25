import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, minsu, contactLog, autoReminder, staff } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
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
      values.role = 'admin';
      updateSet.role = 'admin';
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

/**
 * 獲取所有民宿
 */
export async function getAllMinsu() {
  const db = await getDb();
  if (!db) return [];
  
  try {
    return await db.select().from(minsu);
  } catch (error) {
    console.error("[Database] Failed to get all minsu:", error);
    return [];
  }
}

/**
 * 按 ID 獲取民宿
 */
export async function getMinsuById(id: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  try {
    const result = await db.select().from(minsu).where(eq(minsu.id, id)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.error("[Database] Failed to get minsu by id:", error);
    return undefined;
  }
}

/**
 * 按區域獲取民宿
 */
export async function getMinsuByArea(area: string) {
  const db = await getDb();
  if (!db) return [];
  
  try {
    return await db.select().from(minsu).where(eq(minsu.area, area));
  } catch (error) {
    console.error("[Database] Failed to get minsu by area:", error);
    return [];
  }
}

/**
 * 按分配的顧客開發人員獲取民宿
 */
export async function getMinsuByStaffId(staffId: string) {
  const db = await getDb();
  if (!db) return [];
  
  try {
    return await db.select().from(minsu).where(eq(minsu.assignedStaffId, staffId));
  } catch (error) {
    console.error("[Database] Failed to get minsu by staff id:", error);
    return [];
  }
}

/**
 * 創建或更新民宿
 */
export async function upsertMinsu(data: typeof minsu.$inferInsert) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert minsu: database not available");
    return undefined;
  }
  
  try {
    await db.insert(minsu).values(data).onDuplicateKeyUpdate({
      set: data,
    });
    return data;
  } catch (error) {
    console.error("[Database] Failed to upsert minsu:", error);
    throw error;
  }
}

/**
 * 創建聯繫記錄
 */
export async function createContactLog(data: typeof contactLog.$inferInsert) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create contact log: database not available");
    return undefined;
  }
  
  try {
    await db.insert(contactLog).values(data);
    return data;
  } catch (error) {
    console.error("[Database] Failed to create contact log:", error);
    throw error;
  }
}

/**
 * 獲取民宿的聯繫記錄
 */
export async function getContactLogByMinsuId(minsuId: string) {
  const db = await getDb();
  if (!db) return [];
  
  try {
    return await db.select().from(contactLog)
      .where(eq(contactLog.minsuId, minsuId))
      .orderBy(desc(contactLog.createdAt));
  } catch (error) {
    console.error("[Database] Failed to get contact logs:", error);
    return [];
  }
}

/**
 * 創建自動提醒
 */
export async function createAutoReminder(data: typeof autoReminder.$inferInsert) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create auto reminder: database not available");
    return undefined;
  }
  
  try {
    await db.insert(autoReminder).values(data);
    return data;
  } catch (error) {
    console.error("[Database] Failed to create auto reminder:", error);
    throw error;
  }
}

/**
 * 獲取待發送的提醒
 */
export async function getPendingReminders() {
  const db = await getDb();
  if (!db) return [];
  
  try {
    return await db.select().from(autoReminder)
      .where(eq(autoReminder.status, 'pending'))
      .orderBy(autoReminder.scheduledDate);
  } catch (error) {
    console.error("[Database] Failed to get pending reminders:", error);
    return [];
  }
}

/**
 * 更新提醒狀態
 */
export async function updateReminderStatus(id: string, status: 'sent' | 'failed', failureReason?: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update reminder: database not available");
    return;
  }
  
  try {
    const updateData: any = {
      status,
      sentAt: new Date(),
    };
    if (failureReason) {
      updateData.failureReason = failureReason;
    }
    await db.update(autoReminder).set(updateData).where(eq(autoReminder.id, id));
  } catch (error) {
    console.error("[Database] Failed to update reminder:", error);
    throw error;
  }
}

/**
 * 獲取或創建顧客開發人員
 */
export async function upsertStaff(data: typeof staff.$inferInsert) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert staff: database not available");
    return undefined;
  }
  
  try {
    await db.insert(staff).values(data).onDuplicateKeyUpdate({
      set: data,
    });
    return data;
  } catch (error) {
    console.error("[Database] Failed to upsert staff:", error);
    throw error;
  }
}

/**
 * 按 ID 獲取顧客開發人員
 */
export async function getStaffById(id: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  try {
    const result = await db.select().from(staff).where(eq(staff.id, id)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.error("[Database] Failed to get staff by id:", error);
    return undefined;
  }
}

// TODO: add feature queries here as your schema grows.
