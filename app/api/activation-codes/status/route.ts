import { createDb } from "@/lib/db"
import { emails, messages, users } from "@/lib/schema"
import { and, eq, sql } from "drizzle-orm"
import { getUserId } from "@/lib/apiKey"
import { getEmailQuotaSummary } from "@/lib/email-quota"

export const runtime = "edge"

export async function GET() {
  const userId = await getUserId()
  if (!userId) {
    return Response.json({ error: "未授权" }, { status: 401 })
  }

  try {
    const db = createDb()
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })
    const emailQuota = await getEmailQuotaSummary(userId, user)
    const sentRows = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .innerJoin(emails, eq(messages.emailId, emails.id))
      .where(
        and(
          eq(emails.userId, userId),
          eq(messages.type, "sent")
        )
      )
    const sentSendQuota = Number(sentRows[0]?.count ?? 0)
    const redeemedSendQuota = user?.redeemedSendQuota ?? 0

    return Response.json({
      redeemedEmailQuota: emailQuota.remaining,
      redeemedEmailQuotaTotal: emailQuota.total,
      redeemedSendQuota,
      redeemedSendQuotaRemaining: Math.max(0, redeemedSendQuota - sentSendQuota),
    })
  } catch (error) {
    console.error("Failed to load activation quota:", error)
    return Response.json({ error: "获取兑换额度失败" }, { status: 500 })
  }
}
