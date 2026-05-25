import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { nanoid } from "nanoid";
import { 
  getAllMinsu, 
  getMinsuById, 
  getMinsuByArea, 
  getMinsuByStaffId,
  upsertMinsu,
  createContactLog,
  getContactLogByMinsuId,
  createAutoReminder,
  getPendingReminders,
  updateReminderStatus,
  upsertStaff,
  getStaffById,
} from "./db";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // 民宿管理 API
  minsu: router({
    // 獲取所有民宿
    getAll: publicProcedure.query(async () => {
      return await getAllMinsu();
    }),

    // 按 ID 獲取民宿
    getById: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return await getMinsuById(input.id);
      }),

    // 按區域獲取民宿
    getByArea: publicProcedure
      .input(z.object({ area: z.string() }))
      .query(async ({ input }) => {
        return await getMinsuByArea(input.area);
      }),

    // 按顧客開發人員 ID 獲取民宿
    getByStaffId: protectedProcedure
      .input(z.object({ staffId: z.string() }))
      .query(async ({ input }) => {
        return await getMinsuByStaffId(input.staffId);
      }),

    // 更新民宿信息
    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        pinStatus: z.enum(["red-star", "red", "green", "purple", "gold"]).optional(),
        callResult: z.enum(["agreed", "hesitating", "rejected", "invalid", "closed", "missed"]).optional(),
        intentLabel: z.enum(["hot", "inquiring", "rejected", "seen"]).optional(),
        lineAdded: z.boolean().optional(),
        lineId: z.string().optional(),
        quickTags: z.array(z.string()).optional(),
        note: z.string().optional(),
        aiScore: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updateData } = input;
        const existing = await getMinsuById(id);
        if (!existing) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Minsu not found",
          });
        }
        
        const updated = await upsertMinsu({
          ...existing,
          ...updateData,
          updatedAt: new Date(),
        });
        return updated;
      }),
  }),

  // 聯繫記錄 API
  contactLog: router({
    // 獲取民宿的聯繫記錄
    getByMinsuId: publicProcedure
      .input(z.object({ minsuId: z.string() }))
      .query(async ({ input }) => {
        return await getContactLogByMinsuId(input.minsuId);
      }),

    // 記錄聯繫完成
    create: protectedProcedure
      .input(z.object({
        minsuId: z.string(),
        staffId: z.string(),
        callResult: z.enum(["agreed", "hesitating", "rejected", "invalid", "closed", "missed"]),
        lineId: z.string().optional(),
        quickTags: z.array(z.string()).optional(),
        note: z.string().optional(),
        followUpDays: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = nanoid();
        const followUpDate = input.followUpDays 
          ? new Date(Date.now() + input.followUpDays * 24 * 60 * 60 * 1000)
          : undefined;

        // 創建聯繫記錄
        const log = await createContactLog({
          id,
          minsuId: input.minsuId,
          staffId: input.staffId,
          callResult: input.callResult,
          lineId: input.lineId,
          quickTags: input.quickTags || [],
          note: input.note,
          followUpDays: input.followUpDays,
          followUpDate,
          intentLabel: "seen", // 預設為已讀，後續由 AI 分類
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // 更新民宿的 Pin 狀態和通話結果
        const minsuData = await getMinsuById(input.minsuId);
        if (minsuData) {
          // 根據通話結果更新 Pin 狀態
          let newPinStatus = minsuData.pinStatus;
          if (input.callResult === "agreed") {
            newPinStatus = "green";
          } else if (input.callResult === "hesitating") {
            newPinStatus = "purple";
          } else if (input.callResult === "rejected") {
            newPinStatus = "red";
          } else if (input.callResult === "invalid" || input.callResult === "closed") {
            newPinStatus = "gold";
          } else if (input.callResult === "missed") {
            newPinStatus = "red-star";
          }

          await upsertMinsu({
            ...minsuData,
            pinStatus: newPinStatus,
            callResult: input.callResult,
            lineAdded: input.callResult === "agreed",
            lineId: input.lineId,
            quickTags: input.quickTags || [],
            note: input.note,
            missedCallDate: input.callResult === "missed" ? new Date() : minsuData.missedCallDate,
            missedCallRemindDays: input.followUpDays || minsuData.missedCallRemindDays,
            updatedAt: new Date(),
          });

          // 如果需要後續追蹤，創建自動提醒
          if (input.followUpDays && followUpDate) {
            await createAutoReminder({
              id: nanoid(),
              minsuId: input.minsuId,
              staffId: input.staffId,
              reminderType: "follow_up",
              scheduledDate: followUpDate,
              message: `提醒：${minsuData.name} 需要後續追蹤（${input.followUpDays} 天後）`,
              status: "pending",
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
        }

        return log;
      }),
  }),

  // AI 聯繫分類 API
  aiClassify: router({
    // 分類聯繫意向
    classifyIntent: protectedProcedure
      .input(z.object({
        contactLogId: z.string(),
        staffNote: z.string(),
      }))
      .mutation(async ({ input }) => {
        try {
          // 調用 LLM 進行分類
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `你是一個 CRM 系統的 AI 助手。你的任務是根據顧客開發人員的聯繫筆記，分類客戶的意向。
                
請根據以下標準進行分類：
- "hot" (高熱度)：客戶明確表達預約意願、詢問具體檔期、詢問價格、要求確認場地、表達急迫感
- "inquiring" (詢價中)：客戶詢問價格、費用、優惠、方案、套餐等
- "rejected" (婉拒)：客戶明確拒絕、表示沒興趣、不需要
- "seen" (已讀)：客戶已讀但未回應、需要再聯絡、考慮中

請返回 JSON 格式的結果，包含：
- classification: 分類結果 (hot|inquiring|rejected|seen)
- confidence: 置信度 (0-1)
- summary: 聯繫摘要 (中文)
- actionSuggestion: 建議的後續行動 (中文)`,
              },
              {
                role: "user",
                content: `請分類以下聯繫筆記：\n\n${input.staffNote}`,
              },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "intent_classification",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    classification: {
                      type: "string",
                      enum: ["hot", "inquiring", "rejected", "seen"],
                    },
                    confidence: {
                      type: "number",
                      minimum: 0,
                      maximum: 1,
                    },
                    summary: {
                      type: "string",
                    },
                    actionSuggestion: {
                      type: "string",
                    },
                  },
                  required: ["classification", "confidence", "summary", "actionSuggestion"],
                  additionalProperties: false,
                },
              },
            },
          });

          const content = response.choices[0]?.message?.content;
          if (!content) {
            throw new Error("Empty response from LLM");
          }

          const result = typeof content === "string" ? JSON.parse(content) : content;

          return {
            classification: result.classification,
            confidence: result.confidence,
            summary: result.summary,
            actionSuggestion: result.actionSuggestion,
          };
        } catch (error) {
          console.error("[AI Classify] Error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "AI classification failed",
          });
        }
      }),
  }),

  // 自動提醒 API
  reminder: router({
    // 獲取待發送的提醒
    getPending: protectedProcedure.query(async () => {
      return await getPendingReminders();
    }),

    // 發送待發送的提醒
    sendPending: protectedProcedure.mutation(async () => {
      const reminders = await getPendingReminders();
      let sent = 0;
      let failed = 0;

      for (const reminder of reminders) {
        try {
          // 發送通知給老闆
          const success = await notifyOwner({
            title: `CRM 自動提醒：${reminder.reminderType}`,
            content: reminder.message,
          });

          if (success) {
            await updateReminderStatus(reminder.id, "sent");
            sent++;
          } else {
            await updateReminderStatus(reminder.id, "failed", "Notification service unavailable");
            failed++;
          }
        } catch (error) {
          console.error("[Reminder] Error sending reminder:", error);
          await updateReminderStatus(reminder.id, "failed", String(error));
          failed++;
        }
      }

      return { sent, failed, total: reminders.length };
    }),
  }),

  // 顧客開發人員管理 API
  staff: router({
    // 獲取或創建顧客開發人員
    upsert: protectedProcedure
      .input(z.object({
        id: z.string(),
        name: z.string(),
        assignedAreas: z.array(z.string()),
      }))
      .mutation(async ({ input }) => {
        return await upsertStaff({
          id: input.id,
          name: input.name,
          assignedAreas: input.assignedAreas,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }),

    // 按 ID 獲取顧客開發人員
    getById: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return await getStaffById(input.id);
      }),
  }),
});

export type AppRouter = typeof appRouter;
