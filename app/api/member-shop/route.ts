import { createDb } from "@/lib/db"
import { roleOrders, roles, userRoles, users } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { getUserId } from "@/lib/apiKey"
import { assignRoleToUser } from "@/lib/auth"
import { getRolePermissions } from "@/lib/permissions"
import { getRoleEmailRules } from "@/lib/role-rules"

export const runtime = "edge"

export async function GET() {
  const userId = await getUserId()
  if (!userId) {
    return Response.json({ error: "未授权" }, { status: 401 })
  }

  try {
    const db = createDb()
    const [roleRows, user, currentRole] = await Promise.all([
      db.query.roles.findMany({
        where: eq(roles.purchasable, true),
        orderBy: (roles, { asc }) => [asc(roles.sortOrder), asc(roles.price)],
      }),
      db.query.users.findFirst({
        where: eq(users.id, userId),
      }),
      db.query.userRoles.findFirst({
        where: eq(userRoles.userId, userId),
        with: { role: true },
      }),
    ])

    return Response.json({
      points: user?.points ?? 0,
      currentRoleId: currentRole?.roleId ?? null,
      currentRoleSort: currentRole?.role.sortOrder ?? 999,
      roles: roleRows.map((role) => ({
        id: role.id,
        name: role.name,
        displayName: role.displayName,
        description: role.description,
        icon: role.icon,
        price: role.price,
        sortOrder: role.sortOrder,
        permissions: getRolePermissions({
          name: role.name,
          permissions: role.permissions,
        }),
        ...getRoleEmailRules({
          allowedDomains: role.allowedDomains,
          allowedExpiries: role.allowedExpiries,
          defaultExpiry: role.defaultExpiry,
        }),
      })),
    })
  } catch (error) {
    console.error("Failed to load member shop:", error)
    return Response.json({ error: "获取会员商城失败" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const userId = await getUserId()
  if (!userId) {
    return Response.json({ error: "未授权" }, { status: 401 })
  }

  try {
    const { roleId } = await request.json() as { roleId: string }
    if (!roleId) {
      return Response.json({ error: "缺少会员等级" }, { status: 400 })
    }

    const db = createDb()
    const [targetRole, user, currentRole] = await Promise.all([
      db.query.roles.findFirst({
        where: eq(roles.id, roleId),
      }),
      db.query.users.findFirst({
        where: eq(users.id, userId),
      }),
      db.query.userRoles.findFirst({
        where: eq(userRoles.userId, userId),
        with: { role: true },
      }),
    ])

    if (!targetRole || !targetRole.purchasable) {
      return Response.json({ error: "该会员等级不可购买" }, { status: 400 })
    }

    if (!user) {
      return Response.json({ error: "用户不存在" }, { status: 404 })
    }

    const currentSort = currentRole?.role.sortOrder ?? 999
    if (targetRole.sortOrder >= currentSort) {
      return Response.json(
        { error: "只能购买比当前等级更高的会员等级" },
        { status: 400 }
      )
    }

    if (user.points < targetRole.price) {
      return Response.json(
        { error: "积分不足，请先联系管理员获取积分" },
        { status: 400 }
      )
    }

    const remainingPoints = user.points - targetRole.price

    await db.insert(roleOrders)
      .values({
        userId,
        roleId: targetRole.id,
        roleName: targetRole.name,
        roleDisplayName: targetRole.displayName,
        price: targetRole.price,
        status: "completed",
      })

    await assignRoleToUser(db, userId, targetRole.id)
    await db.update(users)
      .set({ points: remainingPoints })
      .where(eq(users.id, userId))

    return Response.json({
      success: true,
      points: remainingPoints,
      role: {
        id: targetRole.id,
        name: targetRole.name,
        displayName: targetRole.displayName,
        icon: targetRole.icon,
      },
    })
  } catch (error) {
    console.error("Failed to purchase member level:", error)
    return Response.json({ error: "购买失败" }, { status: 500 })
  }
}
