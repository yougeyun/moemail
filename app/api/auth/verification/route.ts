import { NextResponse } from "next/server"
import { verificationSchema } from "@/lib/validation"
import { createEmailVerification } from "@/lib/email-verification"
import { verifyTurnstileToken } from "@/lib/turnstile"
import { createDb } from "@/lib/db"
import { users } from "@/lib/schema"
import { eq } from "drizzle-orm"

export const runtime = "edge"

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const parsed = verificationSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "输入格式不正确" },
        { status: 400 }
      )
    }

    const { email, purpose, turnstileToken } = parsed.data
    const verification = await verifyTurnstileToken(turnstileToken)
    if (!verification.success) {
      return NextResponse.json(
        {
          error:
            verification.reason === "missing-token"
              ? "请先完成安全验证"
              : "安全验证未通过",
        },
        { status: 400 }
      )
    }

    const db = createDb()
    const normalizedEmail = email.trim().toLowerCase()
    const existing = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    })

    if (purpose === "register" && existing) {
      return NextResponse.json(
        { error: "该邮箱已注册，请直接登录或绑定已有账号" },
        { status: 400 }
      )
    }
    if (purpose === "bind" && !existing) {
      return NextResponse.json(
        { error: "该邮箱尚未注册" },
        { status: 400 }
      )
    }

    const baseUrl = new URL(request.url).origin
    const result = await createEmailVerification({
      email: normalizedEmail,
      purpose,
      userId: existing?.id,
      baseUrl,
    })

    return NextResponse.json({ success: true, mode: result.mode })
  } catch (error) {
    console.error("Failed to send verification:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "发送验证邮件失败" },
      { status: 500 }
    )
  }
}
