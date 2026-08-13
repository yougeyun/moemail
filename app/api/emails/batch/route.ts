import { NextResponse } from "next/server"
import { nanoid } from "nanoid"
import { and, eq, gt, inArray, sql } from "drizzle-orm"
import { createDb } from "@/lib/db"
import { emails, userEmailQuotas, users } from "@/lib/schema"
import { EXPIRY_OPTIONS } from "@/types/email"
import { EMAIL_CONFIG } from "@/config"
import { getRequestContext } from "@cloudflare/next-on-pages"
import { getUserId } from "@/lib/apiKey"
import { ROLES } from "@/lib/permissions"
import { getRoleEmailRules } from "@/lib/role-rules"
import { getActiveUserRole } from "@/lib/role-access"
import { getEmailQuotaSummary } from "@/lib/email-quota"

export const runtime = "edge"

const MAX_COUNT = 500
const MAX_BATCH_STATEMENTS = 100
const LEGACY_QUOTA_EXPIRY = 86400000

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
    const [userRoleRecord, userRecord] = await Promise.all([
      getActiveUserRole(db, userId),
      db.query.users.findFirst({
        where: eq(users.id, userId),
      }),
    ])
    const userRole = userRoleRecord?.role
    const quota = await getEmailQuotaSummary(userId, userRecord)

    let activeEmailsCount = 0
    let freeLimit = Number.MAX_SAFE_INTEGER

    if (userRole?.name !== ROLES.EMPEROR) {
      const globalMaxEmails = Number(
        await env.SITE_CONFIG.get("MAX_EMAILS")
      )
      freeLimit =
        userRole?.maxEmails ??
        (Number.isFinite(globalMaxEmails) && globalMaxEmails > 0
          ? globalMaxEmails
          : EMAIL_CONFIG.MAX_ACTIVE_EMAILS)
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(emails)
        .where(
          and(
            eq(emails.userId, userId),
            gt(emails.expiresAt, new Date())
          )
        )
      activeEmailsCount = Number(countResult[0].count)
    }

    const { name, count, expiryTime, domain } = await request.json<{
      name?: string
      count?: number
      expiryTime?: number
      domain?: string
    }>()

    const requestedCount = Math.max(1, Math.floor(Number(count) || 1))
    if (requestedCount > MAX_COUNT) {
      return NextResponse.json(
        { error: `单次最多生成 ${MAX_COUNT} 个邮箱` },
        { status: 400 }
      )
    }

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

    if (!domain || !domains.includes(domain)) {
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
      !emailRules.allowedExpiries.includes(expiryTime!)
    ) {
      return NextResponse.json(
        { error: "当前会员等级不能使用该有效期" },
        { status: 403 }
      )
    }

    const maxEmails = freeLimit + quota.total
    const available = maxEmails - activeEmailsCount
    if (available <= 0) {
      return NextResponse.json(
        { error: "邮箱额度已用完" },
        { status: 403 }
      )
    }
    if (requestedCount > available) {
      return NextResponse.json(
        { error: `邮箱额度不足，最多还能创建 ${available} 个邮箱` },
        { status: 403 }
      )
    }

    const baseName = (name || "").trim()
    const addresses = Array.from({ length: requestedCount }, (_, index) => {
      const local = baseName
        ? requestedCount === 1
          ? baseName
          : index === 0
            ? baseName
            : `${baseName}-${index + 1}`
        : nanoid(8)
      return `${local}@${domain}`
    })

    const uniqueAddresses = Array.from(new Set(addresses))
    if (uniqueAddresses.length !== addresses.length) {
      return NextResponse.json(
        { error: "生成的邮箱地址存在重复" },
        { status: 409 }
      )
    }

    const lowerAddresses = uniqueAddresses.map((address) =>
      address.toLowerCase()
    )
    for (let i = 0; i < lowerAddresses.length; i += 100) {
      const chunk = lowerAddresses.slice(i, i + 100)
      const existingRows = await db
        .select({ address: emails.address })
        .from(emails)
        .where(inArray(sql`LOWER(${emails.address})`, chunk))
      if (existingRows.length > 0) {
        return NextResponse.json(
          { error: `邮箱地址已被使用：${existingRows[0].address}` },
          { status: 409 }
        )
      }
    }

    const freeToCreate = Math.min(
      requestedCount,
      Math.max(0, freeLimit - activeEmailsCount)
    )
    const quotaToCreate = Math.min(
      requestedCount - freeToCreate,
      quota.remaining
    )

    const quotaRows =
      quotaToCreate > 0
        ? await db.query.userEmailQuotas.findMany({
            where: and(
              eq(userEmailQuotas.userId, userId),
              gt(userEmailQuotas.quota, 0)
            ),
            orderBy: (rows, { asc }) => [asc(rows.createdAt)],
          })
        : []

    const quotaExpiries: number[] = []
    const quotaConsumed = new Map<string, number>()
    let remainingToAllocate = quotaToCreate

    for (const row of quotaRows) {
      if (remainingToAllocate <= 0) break
      const take = Math.min(row.quota, remainingToAllocate)
      quotaConsumed.set(row.id, take)
      for (let i = 0; i < take; i += 1) {
        quotaExpiries.push(row.expiry)
      }
      remainingToAllocate -= take
    }

    for (let i = 0; i < remainingToAllocate; i += 1) {
      quotaExpiries.push(LEGACY_QUOTA_EXPIRY)
    }

    const now = new Date()
    const rows: typeof emails.$inferInsert[] = uniqueAddresses.map(
      (address, index) => {
        const expiryValue =
          index < freeToCreate
            ? expiryTime!
            : quotaExpiries[index - freeToCreate]
        return {
          id: crypto.randomUUID(),
          address,
          userId,
          createdAt: now,
          expiresAt: toExpiry(expiryValue, now),
        }
      }
    )

    const quotaUpdates = Array.from(quotaConsumed.entries()).map(
      ([id, take]) => {
        const row = quotaRows.find((item) => item.id === id)
        if (!row) throw new Error("Quota row not found")
        return db
          .update(userEmailQuotas)
          .set({ quota: row.quota - take })
          .where(eq(userEmailQuotas.id, id))
      }
    )
    const userUpdate =
      quotaToCreate > 0
        ? db
            .update(users)
            .set({
              redeemedEmailQuota: Math.max(
                0,
                quota.remaining - quotaToCreate
              ),
            })
            .where(eq(users.id, userId))
        : null

    const extraStatements =
      quotaUpdates.length + (userUpdate ? 1 : 0)
    const chunkSize = Math.max(
      1,
      Math.min(80, MAX_BATCH_STATEMENTS - extraStatements)
    )

    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize)
      const statements = chunk.map((row) =>
        db.insert(emails).values(row)
      ) as unknown[]
      if (i + chunkSize >= rows.length) {
        statements.push(...quotaUpdates)
        if (userUpdate) statements.push(userUpdate)
      }
      await db.batch(statements as never)
    }

    return NextResponse.json({
      success: true,
      count: rows.length,
      emails: rows.map((row) => row.address),
    })
  } catch (error) {
    console.error("Failed to batch generate emails:", error)
    return NextResponse.json(
      { error: "批量创建邮箱失败" },
      { status: 500 }
    )
  }
}
