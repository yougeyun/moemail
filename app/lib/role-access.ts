import { userRoles } from "@/lib/schema"
import { eq } from "drizzle-orm"
import type { Db } from "@/lib/db"

export async function getActiveUserRole(db: Db, userId: string) {
  const records = await db.query.userRoles.findMany({
    where: eq(userRoles.userId, userId),
    with: { role: true },
  })

  const now = Date.now()
  return (
    records.find(
      (record) => !record.expiresAt || record.expiresAt.getTime() > now
    ) ?? null
  )
}
