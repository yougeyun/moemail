import { NextResponse } from "next/server"
import { createDb } from "@/lib/db"
import { emails, messages } from "@/lib/schema"
import { and, eq, gt, isNull, lt, ne, or, sql } from "drizzle-orm"
import { encodeCursor, decodeCursor } from "@/lib/cursor"
import { getUserId } from "@/lib/apiKey"

export const runtime = "edge"

const PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

export async function GET(request: Request) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "未授权" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const cursor = searchParams.get("cursor")
  const emailId = searchParams.get("emailId") || undefined
  const unread = searchParams.get("unread") === "1"
  const messageType = searchParams.get("type") === "sent" ? "sent" : "received"
  const rawPageSize = Number(searchParams.get("pageSize"))
  const pageSize =
    Number.isFinite(rawPageSize) && rawPageSize > 0
      ? Math.min(MAX_PAGE_SIZE, Math.floor(rawPageSize))
      : PAGE_SIZE

  const db = createDb()

  try {
    const conditions: (ReturnType<typeof and> | undefined)[] = [
      eq(emails.userId, userId),
      gt(emails.expiresAt, new Date()),
      eq(messages.emailId, emails.id),
      messageType === "sent"
        ? eq(messages.type, "sent")
        : or(ne(messages.type, "sent"), isNull(messages.type)),
    ]
    if (emailId) {
      conditions.push(eq(messages.emailId, emailId))
    }
    if (unread && messageType === "received") {
      conditions.push(eq(messages.isRead, false))
    }

    const where = and(...conditions.filter(Boolean))
    const totalResult = cursor
      ? null
      : await db
          .select({ count: sql<number>`count(*)` })
          .from(messages)
          .innerJoin(emails, eq(messages.emailId, emails.id))
          .where(where)
    const totalCount = totalResult ? Number(totalResult[0].count) : null

    if (cursor) {
      const { timestamp, id } = decodeCursor(cursor)
      const orderByTime =
        messageType === "sent" ? messages.sentAt : messages.receivedAt
      conditions.push(
        or(
          lt(orderByTime, new Date(timestamp)),
          and(
            eq(orderByTime, new Date(timestamp)),
            lt(messages.id, id)
          )
        )
      )
    }

    const finalWhere = and(...conditions.filter(Boolean))
    const orderByTime =
      messageType === "sent" ? messages.sentAt : messages.receivedAt

    const rows = await db
      .select({
        id: messages.id,
        emailId: messages.emailId,
        emailAddress: emails.address,
        fromAddress: messages.fromAddress,
        toAddress: messages.toAddress,
        subject: messages.subject,
        receivedAt: messages.receivedAt,
        sentAt: messages.sentAt,
        type: messages.type,
        isRead: messages.isRead,
      })
      .from(messages)
      .innerJoin(emails, eq(messages.emailId, emails.id))
      .where(finalWhere)
      .orderBy(
        sql`${orderByTime} desc, ${messages.id} desc`
      )
      .limit(pageSize + 1)

    const hasMore = rows.length > pageSize
    const nextCursor = hasMore
      ? encodeCursor(
          (messageType === "sent"
            ? rows[pageSize - 1].sentAt
            : rows[pageSize - 1].receivedAt
          )!.getTime(),
          rows[pageSize - 1].id
        )
      : null
    const messageList = hasMore ? rows.slice(0, pageSize) : rows

    return NextResponse.json({
      messages: messageList.map((row) => ({
        id: row.id,
        email_id: row.emailId,
        email_address: row.emailAddress,
        from_address: row.fromAddress,
        to_address: row.toAddress,
        subject: row.subject,
        received_at: row.receivedAt.getTime(),
        sent_at: row.sentAt?.getTime() ?? null,
        type: row.type,
        is_read: row.isRead,
      })),
      nextCursor,
      total: totalCount,
    })
  } catch (error) {
    console.error("Failed to fetch unified messages:", error)
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    )
  }
}
