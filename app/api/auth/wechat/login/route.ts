import { NextResponse } from "next/server"
import { exchangeWechatCode } from "@/lib/wechat"
import {
  createMiniSession,
  findUserByOpenid,
  toPublicUser,
} from "@/lib/mini-session"

export const runtime = "edge"

export async function POST(request: Request) {
  try {
    const { code } = (await request.json()) as { code?: string }
    if (!code || typeof code !== "string" || code.length < 4) {
      return NextResponse.json(
        { error: "微信登录参数无效" },
        { status: 400 }
      )
    }

    const session = await exchangeWechatCode(code)
    const existingUser = await findUserByOpenid(session.openid)

    if (existingUser) {
      const token = await createMiniSession({
        openid: session.openid,
        userId: existingUser.id,
      })
      return NextResponse.json({
        bound: true,
        needsBinding: false,
        token,
        user: toPublicUser(existingUser),
      })
    }

    const token = await createMiniSession({
      openid: session.openid,
    })

    return NextResponse.json({
      bound: false,
      needsBinding: true,
      token,
    })
  } catch (error) {
    console.error("WeChat login failed:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "微信登录失败" },
      { status: 500 }
    )
  }
}
