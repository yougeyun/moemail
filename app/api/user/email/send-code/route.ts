import { NextResponse } from "next/server"
import { and, eq, ne } from "drizzle-orm"
import { createDb } from "@/lib/db"
import { users } from "@/lib/schema"
import { getUserId } from "@/lib/apiKey"
import { userEmailSendCodeSchema } from "@/lib/validation"
import { createEmailVerification } from "@/lib/email-verification"
import { comparePassword } from "@/lib/utils"

export const runtime = "edge"

export async function POST(request: Request) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "未授权" }, { status: 401 })
  }

  try {
    const json = await request.json()
    const parsed = userEmailSendCodeSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "输入格式不正确" },
        { status: 400 }
      )
    }

    const { email, password } = parsed.data
    const normalizedEmail = email.trim().toLowerCase()
    const db = createDb()
    const current = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })

    if (!current) {
      return NextResponse.json({ error: "账号不存在" }, { status: 404 })
    }

    if (!current.password) {
      return NextResponse.json(
        { error: "该账号暂未设置密码，无法绑定邮箱" },
        { status: 400 }
      )
    }

    const isValid = await comparePassword(password, current.password)
    if (!isValid) {
      return NextResponse.json({ error: "当前密码错误" }, { status: 403 })
    }

    if (current.email === normalizedEmail) {
      return NextResponse.json(
        { error: "该邮箱已经是当前账号的绑定邮箱" },
        { status: 400 }
      )
    }

    const existing = await db.query.users.findFirst({
      where: and(eq(users.email, normalizedEmail), ne(users.id, userId)),
    })
    if (existing) {
      return NextResponse.json(
        { error: "该邮箱已被其他账号绑定" },
        { status: 400 }
      )
    }

    const result = await createEmailVerification({
      email: normalizedEmail,
      purpose: "change-email",
      userId,
      baseUrl: new URL(request.url).origin,
    })

    return NextResponse.json({ success: true, mode: result.mode })
  } catch (error) {
    console.error("Failed to send email binding code:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "发送验证邮件失败" },
      { status: 500 }
    )
  }
}
