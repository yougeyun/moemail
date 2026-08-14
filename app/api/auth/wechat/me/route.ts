import { NextResponse } from "next/server"
import { createDb } from "@/lib/db"
import {
  getMiniSession,
  getUserById,
  toPublicUser,
} from "@/lib/mini-session"
import { getActiveUserRole } from "@/lib/role-access"

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
  const activeRole = await getActiveUserRole(db, user.id)

  return NextResponse.json({
    bound: true,
    needsBinding: false,
    user: toPublicUser(user),
    role: activeRole
      ? {
          name: activeRole.role.name,
          displayName: activeRole.role.displayName,
          icon: activeRole.role.icon,
          expiresAt: activeRole.expiresAt
            ? activeRole.expiresAt.toISOString()
            : null,
        }
      : null,
  })
}
