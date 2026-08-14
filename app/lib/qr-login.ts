import { getRequestContext } from "@cloudflare/next-on-pages"
import { nanoid } from "nanoid"

export const QR_LOGIN_TTL = 300
export const QR_TICKET_TTL = 60

export interface QrLoginRecord {
  status: "pending" | "confirmed" | "expired"
  createdAt: number
  userId?: string
  ticket?: string
  confirmedAt?: number
}

function getEnv() {
  try {
    return getRequestContext().env ?? null
  } catch {
    return null
  }
}

export async function createQrLoginRequest(): Promise<string> {
  const env = getEnv()
  if (!env?.SITE_CONFIG) {
    throw new Error("扫码登录服务暂不可用")
  }

  const token = nanoid(24)
  await env.SITE_CONFIG.put(
    `QR_LOGIN:${token}`,
    JSON.stringify({
      status: "pending",
      createdAt: Date.now(),
    } satisfies QrLoginRecord),
    { expirationTtl: QR_LOGIN_TTL }
  )
  return token
}

export async function getQrLoginRecord(
  token: string
): Promise<QrLoginRecord | null> {
  const env = getEnv()
  if (!env?.SITE_CONFIG) return null

  const raw = await env.SITE_CONFIG.get(`QR_LOGIN:${token}`)
  if (!raw) return null
  try {
    return JSON.parse(raw) as QrLoginRecord
  } catch {
    return null
  }
}

export async function deleteQrLoginRequest(token: string) {
  const env = getEnv()
  if (env?.SITE_CONFIG) {
    await env.SITE_CONFIG.delete(`QR_LOGIN:${token}`)
  }
}

export async function confirmQrLogin(token: string, userId: string) {
  const env = getEnv()
  if (!env?.SITE_CONFIG) {
    throw new Error("扫码登录服务暂不可用")
  }

  const record = await getQrLoginRecord(token)
  if (!record || record.status !== "pending") {
    throw new Error("登录二维码已失效，请刷新后重试")
  }

  const ticket = nanoid(24)
  await env.SITE_CONFIG.put(
    `QR_TICKET:${ticket}`,
    JSON.stringify({ userId, createdAt: Date.now() }),
    { expirationTtl: QR_TICKET_TTL }
  )
  await env.SITE_CONFIG.put(
    `QR_LOGIN:${token}`,
    JSON.stringify({
      ...record,
      status: "confirmed",
      userId,
      ticket,
      confirmedAt: Date.now(),
    } satisfies QrLoginRecord),
    { expirationTtl: QR_TICKET_TTL }
  )
}

export async function consumeQrTicket(
  ticket: string
): Promise<string | null> {
  const env = getEnv()
  if (!env?.SITE_CONFIG) return null

  const raw = await env.SITE_CONFIG.get(`QR_TICKET:${ticket}`)
  if (!raw) return null

  try {
    const record = JSON.parse(raw) as { userId?: string }
    if (!record.userId) return null
    await env.SITE_CONFIG.delete(`QR_TICKET:${ticket}`)
    return record.userId
  } catch {
    return null
  }
}
