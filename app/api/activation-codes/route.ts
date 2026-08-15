import { createDb } from "@/lib/db"
import { activationCodes, roles, users } from "@/lib/schema"
import { desc, eq } from "drizzle-orm"
import { nanoid } from "nanoid"
import { auth, checkPermission } from "@/lib/auth"
import { PERMISSIONS, ROLES } from "@/lib/permissions"
import { EXPIRY_OPTIONS } from "@/types/email"

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
        emailExpiry: activationCodes.emailExpiry,
        roleId: activationCodes.roleId,
        roleDurationDays: activationCodes.roleDurationDays,
        roleDisplayName: roles.displayName,
        usedBy: activationCodes.usedBy,
        usedAt: activationCodes.usedAt,
        createdAt: activationCodes.createdAt,
        expiresAt: activationCodes.expiresAt,
        usedUsername: users.username,
      })
      .from(activationCodes)
      .leftJoin(users, eq(users.id, activationCodes.usedBy))
      .leftJoin(roles, eq(roles.id, activationCodes.roleId))
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
      emailExpiry?: number
      prefix?: string
      expiresInDays?: number
      roleId?: string
      roleDurationDays?: number
    }

    const count = Math.min(500, Math.max(1, Number(body.count) || 1))
    const emailQuota = Math.max(0, Number(body.emailQuota) || 0)
    const sendQuota = Math.max(0, Number(body.sendQuota) || 0)
    const emailExpiry = Number(body.emailExpiry)
    const validExpiries = EXPIRY_OPTIONS.map((option) => option.value)
    const normalizedEmailExpiry =
      validExpiries.includes(emailExpiry) ? emailExpiry : 86400000
    const prefix = (body.prefix || "").replace(/[^A-Za-z0-9_-]/g, "").toUpperCase()
    const expiresAt =
      Number(body.expiresInDays) > 0
        ? new Date(Date.now() + Number(body.expiresInDays) * 24 * 60 * 60 * 1000)
        : null

    const db = createDb()
    const roleId = (body.roleId || "").trim() || undefined
    const roleDurationDays = Math.max(
      0,
      Math.floor(Number(body.roleDurationDays) || 0)
    )
    if (roleId) {
      const role = await db.query.roles.findFirst({
        where: eq(roles.id, roleId),
      })
      if (!role || role.name === ROLES.EMPEROR) {
        return Response.json(
          { error: "无效的会员等级" },
          { status: 400 }
        )
      }
    }

    const session = await auth()
    const sessionUserId = session?.user?.id || "system"
    const codes = Array.from({ length: count }, () => {
      const randomPart = nanoid(10).toUpperCase().replace(/[^A-Z0-9]/g, "")
      const code = `${prefix ? `${prefix}-` : ""}${randomPart}`
      return {
        code,
        emailQuota,
        sendQuota,
        emailExpiryDays:
          normalizedEmailExpiry === 0
            ? 0
            : Math.ceil(normalizedEmailExpiry / 86400000),
        emailExpiry: normalizedEmailExpiry,
        roleId: roleId ?? null,
        roleDurationDays: roleId ? roleDurationDays : 0,
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
