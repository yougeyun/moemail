import { NextResponse } from "next/server"
import { eq, and } from "drizzle-orm"
import { createDb } from "@/lib/db"
import { roleOrders } from "@/lib/schema"
import { getUserId } from "@/lib/apiKey"

export const runtime = "edge"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "未授权" }, { status: 401 })
  }

  const { orderId } = await params
  const db = createDb()
  const order = await db.query.roleOrders.findFirst({
    where: and(eq(roleOrders.id, orderId), eq(roleOrders.userId, userId)),
  })

  if (!order) {
    return NextResponse.json({ error: "订单不存在" }, { status: 404 })
  }

  return NextResponse.json({
    id: order.id,
    status: order.status,
    roleName: order.roleName,
    roleDisplayName: order.roleDisplayName,
    price: order.price,
    durationDays: order.durationDays,
    paymentMethod: order.paymentMethod,
    createdAt: order.createdAt,
  })
}
