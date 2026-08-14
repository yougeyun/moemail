import { getRequestContext } from "@cloudflare/next-on-pages"

export interface WechatConfig {
  enabled: boolean
  appId: string
  appSecret: string
}

export interface WechatSession {
  openid: string
  unionid?: string
  sessionKey?: string
}

export async function getWechatConfig(): Promise<WechatConfig> {
  const env = getRequestContext().env
  const [enabled, appId, appSecret] = await Promise.all([
    env.SITE_CONFIG.get("WECHAT_ENABLED"),
    env.SITE_CONFIG.get("WECHAT_APP_ID"),
    env.SITE_CONFIG.get("WECHAT_APP_SECRET"),
  ])

  return {
    enabled: enabled === "true",
    appId: appId || "",
    appSecret: appSecret || "",
  }
}

export async function exchangeWechatCode(code: string): Promise<WechatSession> {
  const config = await getWechatConfig()

  if (!config.enabled || !config.appId || !config.appSecret) {
    throw new Error("微信登录尚未配置，请在管理后台填写小程序 AppID 和密钥")
  }

  const params = new URLSearchParams({
    appid: config.appId,
    secret: config.appSecret,
    js_code: code,
    grant_type: "authorization_code",
  })

  const response = await fetch(
    `https://api.weixin.qq.com/sns/jscode2session?${params.toString()}`,
    { cache: "no-store" }
  )

  if (!response.ok) {
    throw new Error("微信登录服务暂时不可用")
  }

  const data = (await response.json()) as {
    openid?: string
    unionid?: string
    session_key?: string
    errcode?: number
    errmsg?: string
  }

  if (data.errcode) {
    throw new Error(data.errmsg || `微信登录失败（${data.errcode}）`)
  }

  if (!data.openid) {
    throw new Error("微信登录失败：未获取到用户标识")
  }

  return {
    openid: data.openid,
    unionid: data.unionid,
    sessionKey: data.session_key,
  }
}
