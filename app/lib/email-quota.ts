import { and, eq, gt, isNull, or, sql } from "drizzle-orm"
import { createDb } from "@/lib/db"
import {
  activationCodes,
  adRewardRecords,
  userEmailQuotas,
  users,
} from "@/lib/schema"

export interface EmailQuotaSummary {
  total: number
  remaining: number
}

export async function getEmailQuotaSummary(
  userId: string,
  _user?: Pick<typeof users.$inferSelect, "redeemedEmailQuota"> | null
): Promise<EmailQuotaSummary> {
  const db = createDb()
  void _user
  const now = new Date()

  const [codeTotalRows, quotaRows, adTotalRows] = await Promise.all([
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
      .leftJoin(
        activationCodes,
        eq(activationCodes.id, userEmailQuotas.sourceCodeId)
      )
      .where(
        and(
          eq(userEmailQuotas.userId, userId),
          gt(userEmailQuotas.quota, 0),
          or(
            isNull(activationCodes.expiresAt),
            gt(activationCodes.expiresAt, now)
          )
        )
      ),
    db
      .select({
        total: sql<number>`coalesce(sum(${adRewardRecords.quota}), 0)`,
      })
      .from(adRewardRecords)
      .where(eq(adRewardRecords.userId, userId)),
  ])

  const codeTotal = Number(codeTotalRows[0]?.total ?? 0)
  const adTotal = Number(adTotalRows[0]?.total ?? 0)
  const remaining = Number(quotaRows[0]?.total ?? 0)

  return {
    total: codeTotal + adTotal,
    remaining,
  }
}
