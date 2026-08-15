import { getRequestContext } from "@cloudflare/next-on-pages"
import { checkPermission } from "@/lib/auth"
import { PERMISSIONS } from "@/lib/permissions"

export const runtime = "edge"

const TAB_KEYS = ["mailbox", "inbox", "send", "profile"] as const

export interface MiniTabItem {
  key: string
  label: string
  enabled: boolean
}

const DEFAULT_TABS: MiniTabItem[] = [
  { key: "mailbox", label: "邮箱", enabled: true },
  { key: "inbox", label: "收件箱", enabled: true },
  { key: "send", label: "发件", enabled: true },
  { key: "profile", label: "我的", enabled: true },
]

function normalizeTabs(value: unknown): MiniTabItem[] {
  if (!Array.isArray(value)) return DEFAULT_TABS
  const byKey = new Map<string, MiniTabItem>()
  for (const item of value) {
    if (
      typeof item !== "object" ||
      item === null ||
      !TAB_KEYS.includes((item as MiniTabItem).key as never)
    ) {
      continue
    }
    const key = (item as MiniTabItem).key
    byKey.set(key, {
      key,
      label:
        typeof (item as MiniTabItem).label === "string" &&
        (item as MiniTabItem).label.trim()
          ? (item as MiniTabItem).label.trim()
          : DEFAULT_TABS.find((tab) => tab.key === key)?.label || key,
      enabled: Boolean((item as MiniTabItem).enabled),
    })
  }
  return DEFAULT_TABS.map(
    (tab) => byKey.get(tab.key) || { ...tab }
  )
}

export async function GET() {
  try {
    const env = getRequestContext().env
    const raw = await env.SITE_CONFIG.get("TABS_CONFIG")
    let tabs = DEFAULT_TABS
    if (raw) {
      try {
        tabs = normalizeTabs(JSON.parse(raw))
      } catch {
        tabs = DEFAULT_TABS
      }
    }
    return Response.json({ tabs })
  } catch (error) {
    console.error("Failed to load tab config:", error)
    return Response.json({ error: "获取底部导航配置失败" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const canManage = await checkPermission(PERMISSIONS.MANAGE_CONFIG)
  if (!canManage) {
    return Response.json({ error: "权限不足" }, { status: 403 })
  }

  try {
    const body = (await request.json()) as { tabs?: MiniTabItem[] }
    const tabs = normalizeTabs(body.tabs)
    const env = getRequestContext().env
    await env.SITE_CONFIG.put("TABS_CONFIG", JSON.stringify(tabs))
    return Response.json({ success: true, tabs })
  } catch (error) {
    console.error("Failed to save tab config:", error)
    return Response.json({ error: "保存底部导航配置失败" }, { status: 500 })
  }
}
