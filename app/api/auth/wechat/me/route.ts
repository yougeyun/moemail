import { NextResponse } from "next/server"
import { createDb } from "@/lib/db"
import {
  getMiniSession,
  getUserById,
  toPublicUser,
} from "@/lib/mini-session"

export const runtime = "edge"

export async function GET(request: Request) {
  const token = request.headers.get("X-Session-Token")
  if (!token) {
    return NextResponse.json({ error: "未登录" }, { status: 401 })
  }

  const session = await getMiniSession(token)
  if (!session) {
    return NextResponse.json(
      { error: "登录状态已失效，请重新登录" },
      { status: 401 }
    )
  }

  if (!session.userId) {
    return NextResponse.json({
      needsBinding: true,
      bound: false,
    })
  }

  const db = createDb()
  const user = await getUserById(db, session.userId)
  if (!user) {
    return NextResponse.json({ error: "账号不存在" }, { status: 404 })
  }

  return NextResponse.json({
    bound: true,
    needsBinding: false,
    user: toPublicUser(user),
  })
}
