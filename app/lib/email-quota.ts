import { eq, sql } from "drizzle-orm"
import { createDb } from "@/lib/db"
import { activationCodes, userEmailQuotas, users } from "@/lib/schema"

export interface EmailQuotaSummary {
  total: number
  remaining: number
}

/**
 * 已兑换邮箱额度的总览。
 *
 * total 表示兑换过的邮箱额度总和（不会随创建邮箱而减少），
 * remaining 表示当前还可以使用激活码额度创建的邮箱数量。
 */
export async function getEmailQuotaSummary(
  userId: string,
  user?: Pick<typeof users.$inferSelect, "redeemedEmailQuota"> | null
): Promise<EmailQuotaSummary> {
  const db = createDb()

  const [codeTotalRows, quotaRows, userQuota] = await Promise.all([
    db
      .select({
        total: sql<number>`coalesce(sum(${activationCodes.emailQuota}), 0)`,
      })
      .from(activationCodes)
      .where(eq(activationCodes.usedBy, userId)),
    db
      .select({
        total: sql<number>`coalesce(sum(${userEmailQuotas.quota}), 0)`,
      })
      .from(userEmailQuotas)
      .where(eq(userEmailQuotas.userId, userId)),
    user
      ? Promise.resolve(user.redeemedEmailQuota)
      : db
          .select({ quota: users.redeemedEmailQuota })
          .from(users)
          .where(eq(users.id, userId))
          .then((rows) => rows[0]?.quota ?? 0),
  ])

  const codeTotal = Number(codeTotalRows[0]?.total ?? 0)
  const rowRemaining = Number(quotaRows[0]?.total ?? 0)
  const aggregate = Number(userQuota) || 0
  const remaining = Math.max(aggregate, rowRemaining)

  return {
    total: Math.max(codeTotal, remaining),
    remaining,
  }
}
