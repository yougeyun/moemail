import { NextResponse } from "next/server"
import { getRequestContext } from "@cloudflare/next-on-pages"
import {
  decryptWechatResource,
  getPaymentConfig,
  verifyWechatPayNotify,
} from "@/lib/payment"
import { completeRoleOrder } from "@/lib/role-order"

export const runtime = "edge"

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get("Wechatpay-Signature") || ""
  const timestamp = request.headers.get("Wechatpay-Timestamp") || ""
  const nonce = request.headers.get("Wechatpay-Nonce") || ""

  try {
    const env = getRequestContext().env
    const config = await getPaymentConfig(env)
    if (!config.wechatPlatformPublicKey || !config.wechatApiV3Key) {
      return NextResponse.json(
        { code: "FAIL", message: "微信支付回调配置不完整" },
        { status: 400 }
      )
    }

    const valid = await verifyWechatPayNotify({
      body,
      signature,
      timestamp,
      nonce,
      platformPublicKey: config.wechatPlatformPublicKey,
    })
    if (!valid) {
      return NextResponse.json(
        { code: "FAIL", message: "回调签名验证失败" },
        { status: 400 }
      )
    }

    const parsed = JSON.parse(body) as {
      resource?: {
        ciphertext?: string
        nonce?: string
        associated_data?: string
      }
    }
    const resource = parsed.resource
    if (!resource?.ciphertext || !resource.nonce) {
      return NextResponse.json(
        { code: "FAIL", message: "回调内容无效" },
        { status: 400 }
      )
    }

    const plain = await decryptWechatResource({
      ciphertext: resource.ciphertext,
      nonce: resource.nonce,
      associatedData: resource.associated_data,
      apiV3Key: config.wechatApiV3Key,
    })
    const payment = JSON.parse(plain) as {
      out_trade_no?: string
      trade_state?: string
      amount?: { total?: number; currency?: string }
    }

    if (payment.trade_state === "SUCCESS" && payment.out_trade_no) {
      const amountYuan = payment.amount?.total
        ? payment.amount.total / 100
        : undefined
      const ok = await completeRoleOrder(payment.out_trade_no, amountYuan)
      if (!ok) {
        return NextResponse.json(
          { code: "FAIL", message: "订单处理失败" },
          { status: 400 }
        )
      }
    }

    return NextResponse.json({ code: "SUCCESS", message: "成功" })
  } catch (error) {
    console.error("Failed to handle WeChat payment notify:", error)
    return NextResponse.json(
      { code: "FAIL", message: "处理失败" },
      { status: 500 }
    )
  }
}
