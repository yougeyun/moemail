import { createDb } from "@/lib/db"
import { users } from "@/lib/schema"
import { eq } from "drizzle-orm"
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

    return Response.json({
      redeemedEmailQuota: emailQuota.remaining,
      redeemedEmailQuotaTotal: emailQuota.total,
      redeemedSendQuota: user?.redeemedSendQuota ?? 0,
    })
  } catch (error) {
    console.error("Failed to load activation quota:", error)
    return Response.json({ error: "获取兑换额度失败" }, { status: 500 })
  }
}
