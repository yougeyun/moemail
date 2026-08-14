import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { createDb } from "@/lib/db"
import { users } from "@/lib/schema"
import { verifyEmailToken } from "@/lib/email-verification"
import { bindWechatOpenid } from "@/lib/mini-session"

export const runtime = "edge"

export async function GET(request: Request) {
  try {
    const token = new URL(request.url).searchParams.get("token")
    if (!token) {
      return NextResponse.json({ error: "缺少激活参数" }, { status: 400 })
    }

    const record = await verifyEmailToken(token)

    if (record.userId) {
      const db = createDb()
      await db
        .update(users)
        .set({ emailVerified: new Date() })
        .where(eq(users.id, record.userId))

      if (record.meta) {
        try {
          const meta = JSON.parse(record.meta) as { wechatOpenid?: string }
          if (meta.wechatOpenid) {
            await bindWechatOpenid({
              db,
              userId: record.userId,
              openid: meta.wechatOpenid,
            })
          }
        } catch {
          // Ignore invalid meta; email activation still succeeds.
        }
      }
    }

    return new NextResponse(
      `<!DOCTYPE html>
      <html lang="zh-CN">
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>邮箱验证成功</title></head>
        <body style="font-family:sans-serif;background:#f3f6f7;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0">
          <div style="max-width:420px;width:92%;background:#fff;border-radius:12px;padding:34px;text-align:center;box-shadow:0 18px 50px rgba(15,23,32,.1)">
            <div style="width:56px;height:56px;margin:0 auto 16px;border-radius:50%;background:#e2f4ee;color:#0f9d7c;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:800">✓</div>
            <h1 style="margin:0 0 8px;font-size:20px">邮箱验证成功</h1>
            <p style="margin:0;color:#6b7280;font-size:14px">现在可以使用该邮箱登录 mail.59pk.net</p>
          </div>
        </body>
      </html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    )
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "激活失败" },
      { status: 400 }
    )
  }
}
