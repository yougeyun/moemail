import { NextResponse } from "next/server"
import { createDb } from "@/lib/db"
import { emails, messages } from "@/lib/schema"
import { and, eq } from "drizzle-orm"
import { getUserId } from "@/lib/apiKey"

export const runtime = "edge"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ messageId: string }> }
) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "未授权" }, { status: 401 })
  }

  try {
    const db = createDb()
    const { messageId } = await params
    const message = await db
      .select({ id: messages.id })
      .from(messages)
      .innerJoin(emails, eq(messages.emailId, emails.id))
      .where(
        and(
          eq(messages.id, messageId),
          eq(emails.userId, userId)
        )
      )
      .limit(1)

    if (!message[0]) {
      return NextResponse.json(
        { error: "邮件不存在或无权限" },
        { status: 404 }
      )
    }

    await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, messageId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to mark message as read:", error)
    return NextResponse.json(
      { error: "操作失败" },
      { status: 500 }
    )
  }
}
