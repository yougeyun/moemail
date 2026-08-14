import { NextResponse } from "next/server"
import { and, eq } from "drizzle-orm"
import { createDb } from "@/lib/db"
import { accounts, users } from "@/lib/schema"
import { getUserId } from "@/lib/apiKey"

export const runtime = "edge"

export async function DELETE() {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "未授权" }, { status: 401 })
  }

  try {
    const db = createDb()
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })
    if (!user) {
      return NextResponse.json({ error: "账号不存在" }, { status: 404 })
    }
    if (!user.email) {
      return NextResponse.json(
        { error: "请先绑定邮箱，避免解绑微信后无法登录" },
        { status: 400 }
      )
    }

    const account = await db.query.accounts.findFirst({
      where: and(
        eq(accounts.provider, "wechat"),
        eq(accounts.userId, userId)
      ),
    })
    if (!account) {
      return NextResponse.json(
        { error: "当前账号未绑定微信" },
        { status: 404 }
      )
    }

    await db
      .delete(accounts)
      .where(
        and(
          eq(accounts.provider, "wechat"),
          eq(accounts.providerAccountId, account.providerAccountId)
        )
      )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to unbind WeChat:", error)
    return NextResponse.json(
      { error: "解绑微信失败" },
      { status: 500 }
    )
  }
}
