import { NextResponse } from "next/server"
import { nanoid } from "nanoid"
import { createDb } from "@/lib/db"
import { emails, users } from "@/lib/schema"
import { eq, and, gt, sql } from "drizzle-orm"
import { EXPIRY_OPTIONS } from "@/types/email"
import { EMAIL_CONFIG } from "@/config"
import { getRequestContext } from "@cloudflare/next-on-pages"
import { getUserId } from "@/lib/apiKey"
import { ROLES } from "@/lib/permissions"
import { getRoleEmailRules } from "@/lib/role-rules"
import { getActiveUserRole } from "@/lib/role-access"

export const runtime = "edge"

export async function POST(request: Request) {
  const db = createDb()
  const env = getRequestContext().env

  const userId = await getUserId()
  const userRoleRecord = await getActiveUserRole(db, userId!)
  const userRole = userRoleRecord?.role
  const userRecord = await db.query.users.findFirst({
    where: eq(users.id, userId!),
  })

  try {
    if (userRole?.name !== ROLES.EMPEROR) {
      const globalMaxEmails = Number(await env.SITE_CONFIG.get("MAX_EMAILS"))
      const maxEmails =
        (userRole?.maxEmails ??
          (Number.isFinite(globalMaxEmails) && globalMaxEmails > 0
            ? globalMaxEmails
            : EMAIL_CONFIG.MAX_ACTIVE_EMAILS)) +
        (userRecord?.redeemedEmailQuota ?? 0)
      const activeEmailsCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(emails)
        .where(
          and(
            eq(emails.userId, userId!),
            gt(emails.expiresAt, new Date())
          )
        )
      
      if (Number(activeEmailsCount[0].count) >= Number(maxEmails)) {
        return NextResponse.json(
          { error: `已达到最大邮箱数量限制 (${maxEmails})` },
          { status: 403 }
        )
      }
    }

    const { name, expiryTime, domain } = await request.json<{ 
      name: string
      expiryTime: number
      domain: string
    }>()

    if (!EXPIRY_OPTIONS.some(option => option.value === expiryTime)) {
      return NextResponse.json(
        { error: "无效的过期时间" },
        { status: 400 }
      )
    }

    const domainString = await env.SITE_CONFIG.get("EMAIL_DOMAINS")
    const domains = domainString ? domainString.split(',') : ["moemail.app"]

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
      where: eq(sql`LOWER(${emails.address})`, address.toLowerCase())
    })

    if (existingEmail) {
      return NextResponse.json(
        { error: "该邮箱地址已被使用" },
        { status: 409 }
      )
    }

    const now = new Date()
    const expires = expiryTime === 0 
      ? new Date('9999-01-01T00:00:00.000Z')
      : new Date(now.getTime() + expiryTime)
    
    const emailData: typeof emails.$inferInsert = {
      address,
      createdAt: now,
      expiresAt: expires,
      userId: userId!
    }
    
    const result = await db.insert(emails)
      .values(emailData)
      .returning({ id: emails.id, address: emails.address })
    
    return NextResponse.json({ 
      id: result[0].id,
      email: result[0].address 
    })
  } catch (error) {
    console.error('Failed to generate email:', error)
    return NextResponse.json(
      { error: "创建邮箱失败" },
      { status: 500 }
    )
  }
} 
