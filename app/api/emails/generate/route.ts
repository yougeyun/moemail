import { NextResponse } from "next/server"
import { nanoid } from "nanoid"
import { createDb } from "@/lib/db"
import {
  activationCodes,
  emailSlots,
  emails,
  userEmailQuotas,
  users,
} from "@/lib/schema"
import { and, eq, gt, isNull, or, sql } from "drizzle-orm"
import { EXPIRY_OPTIONS } from "@/types/email"
import { EMAIL_CONFIG } from "@/config"
import { getRequestContext } from "@cloudflare/next-on-pages"
import { getUserId } from "@/lib/apiKey"
import { ROLES } from "@/lib/permissions"
import { getRoleEmailRules } from "@/lib/role-rules"
import { getActiveUserRole } from "@/lib/role-access"
import { getEmailQuotaSummary } from "@/lib/email-quota"

export const runtime = "edge"

function toExpiry(value: number, now: Date) {
  return value === 0
    ? new Date("9999-01-01T00:00:00.000Z")
    : new Date(now.getTime() + value)
}

export async function POST(request: Request) {
  const db = createDb()
  const env = getRequestContext().env
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "未授权" }, { status: 401 })
  }

  try {
    const userRoleRecord = await getActiveUserRole(db, userId)
    const userRole = userRoleRecord?.role
    const quota = await getEmailQuotaSummary(userId)
    const isEmperor = userRole?.name === ROLES.EMPEROR

    let freeLimit = Number.MAX_SAFE_INTEGER
    let freeOccupied = 0
    if (!isEmperor) {
      const globalMaxEmails = Number(
        await env.SITE_CONFIG.get("MAX_EMAILS")
      )
      freeLimit =
        userRole?.maxEmails ??
        (Number.isFinite(globalMaxEmails) && globalMaxEmails > 0
          ? globalMaxEmails
          : EMAIL_CONFIG.MAX_ACTIVE_EMAILS)
      const slotResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(emailSlots)
        .where(
          and(
            eq(emailSlots.userId, userId),
            gt(emailSlots.expiresAt, new Date())
          )
        )
      freeOccupied = Number(slotResult[0]?.count ?? 0)
    }

    const { name, expiryTime, domain } = await request.json<{
      name: string
      expiryTime: number
      domain: string
    }>()

    if (!EXPIRY_OPTIONS.some((option) => option.value === expiryTime)) {
      return NextResponse.json(
        { error: "无效的过期时间" },
        { status: 400 }
      )
    }

    const domainString = await env.SITE_CONFIG.get("EMAIL_DOMAINS")
    const domains = domainString
      ? domainString.split(",")
      : ["mail.59pk.net"]

    if (!domains || !domains.includes(domain)) {
      return NextResponse.json(
        { error: "无效的域名" },
        { status: 400 }
      )
    }

    const emailRules = getRoleEmailRules({
      allowedDomains: userRole?.allowedDomains,
      allowedExpiries: userRole?.allowedExpiries,
      defaultExpiry: userRole?.defaultExpiry,
    })

    if (
      emailRules.allowedDomains !== null &&
      !emailRules.allowedDomains.includes(domain)
    ) {
      return NextResponse.json(
        { error: "当前会员等级不能使用该域名" },
        { status: 403 }
      )
    }

    if (
      emailRules.allowedExpiries !== null &&
      !emailRules.allowedExpiries.includes(expiryTime)
    ) {
      return NextResponse.json(
        { error: "当前会员等级不能使用该有效期" },
        { status: 403 }
      )
    }

    const address = `${name || nanoid(8)}@${domain}`
    const existingEmail = await db.query.emails.findFirst({
      where: eq(sql`LOWER(${emails.address})`, address.toLowerCase()),
    })

    if (existingEmail) {
      return NextResponse.json(
        { error: "该邮箱地址已被使用" },
        { status: 409 }
      )
    }

    const freeAvailable = Math.max(0, freeLimit - freeOccupied)
    const useFree = freeAvailable > 0

    let expires: Date
    let quotaRowToConsume: {
      id: string
      quota: number
      expiry: number
    } | null = null
    let legacyQuotaConsumed = false

    if (useFree) {
      expires = toExpiry(expiryTime, new Date())
    } else if (quota.remaining > 0) {
      const quotaRow = await db.query.userEmailQuotas.findFirst({
        where: and(
          eq(userEmailQuotas.userId, userId),
          gt(userEmailQuotas.quota, 0),
          or(
            isNull(activationCodes.expiresAt),
            gt(activationCodes.expiresAt, new Date())
          )
        ),
        orderBy: (rows, { asc }) => [asc(rows.createdAt)],
      })
      if (quotaRow) {
        quotaRowToConsume = {
          id: quotaRow.id,
          quota: quotaRow.quota,
          expiry: quotaRow.expiry,
        }
        expires = toExpiry(quotaRow.expiry, new Date())
      } else {
        legacyQuotaConsumed = true
        expires = toExpiry(86400000, new Date())
      }
    } else {
      return NextResponse.json(
        {
          error: `邮箱额度不足，最多还能创建 ${freeAvailable} 个免费邮箱`,
        },
        { status: 403 }
      )
    }

    const now = new Date()
    const result = await db
      .insert(emails)
      .values({
        address,
        createdAt: now,
        expiresAt: expires,
        userId,
      })
      .returning({ id: emails.id, address: emails.address })

    if (useFree && !isEmperor) {
      await db.insert(emailSlots).values({
        userId,
        emailId: result[0].id,
        expiresAt: expires,
        createdAt: now,
      })
    }

    if (quotaRowToConsume) {
      await db
        .update(userEmailQuotas)
        .set({ quota: quotaRowToConsume.quota - 1 })
        .where(eq(userEmailQuotas.id, quotaRowToConsume.id))
      await db
        .update(users)
        .set({ redeemedEmailQuota: Math.max(0, quota.remaining - 1) })
        .where(eq(users.id, userId))
    } else if (legacyQuotaConsumed) {
      await db
        .update(users)
        .set({ redeemedEmailQuota: Math.max(0, quota.remaining - 1) })
        .where(eq(users.id, userId))
    }

    return NextResponse.json({
      id: result[0].id,
      email: result[0].address,
    })
  } catch (error) {
    console.error("Failed to generate email:", error)
    return NextResponse.json(
      { error: "创建邮箱失败" },
      { status: 500 }
    )
  }
}
