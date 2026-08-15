import { createDb } from "@/lib/db"
import { and, eq, gt, lt, or, sql } from "drizzle-orm"
import { NextResponse } from "next/server"
import { emails } from "@/lib/schema"
import { encodeCursor, decodeCursor } from "@/lib/cursor"
import { getUserId } from "@/lib/apiKey"

export const runtime = "edge"

const PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

export async function GET(request: Request) {
  const userId = await getUserId()

  const { searchParams } = new URL(request.url)
  const cursor = searchParams.get("cursor")
  const rawPageSize = Number(searchParams.get("pageSize"))
  const pageSize =
    Number.isFinite(rawPageSize) && rawPageSize > 0
      ? Math.min(MAX_PAGE_SIZE, Math.floor(rawPageSize))
      : PAGE_SIZE

  const db = createDb()

  try {
    const baseConditions = and(
      eq(emails.userId, userId!),
      gt(emails.expiresAt, new Date())
    )

    const totalResult = cursor
      ? null
      : await db
          .select({ count: sql<number>`count(*)` })
          .from(emails)
          .where(baseConditions)
    const totalCount = totalResult ? Number(totalResult[0].count) : null

    const conditions = [baseConditions]

    if (cursor) {
      const { timestamp, id } = decodeCursor(cursor)
      conditions.push(
        or(
          lt(emails.createdAt, new Date(timestamp)),
          and(
            eq(emails.createdAt, new Date(timestamp)),
            lt(emails.id, id)
          )
        )
      )
    }

    const results = await db.query.emails.findMany({
      where: and(...conditions),
      orderBy: (emails, { desc }) => [
        desc(emails.createdAt),
        desc(emails.id)
      ],
      limit: pageSize + 1,
      columns: {
        id: true,
        address: true,
        createdAt: true,
        expiresAt: true,
      },
    })
    
    const hasMore = results.length > pageSize
    const nextCursor = hasMore 
      ? encodeCursor(
          results[pageSize - 1].createdAt.getTime(),
          results[pageSize - 1].id
        )
      : null
    const emailList = hasMore ? results.slice(0, pageSize) : results

    return NextResponse.json({ 
      emails: emailList,
      nextCursor,
      total: totalCount
    })
  } catch (error) {
    console.error('Failed to fetch user emails:', error)
    return NextResponse.json(
      { error: "Failed to fetch emails" },
      { status: 500 }
    )
  }
} 
