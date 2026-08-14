import { NextResponse } from "next/server"
import { getRequestContext } from "@cloudflare/next-on-pages"
import { checkPermission } from "@/lib/auth"
import { PERMISSIONS } from "@/lib/permissions"
import { getWechatConfig } from "@/lib/wechat"

export const runtime = "edge"

export async function GET() {
  const canAccess = await checkPermission(PERMISSIONS.MANAGE_CONFIG)
  if (!canAccess) {
    return NextResponse.json({ error: "权限不足" }, { status: 403 })
  }

  const config = await getWechatConfig()
  return NextResponse.json(config)
}

export async function POST(request: Request) {
  const canAccess = await checkPermission(PERMISSIONS.MANAGE_CONFIG)
  if (!canAccess) {
    return NextResponse.json({ error: "权限不足" }, { status: 403 })
  }

  try {
    const body = (await request.json()) as {
      enabled?: boolean
      appId?: string
      appSecret?: string
      subscribeTemplateId?: string
    }
    const env = getRequestContext().env
    const current = await getWechatConfig()

    const enabled = Boolean(body.enabled ?? current.enabled)
    const appId = (body.appId ?? current.appId).trim()
    const appSecret =
      body.appSecret !== undefined && body.appSecret.trim()
        ? body.appSecret.trim()
        : current.appSecret
    const subscribeTemplateId = (
      body.subscribeTemplateId ?? current.subscribeTemplateId
    ).trim()

    if (enabled && (!appId || !appSecret)) {
      return NextResponse.json(
        { error: "启用微信登录前必须填写 AppID 和 AppSecret" },
        { status: 400 }
      )
    }

    await Promise.all([
      env.SITE_CONFIG.put("WECHAT_ENABLED", String(enabled)),
      env.SITE_CONFIG.put("WECHAT_APP_ID", appId),
      env.SITE_CONFIG.put("WECHAT_APP_SECRET", appSecret),
      env.SITE_CONFIG.put("WECHAT_SUBSCRIBE_TEMPLATE_ID", subscribeTemplateId),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to save WeChat config:", error)
    return NextResponse.json(
      { error: "保存微信配置失败" },
      { status: 500 }
    )
  }
}
