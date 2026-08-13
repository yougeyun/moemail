import { PERMISSIONS, ROLES } from "@/lib/permissions"
import { getRequestContext } from "@cloudflare/next-on-pages"
import { EMAIL_CONFIG } from "@/config"
import { checkPermission } from "@/lib/auth"
import { isTemplateId } from "@/templates/configs"
import { DEFAULT_SITE_NAME } from "@/lib/site-config"
import { createDb } from "@/lib/db"
import { roles, userRoles } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { getUserId } from "@/lib/apiKey"
import { getRoleEmailRules } from "@/lib/role-rules"

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
    activeTemplate,
    initialPoints
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
    env.SITE_CONFIG.get("ACTIVE_TEMPLATE"),
    env.SITE_CONFIG.get("INITIAL_POINTS")
  ])

  let icons = {}
  if (siteIcons) {
    try {
      icons = JSON.parse(siteIcons)
    } catch {
      icons = {}
    }
  }

  const domains = (emailDomains || "moemail.app")
    .split(",")
    .map((domain) => domain.trim())
    .filter(Boolean)

  const userId = await getUserId()
  let emailRules = {
    allowedDomains: null as string[] | null,
    allowedExpiries: null as number[] | null,
    defaultExpiry: null as number | null,
  }

  if (userId) {
    const db = createDb()
    const userRole = await db.query.userRoles.findFirst({
      where: eq(userRoles.userId, userId),
      with: { role: true },
    })

    if (userRole) {
      const rules = getRoleEmailRules({
        allowedDomains: userRole.role.allowedDomains,
        allowedExpiries: userRole.role.allowedExpiries,
        defaultExpiry: userRole.role.defaultExpiry,
      })
      emailRules = {
        allowedDomains: rules.allowedDomains
          ? rules.allowedDomains.filter((domain) => domains.includes(domain))
          : null,
        allowedExpiries: rules.allowedExpiries,
        defaultExpiry: rules.defaultExpiry,
      }
    }
  }

  return Response.json({
    defaultRole: defaultRole || ROLES.CIVILIAN,
    emailDomains: emailDomains || "moemail.app",
    adminContact: adminContact || "",
    maxEmails: maxEmails || EMAIL_CONFIG.MAX_ACTIVE_EMAILS.toString(),
    initialPoints: initialPoints ? Number(initialPoints) : 0,
    emailRules,
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
    initialPoints,
    turnstile,
    siteName,
    siteTitle,
    siteDescription,
    siteKeywords,
    logo,
    icons,
    activeTemplate
  } = await request.json() as { 
    defaultRole: string,
    emailDomains: string,
    adminContact: string,
    maxEmails: string,
    initialPoints?: number,
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
  
  const db = createDb()
  const defaultRoleRow = await db.query.roles.findFirst({
    where: eq(roles.name, defaultRole),
  })

  if (!defaultRoleRow || defaultRoleRow.name === ROLES.EMPEROR) {
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
    env.SITE_CONFIG.put("INITIAL_POINTS", String(Math.max(0, Number(initialPoints) || 0))),
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
