import { NextResponse } from "next/server"
import { createMiniProgramQrCode, getWechatConfig } from "@/lib/wechat"
import {
  createQrLoginRequest,
  deleteQrLoginRequest,
  QR_LOGIN_TTL,
} from "@/lib/qr-login"

export const runtime = "edge"

export async function POST() {
  try {
    const wechat = await getWechatConfig()
    if (!wechat.enabled || !wechat.appId || !wechat.appSecret) {
      return NextResponse.json(
        { error: "微信扫码登录尚未配置" },
        { status: 400 }
      )
    }

    const token = await createQrLoginRequest()
    let qrCode: string
    try {
      qrCode = await createMiniProgramQrCode(token)
    } catch (error) {
      await deleteQrLoginRequest(token)
      throw error
    }

    return NextResponse.json({
      token,
      qrCode,
      expiresIn: QR_LOGIN_TTL,
    })
  } catch (error) {
    console.error("Failed to create QR login:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "生成登录二维码失败" },
      { status: 500 }
    )
  }
}
