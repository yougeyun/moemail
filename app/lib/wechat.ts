import { getRequestContext } from "@cloudflare/next-on-pages"

export interface WechatConfig {
  enabled: boolean
  appId: string
  appSecret: string
  subscribeTemplateId: string
}

export interface WechatSession {
  openid: string
  unionid?: string
  sessionKey?: string
}

export async function getWechatConfig(): Promise<WechatConfig> {
  const env = getRequestContext().env
  const [enabled, appId, appSecret, subscribeTemplateId] = await Promise.all([
    env.SITE_CONFIG.get("WECHAT_ENABLED"),
    env.SITE_CONFIG.get("WECHAT_APP_ID"),
    env.SITE_CONFIG.get("WECHAT_APP_SECRET"),
    env.SITE_CONFIG.get("WECHAT_SUBSCRIBE_TEMPLATE_ID"),
  ])

  return {
    enabled: enabled === "true",
    appId: appId || "",
    appSecret: appSecret || "",
    subscribeTemplateId: subscribeTemplateId || "",
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
    `https://api.weixin.qq.com/sns/jscode2session?${params.toString()}`
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

export async function getWechatAccessToken(): Promise<string> {
  const config = await getWechatConfig()
  if (!config.enabled || !config.appId || !config.appSecret) {
    throw new Error("微信登录尚未配置，请在管理后台填写小程序 AppID 和密钥")
  }

  const env = getRequestContext().env
  const cached = await env.SITE_CONFIG.get("WECHAT_ACCESS_TOKEN_CACHE")
  if (cached) {
    try {
      const parsed = JSON.parse(cached) as {
        token?: string
        expiresAt?: number
      }
      if (parsed.token && parsed.expiresAt && parsed.expiresAt > Date.now()) {
        return parsed.token
      }
    } catch {
      // Cache is invalid; refresh below.
    }
  }

  const params = new URLSearchParams({
    grant_type: "client_credential",
    appid: config.appId,
    secret: config.appSecret,
  })
  const response = await fetch(
    `https://api.weixin.qq.com/cgi-bin/token?${params.toString()}`
  )
  const data = (await response.json()) as {
    access_token?: string
    expires_in?: number
    errcode?: number
    errmsg?: string
  }

  if (!response.ok || !data.access_token) {
    throw new Error(data.errmsg || `获取微信访问令牌失败（${data.errcode || response.status}）`)
  }

  const expiresIn = Math.max(60, Number(data.expires_in) - 300)
  await env.SITE_CONFIG.put(
    "WECHAT_ACCESS_TOKEN_CACHE",
    JSON.stringify({
      token: data.access_token,
      expiresAt: Date.now() + expiresIn * 1000,
    }),
    { expirationTtl: expiresIn }
  )

  return data.access_token
}

export async function createMiniProgramQrCode(scene: string): Promise<string> {
  const accessToken = await getWechatAccessToken()
  const response = await fetch(
    `https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${accessToken}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        scene,
        page: "pages/qr-login/qr-login",
        check_path: false,
        env_version: "release",
      }),
    }
  )

  const contentType = response.headers.get("content-type") || ""
  if (contentType.includes("application/json")) {
    const data = (await response.json()) as {
      errcode?: number
      errmsg?: string
    }
    throw new Error(data.errmsg || `生成小程序码失败（${data.errcode || response.status}）`)
  }

  if (!response.ok) {
    throw new Error("生成小程序码失败")
  }

  const bytes = new Uint8Array(await response.arrayBuffer())
  return `data:image/png;base64,${bytesToBase64(bytes)}`
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ""
  const chunkSize = 0x8000
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize))
  }
  return btoa(binary)
}
