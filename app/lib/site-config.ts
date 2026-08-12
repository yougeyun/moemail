import { getRequestContext } from "@cloudflare/next-on-pages"
import {
  DEFAULT_TEMPLATE_ID,
  isTemplateId,
} from "@/templates/configs"

export interface SiteIcons {
  16?: string
  32?: string
  192?: string
  512?: string
}

export interface SiteBranding {
  siteName: string
  siteTitle: string
  siteDescription: string
  siteKeywords: string
  logo: string
  icons: SiteIcons
  activeTemplate: string
}

export const DEFAULT_SITE_NAME = "MoeMail"

function getEnv(): CloudflareEnv | null {
  try {
    const context = getRequestContext()
    return context?.env ?? null
  } catch {
    return null
  }
}

async function readKV(key: string): Promise<string | null> {
  const env = getEnv()
  if (!env?.SITE_CONFIG) return null
  try {
    return await env.SITE_CONFIG.get(key)
  } catch {
    return null
  }
}

export async function getActiveTemplateId(): Promise<string> {
  const stored = await readKV("ACTIVE_TEMPLATE")
  return isTemplateId(stored) ? (stored as string) : DEFAULT_TEMPLATE_ID
}

export async function getSiteBranding(): Promise<SiteBranding> {
  const [siteName, siteTitle, siteDescription, siteKeywords, logo, iconsRaw, activeTemplate] =
    await Promise.all([
      readKV("SITE_NAME"),
      readKV("SITE_TITLE"),
      readKV("SITE_DESCRIPTION"),
      readKV("SITE_KEYWORDS"),
      readKV("SITE_LOGO"),
      readKV("SITE_ICONS"),
      readKV("ACTIVE_TEMPLATE"),
    ])

  let icons: SiteIcons = {}
  if (iconsRaw) {
    try {
      icons = JSON.parse(iconsRaw) as SiteIcons
    } catch {
      icons = {}
    }
  }

  return {
    siteName: siteName || DEFAULT_SITE_NAME,
    siteTitle: siteTitle || "",
    siteDescription: siteDescription || "",
    siteKeywords: siteKeywords || "",
    logo: logo || "",
    icons,
    activeTemplate: isTemplateId(activeTemplate)
      ? (activeTemplate as string)
      : DEFAULT_TEMPLATE_ID,
  }
}

export interface DataUrlImage {
  mimeType: string
  bytes: Uint8Array
}

export function parseDataUrl(dataUrl: string): DataUrlImage | null {
  const match = /^data:([^;,]+);base64,(.+)$/.exec(dataUrl)
  if (!match) return null
  try {
    const bytes = Uint8Array.from(atob(match[2]), (char) => char.charCodeAt(0))
    return { mimeType: match[1], bytes }
  } catch {
    return null
  }
}
