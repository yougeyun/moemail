import { NextResponse } from "next/server"
import { confirmQrLogin } from "@/lib/qr-login"
import { getMiniSession } from "@/lib/mini-session"

export const runtime = "edge"

export async function POST(request: Request) {
  const sessionToken = request.headers.get("X-Session-Token")
  if (!sessionToken) {
    return NextResponse.json({ error: "请先登录小程序" }, { status: 401 })
  }

  const session = await getMiniSession(sessionToken)
  if (!session) {
    return NextResponse.json(
      { error: "登录状态已失效，请重新登录" },
      { status: 401 }
    )
  }
  if (!session.userId) {
    return NextResponse.json(
      { error: "请先在个人中心绑定邮箱" },
      { status: 403 }
    )
  }

  const { token } = (await request.json()) as { token?: string }
  if (!token) {
    return NextResponse.json({ error: "参数无效" }, { status: 400 })
  }

  try {
    await confirmQrLogin(token, session.userId)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "确认登录失败" },
      { status: 400 }
    )
  }
}
