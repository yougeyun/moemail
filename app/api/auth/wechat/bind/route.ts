import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { createDb } from "@/lib/db"
import { users } from "@/lib/schema"
import { wechatBindSchema } from "@/lib/validation"
import { comparePassword } from "@/lib/utils"
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
    const parsed = wechatBindSchema.safeParse(json)
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

    const db = createDb()
    const normalizedEmail = email.trim().toLowerCase()
    const user = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    })

    if (!user) {
      return NextResponse.json(
        { error: "该邮箱尚未注册" },
        { status: 404 }
      )
    }

    const isValid = await comparePassword(password, user.password as string)
    if (!isValid) {
      return NextResponse.json(
        { error: "原账号密码错误" },
        { status: 403 }
      )
    }

    const mailConfig = await getSystemMailConfig()

    if (mailConfig.mode === "link") {
      await createEmailVerification({
        email: normalizedEmail,
        purpose: "bind",
        userId: user.id,
        meta: JSON.stringify({ wechatOpenid: session.openid }),
        baseUrl: new URL(request.url).origin,
      })
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
      purpose: "bind",
    })

    await bindWechatOpenid({
      db,
      userId: user.id,
      openid: session.openid,
    })
    await db
      .update(users)
      .set({ emailVerified: new Date() })
      .where(eq(users.id, user.id))
    await attachMiniSessionUser(token, user.id)

    return NextResponse.json({
      success: true,
      bound: true,
      token,
      user: toPublicUser(user),
    })
  } catch (error) {
    console.error("WeChat bind failed:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "绑定失败" },
      { status: 500 }
    )
  }
}
