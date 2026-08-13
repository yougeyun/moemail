import { getRequestContext } from "@cloudflare/next-on-pages"

export type SystemMailMode = "code" | "link"

export interface SystemMailConfig {
  enabled: boolean
  mode: SystemMailMode
  relayUrl: string
  relayToken: string
  fromEmail: string
  fromName: string
}

export async function getSystemMailConfig(): Promise<SystemMailConfig> {
  const env = getRequestContext().env
  const [enabled, mode, relayUrl, relayToken, fromEmail, fromName] =
    await Promise.all([
      env.SITE_CONFIG.get("SYSTEM_MAIL_ENABLED"),
      env.SITE_CONFIG.get("SYSTEM_MAIL_MODE"),
      env.SITE_CONFIG.get("SYSTEM_MAIL_RELAY_URL"),
      env.SITE_CONFIG.get("SYSTEM_MAIL_RELAY_TOKEN"),
      env.SITE_CONFIG.get("SYSTEM_MAIL_FROM_EMAIL"),
      env.SITE_CONFIG.get("SYSTEM_MAIL_FROM_NAME"),
    ])

  return {
    enabled: enabled === "true",
    mode: mode === "link" ? "link" : "code",
    relayUrl: relayUrl || "",
    relayToken: relayToken || "",
    fromEmail: fromEmail || "",
    fromName: fromName || "",
  }
}

export async function sendSystemMail(input: {
  to: string
  subject: string
  html: string
}) {
  const config = await getSystemMailConfig()

  if (!config.enabled) {
    throw new Error("系统邮件服务未启用")
  }
  if (!config.relayUrl) {
    throw new Error("系统邮件中转地址未配置")
  }
  if (!config.fromEmail) {
    throw new Error("系统邮件发件地址未配置")
  }

  const response = await fetch(config.relayUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Relay-Token": config.relayToken,
    },
    body: JSON.stringify({
      to: input.to,
      subject: input.subject,
      html: input.html,
      fromEmail: config.fromEmail,
      fromName: config.fromName,
    }),
  })

  if (!response.ok) {
    const errorData = (await response.json().catch(() => null)) as {
      error?: string
    } | null
    throw new Error(errorData?.error || "系统邮件发送失败")
  }
}
