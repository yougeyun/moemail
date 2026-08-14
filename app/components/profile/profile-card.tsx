"use client"

import { User } from "next-auth"
import { useTranslations, useLocale } from "next-intl"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { signOut } from "next-auth/react"
import { Settings, Crown, Sword, User2, Gem, Mail } from "lucide-react"
import { useRouter } from "next/navigation"
import { WebhookConfig } from "./webhook-config"
import { PromotePanel } from "./promote-panel"
import { EmailServiceConfig } from "./email-service-config"
import { useRolePermission } from "@/hooks/use-role-permission"
import { PERMISSIONS, getRoleIcon } from "@/lib/permissions"
import { WebsiteConfigPanel } from "./website-config-panel"
import { ApiKeyPanel } from "./api-key-panel"
import { BrandSettingsPanel } from "./brand-settings-panel"
import { TemplateManagerPanel } from "./template-manager-panel"
import { RoleManagerPanel } from "./role-manager-panel"
import { ROLE_ICON_MAP } from "./role-ui"
import { MembershipShopPanel } from "./membership-shop-panel"
import { PaymentSettingsPanel } from "./payment-settings-panel"
import { ActivationCodePanel } from "./activation-code-panel"
import { ActivationCodeManagerPanel } from "./activation-code-manager-panel"
import { SystemMailPanel } from "./system-mail-panel"
import { WechatSettingsPanel } from "./wechat-settings-panel"
import { EmailBindingPanel } from "./email-binding-panel"

interface ProfileCardProps {
  user: User
}

const roleConfigs = {
  emperor: { key: 'EMPEROR', icon: Crown },
  duke: { key: 'DUKE', icon: Gem },
  knight: { key: 'KNIGHT', icon: Sword },
  civilian: { key: 'CIVILIAN', icon: User2 },
} as const

export function ProfileCard({ user }: ProfileCardProps) {
  const t = useTranslations("profile.card")
  const tAuth = useTranslations("auth.signButton")
  const tWebhook = useTranslations("profile.webhook")
  const tNav = useTranslations("common.nav")
  const locale = useLocale()
  const router = useRouter()
  const { checkPermission } = useRolePermission()
  const canManageWebhook = checkPermission(PERMISSIONS.MANAGE_WEBHOOK)
  const canPromote = checkPermission(PERMISSIONS.PROMOTE_USER)
  const canManageConfig = checkPermission(PERMISSIONS.MANAGE_CONFIG)
  const canManageRoles = checkPermission(PERMISSIONS.MANAGE_ROLES)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="panel-card">
        <div className="flex items-center gap-6">
          <div className="relative">
            {user.image && (
              <Image
                src={user.image}
                alt={user.name || tAuth("userAvatar")}
                width={80}
                height={80}
                className="rounded-2xl ring-2 ring-border"
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-2xl font-bold">{user.name}</h2>
            </div>
            <p className="text-sm text-muted-foreground truncate mt-1">
              {
                user.email ? user.email : `${t("name")}: ${user.username}`
              }
            </p>
            {user.roles && (
              <div className="flex gap-2 mt-2">
                {user.roles.map((role) => {
                  const roleConfig = roleConfigs[role.name as keyof typeof roleConfigs]
                  const Icon = ROLE_ICON_MAP[getRoleIcon(role)] || User2
                  const roleName =
                    role.displayName ||
                    (roleConfig ? t(`roles.${roleConfig.key}` as any) : role.name)
                  return (
                    <div
                      key={role.name}
                      className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded"
                      title={roleName}
                    >
                      <Icon className="w-3 h-3" />
                      {roleName}
                    </div>
                  )
                })}
              </div>
            )}
            {typeof user.points === "number" && (
              <div className="mt-2 text-sm text-muted-foreground">
                {t("points", { points: user.points })}
              </div>
            )}
          </div>
        </div>
      </div>

      <EmailBindingPanel initialEmail={user.email} />

      <MembershipShopPanel />
      <ActivationCodePanel />

      {canManageWebhook && (
      <div className="panel-card">
          <div className="mb-6 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Settings className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold">{tWebhook("title")}</h2>
          </div>
          <WebhookConfig />
        </div>
      )}

      {canManageConfig && <WebsiteConfigPanel />}
      {canManageConfig && <BrandSettingsPanel />}
      {canManageConfig && <TemplateManagerPanel />}
      {canManageConfig && <PaymentSettingsPanel />}
      {canManageConfig && <ActivationCodeManagerPanel />}
      {canManageConfig && <EmailServiceConfig />}
      {canManageConfig && <SystemMailPanel />}
      {canManageConfig && <WechatSettingsPanel />}
      {canManageRoles && <RoleManagerPanel />}
      {canPromote && <PromotePanel />}
      {canManageWebhook && <ApiKeyPanel />}

      <div className="flex flex-col sm:flex-row gap-4 px-1">
        <Button
          onClick={() => router.push(`/${locale}/moe`)}
          className="gap-2 flex-1"
        >
          <Mail className="w-4 h-4" />
          {tNav("backToMailbox")}
        </Button>
        <Button
          variant="outline"
          onClick={() => signOut({ callbackUrl: `/${locale}` })}
          className="flex-1"
        >
          {tAuth("logout")}
        </Button>
      </div>
    </div>
  )
} 
