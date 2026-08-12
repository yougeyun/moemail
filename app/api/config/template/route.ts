import { NextResponse } from "next/server"
import { getRequestContext } from "@cloudflare/next-on-pages"
import { checkPermission } from "@/lib/auth"
import { PERMISSIONS } from "@/lib/permissions"
import { isTemplateId } from "@/templates/configs"

export const runtime = "edge"

export async function POST(request: Request) {
  const canAccess = await checkPermission(PERMISSIONS.MANAGE_CONFIG)
  if (!canAccess) {
    return NextResponse.json({ error: "权限不足" }, { status: 403 })
  }

  try {
    const { activeTemplate } = (await request.json()) as {
      activeTemplate?: string
    }
    if (!isTemplateId(activeTemplate)) {
      return NextResponse.json({ error: "无效的模板" }, { status: 400 })
    }

    const env = getRequestContext().env
    await env.SITE_CONFIG.put("ACTIVE_TEMPLATE", activeTemplate as string)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to switch template:", error)
    return NextResponse.json({ error: "切换模板失败" }, { status: 500 })
  }
}
