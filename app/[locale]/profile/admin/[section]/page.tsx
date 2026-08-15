import { redirect } from "next/navigation"
import type { Locale } from "@/i18n/config"
import { Header } from "@/components/layout/header"
import { auth, checkPermission } from "@/lib/auth"
import { PERMISSIONS } from "@/lib/permissions"
import { AdminSettingsLayout } from "@/components/profile/admin-settings-layout"
import { WebsiteConfigPanel } from "@/components/profile/website-config-panel"
import { BrandSettingsPanel } from "@/components/profile/brand-settings-panel"
import { TemplateManagerPanel } from "@/components/profile/template-manager-panel"
import { RoleManagerPanel } from "@/components/profile/role-manager-panel"
import { PromotePanel } from "@/components/profile/promote-panel"
import { ActivationCodeManagerPanel } from "@/components/profile/activation-code-manager-panel"
import { EmailServiceConfig } from "@/components/profile/email-service-config"
import { SystemMailPanel } from "@/components/profile/system-mail-panel"
import { WechatSettingsPanel } from "@/components/profile/wechat-settings-panel"
import { AdsSettingsPanel } from "@/components/profile/ads-settings-panel"
import { WebhookConfig } from "@/components/profile/webhook-config"
import { ApiKeyPanel } from "@/components/profile/api-key-panel"
import { TabSettingsPanel } from "@/components/profile/tab-settings-panel"

export const runtime = "edge"

const SECTION_ORDER = [
  "website",
  "members",
  "users",
  "activation",
  "email",
  "wechat",
  "navigation",
  "developer",
]

function renderSection(section: string, canRoles: boolean, canPromote: boolean) {
  switch (section) {
    case "website":
      return (
        <div className="space-y-6">
          <WebsiteConfigPanel />
          <BrandSettingsPanel />
          <TemplateManagerPanel />
        </div>
      )
    case "members":
      return canRoles ? <RoleManagerPanel /> : null
    case "users":
      return canPromote ? <PromotePanel /> : null
    case "activation":
      return <ActivationCodeManagerPanel />
    case "email":
      return (
        <div className="space-y-6">
          <EmailServiceConfig />
          <SystemMailPanel />
        </div>
      )
    case "wechat":
      return (
        <div className="space-y-6">
          <WechatSettingsPanel />
          <AdsSettingsPanel />
        </div>
      )
    case "navigation":
      return <TabSettingsPanel />
    case "developer":
      return (
        <div className="space-y-6">
          <div className="panel-card">
            <WebhookConfig />
          </div>
          <ApiKeyPanel />
        </div>
      )
    default:
      return null
  }
}

export default async function AdminSectionPage({
  params,
}: {
  params: Promise<{ locale: string; section: string }>
}) {
  const { locale, section } = await params
  const localeId = locale as Locale
  const session = await auth()
  if (!session?.user) {
    redirect(`/${localeId}`)
  }

  const [canConfig, canRoles, canPromote, canWebhook] = await Promise.all([
    checkPermission(PERMISSIONS.MANAGE_CONFIG),
    checkPermission(PERMISSIONS.MANAGE_ROLES),
    checkPermission(PERMISSIONS.PROMOTE_USER),
    checkPermission(PERMISSIONS.MANAGE_WEBHOOK),
  ])

  const sections = SECTION_ORDER.filter((key) => {
    if (
      key === "website" ||
      key === "activation" ||
      key === "email" ||
      key === "wechat" ||
      key === "navigation"
    ) {
      return canConfig
    }
    if (key === "members") return canRoles
    if (key === "users") return canPromote
    if (key === "developer") return canWebhook
    return false
  })

  if (!sections.includes(section)) {
    redirect(`/${localeId}/profile`)
  }

  return (
    <>
      <div className="app-bg relative min-h-screen">
        <div className="absolute inset-0 -z-10 bg-grid-neon opacity-40" />
        <div className="container mx-auto max-w-[1100px] px-4 lg:px-8">
          <Header />
          <main className="pb-12 pt-8">
            <AdminSettingsLayout active={section} sections={sections}>
              {renderSection(section, canRoles, canPromote)}
            </AdminSettingsLayout>
          </main>
        </div>
      </div>
    </>
  )
}
