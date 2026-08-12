import { PERMISSIONS, Role, ROLES } from "@/lib/permissions"
import { getRequestContext } from "@cloudflare/next-on-pages"
import { EMAIL_CONFIG } from "@/config"
import { checkPermission } from "@/lib/auth"
import { isTemplateId } from "@/templates/configs"
import { DEFAULT_SITE_NAME } from "@/lib/site-config"

export const runtime = "edge"

export async function GET() {
  const env = getRequestContext().env
  const canManageConfig = await checkPermission(PERMISSIONS.MANAGE_CONFIG)

  const [
    defaultRole,
    emailDomains,
    adminContact,
    maxEmails,
    turnstileEnabled,
    turnstileSiteKey,
    turnstileSecretKey,
    siteName,
    siteTitle,
    siteDescription,
    siteKeywords,
    siteLogo,
    siteIcons,
    activeTemplate
  ] = await Promise.all([
    env.SITE_CONFIG.get("DEFAULT_ROLE"),
    env.SITE_CONFIG.get("EMAIL_DOMAINS"),
    env.SITE_CONFIG.get("ADMIN_CONTACT"),
    env.SITE_CONFIG.get("MAX_EMAILS"),
    env.SITE_CONFIG.get("TURNSTILE_ENABLED"),
    env.SITE_CONFIG.get("TURNSTILE_SITE_KEY"),
    env.SITE_CONFIG.get("TURNSTILE_SECRET_KEY"),
    env.SITE_CONFIG.get("SITE_NAME"),
    env.SITE_CONFIG.get("SITE_TITLE"),
    env.SITE_CONFIG.get("SITE_DESCRIPTION"),
    env.SITE_CONFIG.get("SITE_KEYWORDS"),
    env.SITE_CONFIG.get("SITE_LOGO"),
    env.SITE_CONFIG.get("SITE_ICONS"),
    env.SITE_CONFIG.get("ACTIVE_TEMPLATE")
  ])

  let icons = {}
  if (siteIcons) {
    try {
      icons = JSON.parse(siteIcons)
    } catch {
      icons = {}
    }
  }

  return Response.json({
    defaultRole: defaultRole || ROLES.CIVILIAN,
    emailDomains: emailDomains || "moemail.app",
    adminContact: adminContact || "",
    maxEmails: maxEmails || EMAIL_CONFIG.MAX_ACTIVE_EMAILS.toString(),
    siteName: siteName || DEFAULT_SITE_NAME,
    siteTitle: siteTitle || "",
    siteDescription: siteDescription || "",
    siteKeywords: siteKeywords || "",
    hasLogo: Boolean(siteLogo),
    icons,
    activeTemplate: isTemplateId(activeTemplate) ? activeTemplate : "east-paper",
    turnstile: canManageConfig ? {
      enabled: turnstileEnabled === "true",
      siteKey: turnstileSiteKey || "",
      secretKey: turnstileSecretKey || "",
    } : undefined
  })
}

export async function POST(request: Request) {
  const canAccess = await checkPermission(PERMISSIONS.MANAGE_CONFIG)

  if (!canAccess) {
    return Response.json({
      error: "权限不足"
    }, { status: 403 })
  }

  const {
    defaultRole,
    emailDomains,
    adminContact,
    maxEmails,
    turnstile,
    siteName,
    siteTitle,
    siteDescription,
    siteKeywords,
    logo,
    icons,
    activeTemplate
  } = await request.json() as { 
    defaultRole: Exclude<Role, typeof ROLES.EMPEROR>,
    emailDomains: string,
    adminContact: string,
    maxEmails: string,
    siteName?: string,
    siteTitle?: string,
    siteDescription?: string,
    siteKeywords?: string,
    logo?: string,
    icons?: Record<string, string>,
    activeTemplate?: string,
    turnstile?: {
      enabled: boolean,
      siteKey: string,
      secretKey: string
    }
  }
  
  if (![ROLES.DUKE, ROLES.KNIGHT, ROLES.CIVILIAN].includes(defaultRole)) {
    return Response.json({ error: "无效的角色" }, { status: 400 })
  }

  const turnstileConfig = turnstile ?? {
    enabled: false,
    siteKey: "",
    secretKey: ""
  }

  if (turnstileConfig.enabled && (!turnstileConfig.siteKey || !turnstileConfig.secretKey)) {
    return Response.json({ error: "Turnstile 启用时需要提供 Site Key 和 Secret Key" }, { status: 400 })
  }

  const templateId = activeTemplate || "east-paper"
  if (!isTemplateId(templateId)) {
    return Response.json({ error: "无效的模板" }, { status: 400 })
  }

  if (logo && logo.length > 2_500_000) {
    return Response.json({ error: "Logo 图片过大" }, { status: 400 })
  }

  const iconPayload = icons && Object.keys(icons).length > 0 ? JSON.stringify(icons) : ""
  if (iconPayload.length > 4_000_000) {
    return Response.json({ error: "图标数据过大" }, { status: 400 })
  }

  const env = getRequestContext().env
  await Promise.all([
    env.SITE_CONFIG.put("DEFAULT_ROLE", defaultRole),
    env.SITE_CONFIG.put("EMAIL_DOMAINS", emailDomains),
    env.SITE_CONFIG.put("ADMIN_CONTACT", adminContact),
    env.SITE_CONFIG.put("MAX_EMAILS", maxEmails),
    env.SITE_CONFIG.put("TURNSTILE_ENABLED", turnstileConfig.enabled.toString()),
    env.SITE_CONFIG.put("TURNSTILE_SITE_KEY", turnstileConfig.siteKey),
    env.SITE_CONFIG.put("TURNSTILE_SECRET_KEY", turnstileConfig.secretKey),
    env.SITE_CONFIG.put("SITE_NAME", siteName || DEFAULT_SITE_NAME),
    env.SITE_CONFIG.put("SITE_TITLE", siteTitle || ""),
    env.SITE_CONFIG.put("SITE_DESCRIPTION", siteDescription || ""),
    env.SITE_CONFIG.put("SITE_KEYWORDS", siteKeywords || ""),
    env.SITE_CONFIG.put("SITE_LOGO", logo || ""),
    env.SITE_CONFIG.put("SITE_ICONS", iconPayload),
    env.SITE_CONFIG.put("ACTIVE_TEMPLATE", templateId)
  ])

  return Response.json({ success: true })
} 
