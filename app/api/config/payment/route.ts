import { getRequestContext } from "@cloudflare/next-on-pages"
import { checkPermission } from "@/lib/auth"
import { PERMISSIONS } from "@/lib/permissions"
import { getPaymentConfig } from "@/lib/payment"

export const runtime = "edge"

export async function GET() {
  const canManage = await checkPermission(PERMISSIONS.MANAGE_CONFIG)
  if (!canManage) {
    return Response.json({ error: "权限不足" }, { status: 403 })
  }

  try {
    const config = await getPaymentConfig(getRequestContext().env)
    return Response.json({
      wechatEnabled: config.wechatEnabled,
      wechatAppId: config.wechatAppId,
      wechatMchId: config.wechatMchId,
      wechatSerialNo: config.wechatSerialNo,
      wechatNotifyUrl: config.wechatNotifyUrl,
      wechatPrivateKeyConfigured: Boolean(config.wechatPrivateKey),
      wechatPlatformPublicKeyConfigured: Boolean(config.wechatPlatformPublicKey),
      wechatApiV3KeyConfigured: Boolean(config.wechatApiV3Key),
      alipayEnabled: config.alipayEnabled,
      alipayAppId: config.alipayAppId,
      alipayNotifyUrl: config.alipayNotifyUrl,
      alipayPrivateKeyConfigured: Boolean(config.alipayPrivateKey),
      alipayPublicKeyConfigured: Boolean(config.alipayPublicKey),
    })
  } catch (error) {
    console.error("Failed to load payment config:", error)
    return Response.json({ error: "获取支付配置失败" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const canManage = await checkPermission(PERMISSIONS.MANAGE_CONFIG)
  if (!canManage) {
    return Response.json({ error: "权限不足" }, { status: 403 })
  }

  try {
    const body = await request.json() as {
      wechatEnabled?: boolean
      wechatAppId?: string
      wechatMchId?: string
      wechatSerialNo?: string
      wechatPrivateKey?: string
      wechatPlatformPublicKey?: string
      wechatApiV3Key?: string
      wechatNotifyUrl?: string
      alipayEnabled?: boolean
      alipayAppId?: string
      alipayPrivateKey?: string
      alipayPublicKey?: string
      alipayNotifyUrl?: string
    }

    const env = getRequestContext().env
    const current = await getPaymentConfig(env)

    if (body.wechatEnabled) {
      if (
        !body.wechatAppId ||
        !body.wechatMchId ||
        !body.wechatSerialNo ||
        (!body.wechatPrivateKey && !current.wechatPrivateKey) ||
        (!body.wechatPlatformPublicKey && !current.wechatPlatformPublicKey) ||
        (!body.wechatApiV3Key && !current.wechatApiV3Key) ||
        !body.wechatNotifyUrl
      ) {
        return Response.json(
          { error: "启用微信支付需要完整填写 AppID、商户号、证书序列号、私钥、平台公钥、APIv3 密钥和回调地址" },
          { status: 400 }
        )
      }
    }

    if (body.alipayEnabled) {
      if (
        !body.alipayAppId ||
        (!body.alipayPrivateKey && !current.alipayPrivateKey) ||
        !body.alipayNotifyUrl
      ) {
        return Response.json(
          { error: "启用支付宝需要完整填写 AppID、应用私钥和回调地址" },
          { status: 400 }
        )
      }
    }

    await Promise.all([
      env.SITE_CONFIG.put("WECHAT_PAY_ENABLED", String(Boolean(body.wechatEnabled))),
      env.SITE_CONFIG.put("WECHAT_PAY_APP_ID", body.wechatAppId ?? current.wechatAppId),
      env.SITE_CONFIG.put("WECHAT_PAY_MCH_ID", body.wechatMchId ?? current.wechatMchId),
      env.SITE_CONFIG.put("WECHAT_PAY_SERIAL_NO", body.wechatSerialNo ?? current.wechatSerialNo),
      env.SITE_CONFIG.put("WECHAT_PAY_PRIVATE_KEY", body.wechatPrivateKey ?? current.wechatPrivateKey),
      env.SITE_CONFIG.put("WECHAT_PAY_PLATFORM_PUBLIC_KEY", body.wechatPlatformPublicKey ?? current.wechatPlatformPublicKey),
      env.SITE_CONFIG.put("WECHAT_PAY_API_V3_KEY", body.wechatApiV3Key ?? current.wechatApiV3Key),
      env.SITE_CONFIG.put("WECHAT_PAY_NOTIFY_URL", body.wechatNotifyUrl ?? current.wechatNotifyUrl),
      env.SITE_CONFIG.put("ALIPAY_ENABLED", String(Boolean(body.alipayEnabled))),
      env.SITE_CONFIG.put("ALIPAY_APP_ID", body.alipayAppId ?? current.alipayAppId),
      env.SITE_CONFIG.put("ALIPAY_PRIVATE_KEY", body.alipayPrivateKey ?? current.alipayPrivateKey),
      env.SITE_CONFIG.put("ALIPAY_PUBLIC_KEY", body.alipayPublicKey ?? current.alipayPublicKey),
      env.SITE_CONFIG.put("ALIPAY_NOTIFY_URL", body.alipayNotifyUrl ?? current.alipayNotifyUrl),
    ])

    return Response.json({ success: true })
  } catch (error) {
    console.error("Failed to save payment config:", error)
    return Response.json({ error: "保存支付配置失败" }, { status: 500 })
  }
}
