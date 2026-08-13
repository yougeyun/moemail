import { createDb } from "@/lib/db"
import { roleOrders, users } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { checkPermission } from "@/lib/auth"
import { PERMISSIONS } from "@/lib/permissions"

export const runtime = "edge"

export async function GET() {
  const canManage = await checkPermission(PERMISSIONS.MANAGE_CONFIG)
  if (!canManage) {
    return Response.json({ error: "权限不足" }, { status: 403 })
  }

  try {
    const db = createDb()
    const orders = await db
      .select({
        id: roleOrders.id,
        userId: roleOrders.userId,
        roleName: roleOrders.roleName,
        roleDisplayName: roleOrders.roleDisplayName,
        price: roleOrders.price,
        durationDays: roleOrders.durationDays,
        paymentMethod: roleOrders.paymentMethod,
        createdAt: roleOrders.createdAt,
        username: users.username,
      })
      .from(roleOrders)
      .leftJoin(users, eq(users.id, roleOrders.userId))
      .where(eq(roleOrders.status, "pending"))
      .orderBy(roleOrders.createdAt)

    return Response.json({ orders })
  } catch (error) {
    console.error("Failed to list pending payment orders:", error)
    return Response.json({ error: "获取待支付订单失败" }, { status: 500 })
  }
}
