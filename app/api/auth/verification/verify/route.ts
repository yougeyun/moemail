import { NextResponse } from "next/server"
import { verifyEmailCode } from "@/lib/email-verification"

export const runtime = "edge"

export async function POST(request: Request) {
  try {
    const { email, code, purpose } = (await request.json()) as {
      email?: string
      code?: string
      purpose?: "register" | "bind"
    }

    if (!email || !code || !purpose) {
      return NextResponse.json(
        { error: "邮箱、验证码和用途都是必填项" },
        { status: 400 }
      )
    }

    await verifyEmailCode({
      email,
      code,
      purpose,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "验证失败" },
      { status: 400 }
    )
  }
}
