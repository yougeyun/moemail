import { createDb } from "@/lib/db"
import { roles, userRoles } from "@/lib/schema"
import { and, eq } from "drizzle-orm"
import { checkPermission } from "@/lib/auth"
import { PERMISSIONS, ROLES, getRolePermissions } from "@/lib/permissions"
import {
  ROLE_NAME_PATTERN,
  isProtectedRole,
  isRoleIcon,
  normalizeDailyLimit,
  parseRolePermissions,
} from "../shared"

export const runtime = "edge"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const canManage = await checkPermission(PERMISSIONS.MANAGE_ROLES)
  if (!canManage) {
    return Response.json({ error: "权限不足" }, { status: 403 })
  }

  try {
    const { id } = await params
    const body = await request.json() as {
      name?: string
      displayName?: string
      description?: string
      icon?: string
      permissions?: unknown
      dailyLimit?: number
      sortOrder?: number
    }

    const db = createDb()
    const existing = await db.query.roles.findFirst({
      where: eq(roles.id, id),
    })

    if (!existing) {
      return Response.json({ error: "角色不存在" }, { status: 404 })
    }

    const updates: Partial<typeof roles.$inferInsert> = {}

    if (existing.name === ROLES.EMPEROR) {
      if (
        body.name !== undefined ||
        body.permissions !== undefined ||
        body.dailyLimit !== undefined ||
        body.sortOrder !== undefined
      ) {
        return Response.json(
          { error: "皇帝角色的标识、权限、发信上限和排序不可修改" },
          { status: 400 }
        )
      }
    }

    if (existing.name === ROLES.CIVILIAN) {
      if (
        body.name !== undefined ||
        body.permissions !== undefined ||
        body.dailyLimit !== undefined
      ) {
        return Response.json(
          { error: "平民角色的标识、权限和发信上限不可修改" },
          { status: 400 }
        )
      }
    }

    if (body.name !== undefined) {
      const name = body.name.trim()
      if (!ROLE_NAME_PATTERN.test(name)) {
        return Response.json(
          { error: "角色标识需为 2-32 位小写字母、数字、下划线或中划线" },
          { status: 400 }
        )
      }

      const duplicate = await db.query.roles.findFirst({
        where: and(eq(roles.name, name), eq(roles.id, id)),
      })
      if (!duplicate) {
        const sameName = await db.query.roles.findFirst({
          where: eq(roles.name, name),
        })
        if (sameName) {
          return Response.json({ error: "该角色标识已存在" }, { status: 409 })
        }
      }
      updates.name = name
    }

    if (body.displayName !== undefined) {
      const displayName = body.displayName.trim()
      if (!displayName) {
        return Response.json({ error: "请填写角色显示名称" }, { status: 400 })
      }
      updates.displayName = displayName
    }

    if (body.description !== undefined) {
      updates.description = body.description.trim()
    }

    if (body.icon !== undefined) {
      if (!isRoleIcon(body.icon)) {
        return Response.json({ error: "图标不存在" }, { status: 400 })
      }
      updates.icon = body.icon
    }

    if (body.permissions !== undefined) {
      updates.permissions = JSON.stringify(parseRolePermissions(body.permissions))
    }

    if (body.dailyLimit !== undefined) {
      updates.dailyLimit = normalizeDailyLimit(body.dailyLimit)
    }

    if (body.sortOrder !== undefined) {
      if (!Number.isInteger(body.sortOrder)) {
        return Response.json({ error: "排序值必须为整数" }, { status: 400 })
      }
      updates.sortOrder = Math.max(0, body.sortOrder)
    }

    updates.updatedAt = new Date()

    const [role] = await db
      .update(roles)
      .set(updates)
      .where(eq(roles.id, id))
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
    console.error("Failed to update role:", error)
    return Response.json({ error: "更新角色失败" }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const canManage = await checkPermission(PERMISSIONS.MANAGE_ROLES)
  if (!canManage) {
    return Response.json({ error: "权限不足" }, { status: 403 })
  }

  try {
    const { id } = await params
    const db = createDb()
    const role = await db.query.roles.findFirst({
      where: eq(roles.id, id),
    })

    if (!role) {
      return Response.json({ error: "角色不存在" }, { status: 404 })
    }

    if (isProtectedRole(role.name)) {
      return Response.json(
        { error: "皇帝和平民是系统内置角色，不能删除" },
        { status: 400 }
      )
    }

    const userCountResult = await db
      .select({ count: userRoles.roleId })
      .from(userRoles)
      .where(eq(userRoles.roleId, id))

    if (userCountResult.length > 0) {
      return Response.json(
        { error: "该角色下仍有用户，请先为用户更换角色后再删除" },
        { status: 400 }
      )
    }

    await db.delete(roles).where(eq(roles.id, id))
    return Response.json({ success: true })
  } catch (error) {
    console.error("Failed to delete role:", error)
    return Response.json({ error: "删除角色失败" }, { status: 500 })
  }
}
