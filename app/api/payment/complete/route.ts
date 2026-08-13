import { createDb } from "@/lib/db"
import { roleOrders } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { assignRoleToUser, checkPermission } from "@/lib/auth"
import { PERMISSIONS } from "@/lib/permissions"

export const runtime = "edge"

export async function POST(request: Request) {
  const canManage = await checkPermission(PERMISSIONS.MANAGE_CONFIG)
  if (!canManage) {
    return Response.json({ error: "权限不足" }, { status: 403 })
  }

  try {
    const { orderId } = await request.json() as { orderId: string }
    if (!orderId) {
      return Response.json({ error: "缺少订单号" }, { status: 400 })
    }

    const db = createDb()
    const order = await db.query.roleOrders.findFirst({
      where: eq(roleOrders.id, orderId),
    })

    if (!order) {
      return Response.json({ error: "订单不存在" }, { status: 404 })
    }

    if (order.status !== "pending") {
      return Response.json({ error: "订单状态不允许确认" }, { status: 400 })
    }

    await assignRoleToUser(
      db,
      order.userId,
      order.roleId,
      order.expiresAt ?? undefined
    )
    await db.update(roleOrders)
      .set({ status: "completed" })
      .where(eq(roleOrders.id, orderId))

    return Response.json({ success: true })
  } catch (error) {
    console.error("Failed to complete payment order:", error)
    return Response.json({ error: "确认订单失败" }, { status: 500 })
  }
}
