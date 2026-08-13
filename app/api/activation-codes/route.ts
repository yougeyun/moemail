import { createDb } from "@/lib/db"
import { activationCodes, users } from "@/lib/schema"
import { desc, eq } from "drizzle-orm"
import { nanoid } from "nanoid"
import { auth, checkPermission } from "@/lib/auth"
import { PERMISSIONS } from "@/lib/permissions"

export const runtime = "edge"

export async function GET() {
  const canManage = await checkPermission(PERMISSIONS.MANAGE_CONFIG)
  if (!canManage) {
    return Response.json({ error: "权限不足" }, { status: 403 })
  }

  try {
    const db = createDb()
    const rows = await db
      .select({
        id: activationCodes.id,
        code: activationCodes.code,
        emailQuota: activationCodes.emailQuota,
        sendQuota: activationCodes.sendQuota,
        emailExpiryDays: activationCodes.emailExpiryDays,
        usedBy: activationCodes.usedBy,
        usedAt: activationCodes.usedAt,
        createdAt: activationCodes.createdAt,
        expiresAt: activationCodes.expiresAt,
        usedUsername: users.username,
      })
      .from(activationCodes)
      .leftJoin(users, eq(users.id, activationCodes.usedBy))
      .orderBy(desc(activationCodes.createdAt))
      .limit(200)

    return Response.json({ codes: rows })
  } catch (error) {
    console.error("Failed to list activation codes:", error)
    return Response.json({ error: "获取激活码列表失败" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const canManage = await checkPermission(PERMISSIONS.MANAGE_CONFIG)
  if (!canManage) {
    return Response.json({ error: "权限不足" }, { status: 403 })
  }

  try {
    const body = await request.json() as {
      count?: number
      emailQuota?: number
      sendQuota?: number
      emailExpiryDays?: number
      prefix?: string
      expiresInDays?: number
    }

    const count = Math.min(500, Math.max(1, Number(body.count) || 1))
    const emailQuota = Math.max(0, Number(body.emailQuota) || 0)
    const sendQuota = Math.max(0, Number(body.sendQuota) || 0)
    const emailExpiryDays = Math.max(0, Number(body.emailExpiryDays) || 0)
    const prefix = (body.prefix || "").replace(/[^A-Za-z0-9_-]/g, "").toUpperCase()
    const expiresAt =
      Number(body.expiresInDays) > 0
        ? new Date(Date.now() + Number(body.expiresInDays) * 24 * 60 * 60 * 1000)
        : null

    const db = createDb()
    const session = await auth()
    const sessionUserId = session?.user?.id || "system"
    const codes = Array.from({ length: count }, () => {
      const randomPart = nanoid(10).toUpperCase().replace(/[^A-Z0-9]/g, "")
      const code = `${prefix ? `${prefix}-` : ""}${randomPart}`
      return {
        code,
        emailQuota,
        sendQuota,
        emailExpiryDays,
        createdBy: sessionUserId,
        expiresAt,
      }
    })

    await db.insert(activationCodes)
      .values(codes)
      .onConflictDoNothing({ target: activationCodes.code })

    return Response.json({ success: true, count: codes.length, codes })
  } catch (error) {
    console.error("Failed to generate activation codes:", error)
    return Response.json({ error: "生成激活码失败" }, { status: 500 })
  }
}
