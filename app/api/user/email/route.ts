import { NextResponse } from "next/server"
import { and, eq, ne } from "drizzle-orm"
import { createDb } from "@/lib/db"
import { users } from "@/lib/schema"
import { getUserId } from "@/lib/apiKey"
import { userEmailSchema } from "@/lib/validation"
import { comparePassword } from "@/lib/utils"
import { verifyEmailCode } from "@/lib/email-verification"
import { getSystemMailConfig } from "@/lib/system-mail"

export const runtime = "edge"

export async function POST(request: Request) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "未授权" }, { status: 401 })
  }

  try {
    const json = await request.json()
    const parsed = userEmailSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "输入格式不正确" },
        { status: 400 }
      )
    }

    const { email, password, code } = parsed.data
    const normalizedEmail = email.trim().toLowerCase()
    const db = createDb()
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })

    if (!user) {
      return NextResponse.json({ error: "账号不存在" }, { status: 404 })
    }

    if (!user.password) {
      return NextResponse.json(
        { error: "该账号暂未设置密码，无法绑定邮箱" },
        { status: 400 }
      )
    }

    const isValid = await comparePassword(password, user.password)
    if (!isValid) {
      return NextResponse.json({ error: "当前密码错误" }, { status: 403 })
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

    const mailConfig = await getSystemMailConfig()
    if (mailConfig.mode === "link") {
      return NextResponse.json({
        success: true,
        verificationRequired: true,
        mode: "link",
      })
    }

    if (!code) {
      return NextResponse.json(
        { error: "请输入邮箱验证码" },
        { status: 400 }
      )
    }

    await verifyEmailCode({
      email: normalizedEmail,
      code,
      purpose: "change-email",
    })

    await db
      .update(users)
      .set({
        email: normalizedEmail,
        emailVerified: new Date(),
      })
      .where(eq(users.id, userId))

    return NextResponse.json({
      success: true,
      email: normalizedEmail,
    })
  } catch (error) {
    console.error("Failed to bind user email:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "绑定邮箱失败" },
      { status: 500 }
    )
  }
}
