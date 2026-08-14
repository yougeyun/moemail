export interface PaymentConfig {
  wechatEnabled: boolean
  wechatAppId: string
  wechatMchId: string
  wechatSerialNo: string
  wechatPrivateKey: string
  wechatPlatformPublicKey: string
  wechatApiV3Key: string
  wechatNotifyUrl: string
  alipayEnabled: boolean
  alipayAppId: string
  alipayPrivateKey: string
  alipayPublicKey: string
  alipayNotifyUrl: string
}

export async function getPaymentConfig(
  env: CloudflareEnv
): Promise<PaymentConfig> {
  const [
    wechatEnabled,
    wechatAppId,
    wechatMchId,
    wechatSerialNo,
    wechatPrivateKey,
    wechatPlatformPublicKey,
    wechatApiV3Key,
    wechatNotifyUrl,
    alipayEnabled,
    alipayAppId,
    alipayPrivateKey,
    alipayPublicKey,
    alipayNotifyUrl,
  ] = await Promise.all([
    env.SITE_CONFIG.get("WECHAT_PAY_ENABLED"),
    env.SITE_CONFIG.get("WECHAT_PAY_APP_ID"),
    env.SITE_CONFIG.get("WECHAT_PAY_MCH_ID"),
    env.SITE_CONFIG.get("WECHAT_PAY_SERIAL_NO"),
    env.SITE_CONFIG.get("WECHAT_PAY_PRIVATE_KEY"),
    env.SITE_CONFIG.get("WECHAT_PAY_PLATFORM_PUBLIC_KEY"),
    env.SITE_CONFIG.get("WECHAT_PAY_API_V3_KEY"),
    env.SITE_CONFIG.get("WECHAT_PAY_NOTIFY_URL"),
    env.SITE_CONFIG.get("ALIPAY_ENABLED"),
    env.SITE_CONFIG.get("ALIPAY_APP_ID"),
    env.SITE_CONFIG.get("ALIPAY_PRIVATE_KEY"),
    env.SITE_CONFIG.get("ALIPAY_PUBLIC_KEY"),
    env.SITE_CONFIG.get("ALIPAY_NOTIFY_URL"),
  ])

  return {
    wechatEnabled: wechatEnabled === "true",
    wechatAppId: wechatAppId || "",
    wechatMchId: wechatMchId || "",
    wechatSerialNo: wechatSerialNo || "",
    wechatPrivateKey: wechatPrivateKey || "",
    wechatPlatformPublicKey: wechatPlatformPublicKey || "",
    wechatApiV3Key: wechatApiV3Key || "",
    wechatNotifyUrl: wechatNotifyUrl || "",
    alipayEnabled: alipayEnabled === "true",
    alipayAppId: alipayAppId || "",
    alipayPrivateKey: alipayPrivateKey || "",
    alipayPublicKey: alipayPublicKey || "",
    alipayNotifyUrl: alipayNotifyUrl || "",
  }
}

export async function verifyWechatPayNotify(input: {
  body: string
  signature: string
  timestamp: string
  nonce: string
  platformPublicKey: string
}): Promise<boolean> {
  try {
    const key = await importRsaPublicKey(input.platformPublicKey)
    const message = `${input.timestamp}\n${input.nonce}\n${input.body}\n`
    const signatureBytes = base64ToBytes(input.signature)
    return await crypto.subtle.verify(
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      key,
      signatureBytes,
      new TextEncoder().encode(message)
    )
  } catch {
    return false
  }
}

export async function decryptWechatResource(input: {
  ciphertext: string
  nonce: string
  associatedData?: string
  apiV3Key: string
}): Promise<string> {
  const keyBytes = new TextEncoder().encode(input.apiV3Key)
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  )
  const plain = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: new TextEncoder().encode(input.nonce),
      additionalData: input.associatedData
        ? new TextEncoder().encode(input.associatedData)
        : undefined,
      tagLength: 128,
    },
    key,
    base64ToBytes(input.ciphertext)
  )
  return new TextDecoder().decode(plain)
}

export async function verifyAlipayNotify(input: {
  content: string
  signature: string
  publicKey: string
}): Promise<boolean> {
  try {
    const key = await importRsaPublicKey(input.publicKey)
    return await crypto.subtle.verify(
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      key,
      base64ToBytes(input.signature),
      new TextEncoder().encode(input.content)
    )
  } catch {
    return false
  }
}

