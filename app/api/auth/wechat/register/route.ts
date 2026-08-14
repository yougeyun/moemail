import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { createDb } from "@/lib/db"
import { users } from "@/lib/schema"
import { registerWithEmail } from "@/lib/auth"
import { wechatRegisterSchema } from "@/lib/validation"
import { verifyEmailCode, createEmailVerification } from "@/lib/email-verification"
import { getSystemMailConfig } from "@/lib/system-mail"
import {
  attachMiniSessionUser,
  bindWechatOpenid,
  getMiniSession,
  toPublicUser,
} from "@/lib/mini-session"

export const runtime = "edge"

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const parsed = wechatRegisterSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "输入格式不正确" },
        { status: 400 }
      )
    }

    const { token, email, password, code } = parsed.data
    const session = await getMiniSession(token)
    if (!session) {
      return NextResponse.json(
        { error: "登录状态已失效，请重新登录" },
        { status: 401 }
      )
    }
    if (session.userId) {
      return NextResponse.json(
        { error: "当前微信已绑定账号" },
        { status: 400 }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()
    const db = createDb()
    const mailConfig = await getSystemMailConfig()

    if (mailConfig.mode === "code") {
      if (!code) {
        return NextResponse.json(
          { error: "请输入邮箱验证码" },
          { status: 400 }
        )
      }
      await verifyEmailCode({
        email: normalizedEmail,
        code,
        purpose: "register",
      })

      const user = await registerWithEmail(normalizedEmail, password, {
        emailVerified: true,
      })

      try {
        await bindWechatOpenid({
          db,
          userId: user.id,
          openid: session.openid,
        })
        const attached = await attachMiniSessionUser(token, user.id)
        if (!attached) {
          throw new Error("登录状态已失效，请重新登录")
        }
      } catch (error) {
        await db.delete(users).where(eq(users.id, user.id))
        throw error
      }

      return NextResponse.json({
        success: true,
        bound: true,
        token,
        user: toPublicUser(user),
      })
    }

    const user = await registerWithEmail(normalizedEmail, password, {
      emailVerified: false,
    })

    try {
      await createEmailVerification({
        email: normalizedEmail,
        purpose: "register",
        userId: user.id,
        meta: JSON.stringify({ wechatOpenid: session.openid }),
        baseUrl: new URL(request.url).origin,
      })
    } catch (error) {
      await db.delete(users).where(eq(users.id, user.id))
      throw error
    }

    return NextResponse.json({
      success: true,
      verificationRequired: true,
      mode: "link",
      email: normalizedEmail,
    })
  } catch (error) {
    console.error("WeChat register failed:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "注册失败" },
      { status: 500 }
    )
  }
}
