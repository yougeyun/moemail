import { createDb } from "@/lib/db"
import { roleOrders, roles, users } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { getUserId } from "@/lib/apiKey"
import { getRolePermissions } from "@/lib/permissions"
import { getRoleEmailRules, getRoleDurationOptions } from "@/lib/role-rules"
import { getActiveUserRole } from "@/lib/role-access"
import { getRequestContext } from "@cloudflare/next-on-pages"
import { createProviderPayment, getPaymentConfig } from "@/lib/payment"

export const runtime = "edge"

export async function GET() {
  const userId = await getUserId()
  if (!userId) {
    return Response.json({ error: "未授权" }, { status: 401 })
  }

  try {
    const db = createDb()
    const [roleRows, currentRole] = await Promise.all([
      db.query.roles.findMany({
        where: eq(roles.purchasable, true),
        orderBy: (roles, { asc }) => [asc(roles.sortOrder), asc(roles.price)],
      }),
      getActiveUserRole(db, userId),
    ])

    return Response.json({
      currentRoleId: currentRole?.roleId ?? null,
      currentRoleSort: currentRole?.role.sortOrder ?? 999,
      currentExpiresAt: currentRole?.expiresAt
        ? currentRole.expiresAt.toISOString()
        : null,
      roles: roleRows.map((role) => ({
        id: role.id,
        name: role.name,
        displayName: role.displayName,
        description: role.description,
        icon: role.icon,
        price: role.price,
        sortOrder: role.sortOrder,
        durationOptions: getRoleDurationOptions(role.durationOptions),
        showUpperDomains: role.showUpperDomains,
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
    const { roleId, durationDays, paymentMethod } = await request.json() as {
      roleId: string
      durationDays?: number
      paymentMethod?: "wechat" | "alipay"
    }
    if (!roleId || durationDays === undefined) {
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
      getActiveUserRole(db, userId),
    ])

    if (!targetRole || !targetRole.purchasable) {
      return Response.json({ error: "该会员等级不可购买" }, { status: 400 })
    }

    if (!user) {
      return Response.json({ error: "用户不存在" }, { status: 404 })
    }

    const durationOptions = getRoleDurationOptions(targetRole.durationOptions)
    let selectedDuration: { days: number; price: number }

    if (durationOptions.length > 0) {
      const found = durationOptions.find((option) => option.days === durationDays)
      if (!found) {
        return Response.json({ error: "该会员等级没有这个购买时长" }, { status: 400 })
      }
      selectedDuration = found
    } else if (durationDays === 0) {
      selectedDuration = { days: 0, price: targetRole.price }
    } else {
      return Response.json(
        { error: "该会员等级未配置购买时长，仅支持永久购买" },
        { status: 400 }
      )
    }

    const currentSort = currentRole?.role.sortOrder ?? 999
    if (targetRole.sortOrder > currentSort) {
      return Response.json(
        { error: "只能购买当前等级或更高等级的会员" },
        { status: 400 }
      )
    }

    if (targetRole.sortOrder === currentSort && !currentRole?.expiresAt) {
      return Response.json(
        { error: "当前等级已是永久，无需重复购买" },
        { status: 400 }
      )
    }

    const now = new Date()
    let expiresAt: Date | null

    if (targetRole.sortOrder === currentSort) {
      const base =
        currentRole?.expiresAt && currentRole.expiresAt.getTime() > now.getTime()
          ? currentRole.expiresAt
          : now
      expiresAt =
        selectedDuration.days === 0
          ? null
          : new Date(base.getTime() + selectedDuration.days * 24 * 60 * 60 * 1000)
    } else {
      expiresAt =
        selectedDuration.days === 0
          ? null
          : new Date(now.getTime() + selectedDuration.days * 24 * 60 * 60 * 1000)
    }

    if (paymentMethod === "wechat" || paymentMethod === "alipay") {
      const env = getRequestContext().env
      const paymentConfig = await getPaymentConfig(env)
      const orderId = crypto.randomUUID()

      await db.insert(roleOrders)
        .values({
          id: orderId,
          userId,
          roleId: targetRole.id,
          roleName: targetRole.name,
          roleDisplayName: targetRole.displayName,
          durationDays: selectedDuration.days,
          expiresAt,
          price: selectedDuration.price,
          status: "pending",
          paymentMethod,
        })

      const payment = await createProviderPayment({
        orderId,
        amountYuan: selectedDuration.price,
        title: `会员等级-${targetRole.displayName || targetRole.name}`,
        method: paymentMethod,
        config: paymentConfig,
      })

      return Response.json({
        success: true,
        orderId,
        paymentUrl: payment.paymentUrl,
        paymentQr: payment.paymentQr,
      })
    }

    return Response.json({
      error: "请选择微信或支付宝支付",
    }, { status: 400 })
  } catch (error) {
    console.error("Failed to purchase member level:", error)
    return Response.json({ error: "购买失败" }, { status: 500 })
  }
}
