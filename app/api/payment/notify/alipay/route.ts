import { getRequestContext } from "@cloudflare/next-on-pages"
import { getPaymentConfig, verifyAlipayNotify } from "@/lib/payment"
import { completeRoleOrder } from "@/lib/role-order"

export const runtime = "edge"

export async function POST(request: Request) {
  const text = await request.text()
  const params = new URLSearchParams(text)
  const signature = params.get("sign") || ""
  const content = Array.from(params.entries())
    .filter(([key]) => key !== "sign" && key !== "sign_type")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&")

  try {
    const env = getRequestContext().env
    const config = await getPaymentConfig(env)
    if (!config.alipayPublicKey) {
      return new Response("fail", { status: 400 })
    }

    const valid = await verifyAlipayNotify({
      content,
      signature,
      publicKey: config.alipayPublicKey,
    })
    if (!valid) {
      return new Response("fail", { status: 400 })
    }

    const tradeStatus = params.get("trade_status")
    const outTradeNo = params.get("out_trade_no")
    const totalAmount = Number(params.get("total_amount") || "0")
    if (
      outTradeNo &&
      (tradeStatus === "TRADE_SUCCESS" || tradeStatus === "TRADE_FINISHED")
    ) {
      const ok = await completeRoleOrder(outTradeNo, totalAmount)
      if (!ok) {
        return new Response("fail", { status: 400 })
      }
    }

    return new Response("success")
  } catch (error) {
    console.error("Failed to handle Alipay notify:", error)
    return new Response("fail", { status: 500 })
  }
}
