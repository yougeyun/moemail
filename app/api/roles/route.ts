import { createDb } from "@/lib/db"
import { roles, userRoles } from "@/lib/schema"
import { eq, sql } from "drizzle-orm"
import { checkPermission } from "@/lib/auth"
import { PERMISSIONS, getRolePermissions } from "@/lib/permissions"
import {
  ROLE_NAME_PATTERN,
  isRoleIcon,
  normalizeDailyLimit,
  parseRolePermissions,
} from "./shared"

export const runtime = "edge"

export async function GET() {
  const [canManageRoles, canPromote, canManageConfig] = await Promise.all([
    checkPermission(PERMISSIONS.MANAGE_ROLES),
    checkPermission(PERMISSIONS.PROMOTE_USER),
    checkPermission(PERMISSIONS.MANAGE_CONFIG),
  ])
  if (!canManageRoles && !canPromote && !canManageConfig) {
    return Response.json({ error: "权限不足" }, { status: 403 })
  }

  try {
    const db = createDb()
    const rows = await db
      .select({
        id: roles.id,
        name: roles.name,
        displayName: roles.displayName,
        description: roles.description,
        icon: roles.icon,
        permissions: roles.permissions,
        dailyLimit: roles.dailyLimit,
        sortOrder: roles.sortOrder,
        isSystem: roles.isSystem,
        userCount: sql<number>`count(${userRoles.userId})`,
      })
      .from(roles)
      .leftJoin(userRoles, eq(userRoles.roleId, roles.id))
      .groupBy(roles.id)
      .orderBy(roles.sortOrder)

    return Response.json({
      roles: rows.map((role) => ({
        ...role,
        permissions: getRolePermissions({
          name: role.name,
          permissions: role.permissions,
        }),
      })),
    })
  } catch (error) {
    console.error("Failed to list roles:", error)
    return Response.json({ error: "获取角色列表失败" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const canManage = await checkPermission(PERMISSIONS.MANAGE_ROLES)
  if (!canManage) {
    return Response.json({ error: "权限不足" }, { status: 403 })
  }

  try {
    const body = await request.json() as {
      name?: string
      displayName?: string
      description?: string
      icon?: string
      permissions?: unknown
      dailyLimit?: number
      sortOrder?: number
    }

    const name = body.name?.trim()
    const displayName = body.displayName?.trim()

    if (!name || !ROLE_NAME_PATTERN.test(name)) {
      return Response.json(
        { error: "角色标识需为 2-32 位小写字母、数字、下划线或中划线" },
        { status: 400 }
      )
    }

    if (!displayName) {
      return Response.json({ error: "请填写角色显示名称" }, { status: 400 })
    }

    const db = createDb()
    const existing = await db.query.roles.findFirst({
      where: eq(roles.name, name),
    })

    if (existing) {
      return Response.json({ error: "该角色标识已存在" }, { status: 409 })
    }

    const [role] = await db.insert(roles)
      .values({
        name,
        displayName,
        description: body.description?.trim() || "",
        icon: isRoleIcon(body.icon) ? body.icon : "User2",
        permissions: JSON.stringify(parseRolePermissions(body.permissions)),
        dailyLimit: normalizeDailyLimit(body.dailyLimit),
        sortOrder: Number.isInteger(body.sortOrder) ? Math.max(0, body.sortOrder as number) : 0,
        isSystem: false,
      })
      .returning()

    return Response.json({
      role: {
        ...role,
        permissions: getRolePermissions({
          name: role.name,
          permissions: role.permissions,
        }),
      },
    })
  } catch (error) {
    console.error("Failed to create role:", error)
    return Response.json({ error: "创建角色失败" }, { status: 500 })
  }
}
