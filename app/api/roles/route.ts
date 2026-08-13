import { createDb } from "@/lib/db"
import { roles, userRoles } from "@/lib/schema"
import { eq, sql } from "drizzle-orm"
import { getRequestContext } from "@cloudflare/next-on-pages"
import { checkPermission } from "@/lib/auth"
import { PERMISSIONS, getRolePermissions } from "@/lib/permissions"
import { getRoleEmailRules } from "@/lib/role-rules"
import {
  ROLE_NAME_PATTERN,
  isRoleIcon,
  normalizeBoolean,
  normalizeDailyLimit,
  normalizeDefaultExpiry,
  normalizeDomains,
  normalizeExpiries,
  normalizeMaxEmails,
  normalizePrice,
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
    const env = getRequestContext().env
    const domainString = await env.SITE_CONFIG.get("EMAIL_DOMAINS")
    const availableDomains = (domainString || "moemail.app")
      .split(",")
      .map((domain) => domain.trim())
      .filter(Boolean)
    const rows = await db
      .select({
        id: roles.id,
        name: roles.name,
        displayName: roles.displayName,
        description: roles.description,
        icon: roles.icon,
        permissions: roles.permissions,
        dailyLimit: roles.dailyLimit,
        maxEmails: roles.maxEmails,
        allowedDomains: roles.allowedDomains,
        allowedExpiries: roles.allowedExpiries,
        defaultExpiry: roles.defaultExpiry,
        price: roles.price,
        purchasable: roles.purchasable,
        sortOrder: roles.sortOrder,
        isSystem: roles.isSystem,
        userCount: sql<number>`count(${userRoles.userId})`,
      })
      .from(roles)
      .leftJoin(userRoles, eq(userRoles.roleId, roles.id))
      .groupBy(roles.id)
      .orderBy(roles.sortOrder)

    return Response.json({
      availableDomains,
      roles: rows.map((role) => ({
        ...role,
        permissions: getRolePermissions({
          name: role.name,
          permissions: role.permissions,
        }),
        ...getRoleEmailRules({
          allowedDomains: role.allowedDomains,
          allowedExpiries: role.allowedExpiries,
          defaultExpiry: role.defaultExpiry,
        }),
        price: role.price,
        purchasable: role.purchasable,
        maxEmails: role.maxEmails,
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
      maxEmails?: number
      allowedDomains?: unknown
      allowedExpiries?: unknown
      defaultExpiry?: number
      price?: number
      purchasable?: boolean
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

    const allowedExpiries = normalizeExpiries(body.allowedExpiries)
    const allowedDomains = normalizeDomains(body.allowedDomains)

    const [role] = await db.insert(roles)
      .values({
        name,
        displayName,
        description: body.description?.trim() || "",
        icon: isRoleIcon(body.icon) ? body.icon : "User2",
        permissions: JSON.stringify(parseRolePermissions(body.permissions)),
        dailyLimit: normalizeDailyLimit(body.dailyLimit),
        maxEmails: normalizeMaxEmails(body.maxEmails),
        allowedDomains: allowedDomains.length > 0 ? JSON.stringify(allowedDomains) : undefined,
        allowedExpiries: allowedExpiries.length > 0 ? JSON.stringify(allowedExpiries) : undefined,
        defaultExpiry: normalizeDefaultExpiry(body.defaultExpiry, allowedExpiries),
        price: normalizePrice(body.price),
        purchasable: normalizeBoolean(body.purchasable),
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
        ...getRoleEmailRules({
          allowedDomains: role.allowedDomains,
          allowedExpiries: role.allowedExpiries,
          defaultExpiry: role.defaultExpiry,
        }),
        price: role.price,
        purchasable: role.purchasable,
        maxEmails: role.maxEmails,
      },
    })
  } catch (error) {
    console.error("Failed to create role:", error)
    return Response.json({ error: "创建角色失败" }, { status: 500 })
  }
}
