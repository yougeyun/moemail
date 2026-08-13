import { NextResponse } from "next/server"
import { getRequestContext } from "@cloudflare/next-on-pages"
import { checkPermission } from "@/lib/auth"
import { PERMISSIONS } from "@/lib/permissions"
import { getSystemMailConfig, SystemMailConfig } from "@/lib/system-mail"

export const runtime = "edge"

export async function GET() {
  const canAccess = await checkPermission(PERMISSIONS.MANAGE_CONFIG)
  if (!canAccess) {
    return NextResponse.json({ error: "权限不足" }, { status: 403 })
  }

  const config = await getSystemMailConfig()
  return NextResponse.json(config)
}

export async function POST(request: Request) {
  const canAccess = await checkPermission(PERMISSIONS.MANAGE_CONFIG)
  if (!canAccess) {
    return NextResponse.json({ error: "权限不足" }, { status: 403 })
  }

  try {
    const body = (await request.json()) as Partial<SystemMailConfig>
    const env = getRequestContext().env
    const current = await getSystemMailConfig()

    if (body.enabled && !body.relayUrl) {
      return NextResponse.json(
        { error: "启用系统邮件时必须配置中转地址" },
        { status: 400 }
      )
    }

    const relayToken =
      body.relayToken !== undefined && body.relayToken.trim()
        ? body.relayToken.trim()
        : current.relayToken

    await Promise.all([
      env.SITE_CONFIG.put(
        "SYSTEM_MAIL_ENABLED",
        String(Boolean(body.enabled ?? current.enabled))
      ),
      env.SITE_CONFIG.put(
        "SYSTEM_MAIL_MODE",
        body.mode === "link" ? "link" : "code"
      ),
      env.SITE_CONFIG.put(
        "SYSTEM_MAIL_RELAY_URL",
        (body.relayUrl ?? current.relayUrl).trim()
      ),
      env.SITE_CONFIG.put("SYSTEM_MAIL_RELAY_TOKEN", relayToken),
      env.SITE_CONFIG.put(
        "SYSTEM_MAIL_FROM_EMAIL",
        (body.fromEmail ?? current.fromEmail).trim()
      ),
      env.SITE_CONFIG.put(
        "SYSTEM_MAIL_FROM_NAME",
        (body.fromName ?? current.fromName).trim()
      ),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to save system mail config:", error)
    return NextResponse.json(
      { error: "保存系统邮件配置失败" },
      { status: 500 }
    )
  }
}
