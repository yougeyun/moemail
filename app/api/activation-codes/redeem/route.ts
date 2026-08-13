import { createDb } from "@/lib/db"
import { activationCodes, userEmailQuotas, users } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { getUserId } from "@/lib/apiKey"

export const runtime = "edge"

export async function POST(request: Request) {
  const userId = await getUserId()
  if (!userId) {
    return Response.json({ error: "未授权" }, { status: 401 })
  }

  try {
    const { code } = await request.json() as { code?: string }
    const normalizedCode = (code || "").trim().toUpperCase()
    if (!normalizedCode) {
      return Response.json({ error: "请输入激活码" }, { status: 400 })
    }

    const db = createDb()
    const [activationCode, user] = await Promise.all([
      db.query.activationCodes.findFirst({
        where: eq(activationCodes.code, normalizedCode),
      }),
      db.query.users.findFirst({
        where: eq(users.id, userId),
      }),
    ])

    if (!activationCode) {
      return Response.json({ error: "激活码不存在" }, { status: 404 })
    }

    if (activationCode.usedAt) {
      return Response.json({ error: "激活码已被使用" }, { status: 400 })
    }

    if (
      activationCode.expiresAt &&
      activationCode.expiresAt.getTime() < Date.now()
    ) {
      return Response.json({ error: "激活码已过期" }, { status: 400 })
    }

    if (!user) {
      return Response.json({ error: "用户不存在" }, { status: 404 })
    }

    const redeemedEmailQuota =
      user.redeemedEmailQuota + activationCode.emailQuota
    const redeemedSendQuota =
      user.redeemedSendQuota + activationCode.sendQuota

    await Promise.all([
      db.update(users)
        .set({ redeemedEmailQuota, redeemedSendQuota })
        .where(eq(users.id, userId)),
      db.update(activationCodes)
        .set({ usedBy: userId, usedAt: new Date() })
        .where(eq(activationCodes.id, activationCode.id)),
      db.insert(userEmailQuotas)
        .values({
          userId,
          quota: activationCode.emailQuota,
          expiryDays: activationCode.emailExpiryDays,
          sourceCodeId: activationCode.id,
        }),
    ])

    return Response.json({
      success: true,
      redeemedEmailQuota,
      redeemedSendQuota,
      addedEmailQuota: activationCode.emailQuota,
      addedSendQuota: activationCode.sendQuota,
      addedEmailExpiryDays: activationCode.emailExpiryDays,
    })
  } catch (error) {
    console.error("Failed to redeem activation code:", error)
    return Response.json({ error: "兑换失败" }, { status: 500 })
  }
}
