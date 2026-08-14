import { and, eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { createDb } from "@/lib/db"
import { wechatSubscriptions } from "@/lib/schema"
import { getMiniSession } from "@/lib/mini-session"
import { getWechatConfig } from "@/lib/wechat"

export const runtime = "edge"

async function getSessionUser(request: Request) {
  const token = request.headers.get("X-Session-Token")
  if (!token) return null
  const session = await getMiniSession(token)
  if (!session || !session.userId) return null
  return session
}

export async function GET(request: Request) {
  const session = await getSessionUser(request)
  if (!session) {
    return NextResponse.json(
      { error: "请先登录并绑定邮箱" },
      { status: 401 }
    )
  }

  const userId = session.userId
  const config = await getWechatConfig()
  const db = createDb()
  const record = await db.query.wechatSubscriptions.findFirst({
    where: and(
      eq(wechatSubscriptions.userId, userId!),
      eq(wechatSubscriptions.openid, session.openid)
    ),
  })

  return NextResponse.json({
    enabled: Boolean(record?.enabled),
    templateId: config.subscribeTemplateId,
  })
}

export async function POST(request: Request) {
  const session = await getSessionUser(request)
  if (!session) {
    return NextResponse.json(
      { error: "请先登录并绑定邮箱" },
      { status: 401 }
    )
  }

  const userId = session.userId
  try {
    const body = (await request.json()) as { enabled?: boolean }
    const enabled = Boolean(body.enabled)
    const config = await getWechatConfig()

    if (enabled && !config.subscribeTemplateId) {
      return NextResponse.json(
        { error: "新邮件提醒模板尚未配置" },
        { status: 400 }
      )
    }

    const db = createDb()
    const now = new Date()
    const existing = await db.query.wechatSubscriptions.findFirst({
      where: and(
        eq(wechatSubscriptions.userId, userId!),
        eq(wechatSubscriptions.openid, session.openid)
      ),
    })

    if (existing) {
      await db
        .update(wechatSubscriptions)
        .set({
          enabled,
          templateId: enabled ? config.subscribeTemplateId : existing.templateId,
          updatedAt: now,
        })
        .where(eq(wechatSubscriptions.id, existing.id))
    } else {
      await db.insert(wechatSubscriptions).values({
        userId: userId!,
        openid: session.openid,
        templateId: config.subscribeTemplateId,
        enabled,
        createdAt: now,
        updatedAt: now,
      })
    }

    return NextResponse.json({ success: true, enabled })
  } catch (error) {
    console.error("Failed to update subscribe preference:", error)
    return NextResponse.json(
      { error: "保存新邮件提醒设置失败" },
      { status: 500 }
    )
  }
}
