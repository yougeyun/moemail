import { createDb } from "@/lib/db"
import { messages, emails, users } from "@/lib/schema"
import { eq, and, gte, sql } from "drizzle-orm"
import { getRequestContext } from "@cloudflare/next-on-pages"
import { EMAIL_CONFIG } from "@/config"
import { getActiveUserRole } from "@/lib/role-access"

export interface SendPermissionResult {
  canSend: boolean
  error?: string
  remainingEmails?: number
}

export async function checkSendPermission(
  userId: string,
  skipDailyLimitCheck = false
): Promise<SendPermissionResult> {
  try {
    const env = getRequestContext().env
    const db = createDb()
    const enabled = await env.SITE_CONFIG.get("EMAIL_SERVICE_ENABLED")

    if (enabled !== "true") {
      return {
        canSend: false,
        error: "邮件发送服务未启用"
      }
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })
    const userDailyLimit = await getUserDailyLimit(userId)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const sentTodayRows = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .innerJoin(emails, eq(messages.emailId, emails.id))
      .where(
        and(
          eq(emails.userId, userId),
          eq(messages.type, "sent"),
          gte(messages.receivedAt, today)
        )
      )
    const sentToday = Number(sentTodayRows[0].count)

    const redeemedSendQuota = user?.redeemedSendQuota ?? 0

    if (redeemedSendQuota <= 0) {
      if (userDailyLimit === -1) {
        return {
          canSend: false,
          error: "您的角色没有发件权限，请使用激活码兑换发件次数"
        }
      }

      if (skipDailyLimitCheck || userDailyLimit === 0) {
        return {
          canSend: true
        }
      }

      const remainingEmails = Math.max(0, userDailyLimit - sentToday)
      if (sentToday >= userDailyLimit) {
        return {
          canSend: false,
          error: `您今天已达到发件限制 (${userDailyLimit} 封)，请明天再试`,
          remainingEmails: 0
        }
      }

      return {
        canSend: true,
        remainingEmails
      }
    }

    const totalSentRows = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .innerJoin(emails, eq(messages.emailId, emails.id))
      .where(
        and(
          eq(emails.userId, userId),
          eq(messages.type, "sent")
        )
      )
    const totalSent = Number(totalSentRows[0].count)
    const remainingQuota = Math.max(0, redeemedSendQuota - totalSent)

    if (remainingQuota <= 0) {
      return {
        canSend: false,
        error: "激活码兑换的发件次数已用完",
        remainingEmails: 0
      }
    }

    if (skipDailyLimitCheck || userDailyLimit === -1 || userDailyLimit === 0) {
      return {
        canSend: true,
        remainingEmails: remainingQuota
      }
    }

    const remainingDaily = Math.max(0, userDailyLimit - sentToday)
    const remainingEmails = Math.min(remainingQuota, remainingDaily)

    if (remainingEmails <= 0) {
      return {
        canSend: false,
        error: `您今天已达到发件限制 (${userDailyLimit} 封)，请明天再试`,
        remainingEmails: 0
      }
    }

    return {
      canSend: true,
      remainingEmails
    }
  } catch (error) {
    console.error('Failed to check send permission:', error)
    return {
      canSend: false,
      error: "权限检查失败"
    }
  }
}

async function getUserDailyLimit(userId: string): Promise<number> {
  try {
    const db = createDb()
    
    const activeUserRole = await getActiveUserRole(db, userId)
    const userRole = activeUserRole
      ? {
          roleName: activeUserRole.role.name,
          dailyLimit: activeUserRole.role.dailyLimit,
        }
      : null
    if (!userRole) {
      return -1
    }

    if (userRole.dailyLimit !== null && userRole.dailyLimit !== undefined) {
      return userRole.dailyLimit
    }

    const env = getRequestContext().env
    const roleLimitsStr = await env.SITE_CONFIG.get("EMAIL_ROLE_LIMITS")
    
    const customLimits = roleLimitsStr ? JSON.parse(roleLimitsStr) : {}
    const customLimit = customLimits[userRole.roleName]
    const defaultLimit = EMAIL_CONFIG.DEFAULT_DAILY_SEND_LIMITS[
      userRole.roleName as keyof typeof EMAIL_CONFIG.DEFAULT_DAILY_SEND_LIMITS
    ]

    return customLimit !== undefined ? customLimit : defaultLimit ?? -1
  } catch (error) {
    console.error('Failed to get user daily limit:', error)
    return -1
  }
}

export async function checkBasicSendPermission(userId: string): Promise<SendPermissionResult> {
  return checkSendPermission(userId, true)
} 
