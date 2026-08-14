import { NextResponse } from "next/server"
import { and, eq, ne } from "drizzle-orm"
import { createDb } from "@/lib/db"
import { users } from "@/lib/schema"
import { getUserId } from "@/lib/apiKey"
import { userProfileSchema } from "@/lib/validation"

export const runtime = "edge"

export async function PATCH(request: Request) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "未授权" }, { status: 401 })
  }

  try {
    const json = await request.json()
    const parsed = userProfileSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "输入格式不正确" },
        { status: 400 }
      )
    }

    const username = parsed.data.username.trim()
    const db = createDb()
    const existing = await db.query.users.findFirst({
      where: and(eq(users.username, username), ne(users.id, userId)),
    })
    if (existing) {
      return NextResponse.json(
        { error: "该用户名已被占用" },
        { status: 409 }
      )
    }

    await db
      .update(users)
      .set({ username })
      .where(eq(users.id, userId))

    return NextResponse.json({ success: true, username })
  } catch (error) {
    console.error("Failed to update user profile:", error)
    return NextResponse.json(
      { error: "修改资料失败" },
      { status: 500 }
    )
  }
}
