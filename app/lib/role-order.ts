import { eq } from "drizzle-orm"
import { createDb } from "@/lib/db"
import { roleOrders } from "@/lib/schema"
import { assignRoleToUser } from "@/lib/auth"

export async function completeRoleOrder(
  orderId: string,
  paidAmountYuan?: number
): Promise<boolean> {
  const db = createDb()
  const order = await db.query.roleOrders.findFirst({
    where: eq(roleOrders.id, orderId),
  })

  if (!order) return false
  if (order.status !== "pending") return true
  if (
    paidAmountYuan !== undefined &&
    Math.abs(paidAmountYuan - order.price) > 0.001
  ) {
    return false
  }

  await assignRoleToUser(
    db,
    order.userId,
    order.roleId,
    order.expiresAt ?? undefined
  )
  await db
    .update(roleOrders)
    .set({ status: "completed" })
    .where(eq(roleOrders.id, orderId))

  return true
}
