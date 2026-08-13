import { NextResponse } from "next/server"
import { checkPermission } from "@/lib/auth"
import { PERMISSIONS } from "@/lib/permissions"
import { sendSystemMail } from "@/lib/system-mail"

export const runtime = "edge"

export async function POST(request: Request) {
  const canAccess = await checkPermission(PERMISSIONS.MANAGE_CONFIG)
  if (!canAccess) {
    return NextResponse.json({ error: "权限不足" }, { status: 403 })
  }

  try {
    const { to } = (await request.json()) as { to?: string }
    if (!to) {
      return NextResponse.json(
        { error: "请填写测试收件邮箱" },
        { status: 400 }
      )
    }

    await sendSystemMail({
      to,
      subject: "系统邮件测试",
      html: "<p>这是一封来自 mail.59pk.net 的系统邮件测试。</p>",
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to send test mail:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "测试邮件发送失败" },
      { status: 500 }
    )
  }
}