export async function createProviderPayment({
  orderId,
  amountYuan,
  title,
  method,
  config,
}: {
  orderId: string
  amountYuan: number
  title: string
  method: "wechat" | "alipay"
  config: PaymentConfig
}): Promise<{ paymentUrl?: string; paymentQr?: string }> {
  if (method === "wechat") {
    if (
      !config.wechatEnabled ||
      !config.wechatAppId ||
      !config.wechatMchId ||
      !config.wechatSerialNo ||
      !config.wechatPrivateKey ||
      !config.wechatNotifyUrl
    ) {
      throw new Error("微信支付未配置")
    }

    const path = "/v3/pay/transactions/native"
    const body = JSON.stringify({
      appid: config.wechatAppId,
      mchid: config.wechatMchId,
      description: title,
      out_trade_no: orderId,
      notify_url: config.wechatNotifyUrl,
      amount: {
        total: Math.max(1, Math.round(amountYuan * 100)),
        currency: "CNY",
      },
    })
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const nonce = crypto.randomUUID().replace(/-/g, "")
    const message = `POST\n${path}\n${timestamp}\n${nonce}\n${body}\n`
    const signature = await signRsaSha256(config.wechatPrivateKey, message)
    const authorization =
      `WECHATPAY2-SHA256-RSA2048 mchid="${config.wechatMchId}",` +
      `nonce_str="${nonce}",timestamp="${timestamp}",` +
      `serial_no="${config.wechatSerialNo}",signature="${signature}"`

    const response = await fetch(`https://api.mch.weixin.qq.com${path}`, {
      method: "POST",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body,
    })

    const data = await response.json() as { code_url?: string; message?: string }
    if (!response.ok || !data.code_url) {
      throw new Error(data.message || "微信下单失败")
    }
    return { paymentQr: data.code_url }
  }

  if (
    !config.alipayEnabled ||
    !config.alipayAppId ||
    !config.alipayPrivateKey ||
    !config.alipayNotifyUrl
  ) {
    throw new Error("支付宝未配置")
  }

  const params: Record<string, string> = {
    app_id: config.alipayAppId,
    method: "alipay.trade.page.pay",
    format: "JSON",
    charset: "utf-8",
    sign_type: "RSA2",
    timestamp: new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "").replace("T", " ").replace("Z", ""),
    version: "1.0",
    notify_url: config.alipayNotifyUrl,
    return_url: config.alipayNotifyUrl,
    biz_content: JSON.stringify({
      out_trade_no: orderId,
      total_amount: amountYuan.toFixed(2),
      subject: title,
      product_code: "FAST_INSTANT_TRADE_PAY",
    }),
  }

  const sortedKeys = Object.keys(params).sort()
  const signContent = sortedKeys
    .map((key) => `${key}=${params[key]}`)
    .join("&")
  const sign = await signRsaSha256(config.alipayPrivateKey, signContent)
  const query = sortedKeys
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join("&")

  return {
    paymentUrl: `https://openapi.alipay.com/gateway.do?${query}&sign=${encodeURIComponent(sign)}`,
  }
}

export async function createWechatJsapiPayment({
  orderId,
  amountYuan,
  title,
  openid,
  config,
}: {
  orderId: string
  amountYuan: number
  title: string
  openid: string
  config: PaymentConfig
}) {
  if (
    !config.wechatEnabled ||
    !config.wechatAppId ||
    !config.wechatMchId ||
    !config.wechatSerialNo ||
    !config.wechatPrivateKey ||
    !config.wechatNotifyUrl
  ) {
    throw new Error("微信支付未配置")
  }

  const path = "/v3/pay/transactions/jsapi"
  const body = JSON.stringify({
    appid: config.wechatAppId,
    mchid: config.wechatMchId,
    description: title,
    out_trade_no: orderId,
    notify_url: config.wechatNotifyUrl,
    amount: {
      total: Math.max(1, Math.round(amountYuan * 100)),
      currency: "CNY",
    },
    payer: {
      openid,
    },
  })
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const nonce = crypto.randomUUID().replace(/-/g, "")
  const message = `POST\n${path}\n${timestamp}\n${nonce}\n${body}\n`
  const signature = await signRsaSha256(config.wechatPrivateKey, message)
  const authorization =
    `WECHATPAY2-SHA256-RSA2048 mchid="${config.wechatMchId}",` +
    `nonce_str="${nonce}",timestamp="${timestamp}",` +
    `serial_no="${config.wechatSerialNo}",signature="${signature}"`

  const response = await fetch(`https://api.mch.weixin.qq.com${path}`, {
    method: "POST",
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body,
  })

  const data = (await response.json()) as {
    prepay_id?: string
    message?: string
  }
  if (!response.ok || !data.prepay_id) {
    throw new Error(data.message || "微信小程序下单失败")
  }

  const payMessage =
    `${config.wechatAppId}\n${timestamp}\n${nonce}\nprepay_id=${data.prepay_id}\n`
  const paySign = await signRsaSha256(config.wechatPrivateKey, payMessage)

  return {
    timeStamp: timestamp,
    nonceStr: nonce,
    package: `prepay_id=${data.prepay_id}`,
    signType: "RSA",
    paySign,
  }
}

async function signRsaSha256(privateKeyPem: string, content: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(privateKeyPem),
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  )
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(content)
  )
  return bytesToBase64(new Uint8Array(signature))
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const base64 = pem
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "")
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes.buffer
}

async function importRsaPublicKey(pem: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "spki",
    pemToArrayBuffer(pem),
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["verify"]
  )
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ""
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}
