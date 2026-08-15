"use client"

import { User } from "next-auth"
import { useTranslations, useLocale } from "next-intl"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { signOut } from "next-auth/react"
import { Crown, Gem, Mail, Settings, Sword, User2, UserCog } from "lucide-react"
import { useRouter } from "next/navigation"
import { useRolePermission } from "@/hooks/use-role-permission"
import { PERMISSIONS, getRoleIcon } from "@/lib/permissions"
import { ROLE_ICON_MAP } from "./role-ui"
import { ActivationCodePanel } from "./activation-code-panel"

interface ProfileCardProps {
  user: User
}

const roleConfigs = {
  emperor: { key: "EMPEROR", icon: Crown },
  duke: { key: "DUKE", icon: Gem },
  knight: { key: "KNIGHT", icon: Sword },
  civilian: { key: "CIVILIAN", icon: User2 },
} as const

export function ProfileCard({ user }: ProfileCardProps) {
  const t = useTranslations("profile.card")
  const tAuth = useTranslations("auth.signButton")
  const tNav = useTranslations("common.nav")
  const tSettings = useTranslations("profile.settings")
  const tAdmin = useTranslations("profile.admin")
  const locale = useLocale()
  const router = useRouter()
  const { checkPermission } = useRolePermission()
  const canAdmin =
    checkPermission(PERMISSIONS.MANAGE_CONFIG) ||
    checkPermission(PERMISSIONS.MANAGE_ROLES) ||
    checkPermission(PERMISSIONS.PROMOTE_USER) ||
    checkPermission(PERMISSIONS.MANAGE_WEBHOOK)

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
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-2xl font-bold">{user.name}</h2>
            </div>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {user.email ? user.email : `${t("name")}: ${user.username}`}
            </p>
            {user.roles && (
              <div className="mt-2 flex gap-2">
                {user.roles.map((role) => {
                  const roleConfig =
                    roleConfigs[role.name as keyof typeof roleConfigs]
                  const Icon = ROLE_ICON_MAP[getRoleIcon(role)] || User2
                  const roleName =
                    role.displayName ||
                    (roleConfig ? t(`roles.${roleConfig.key}` as any) : role.name)
                  return (
                    <div
                      key={role.name}
                      className="flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-xs text-primary"
                      title={roleName}
                    >
                      <Icon className="h-3 w-3" />
                      {roleName}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <ActivationCodePanel />

      <div className="flex flex-col gap-4 px-1 sm:flex-row">
        <Button
          onClick={() => router.push(`/${locale}/moe`)}
          className="flex-1 gap-2"
        >
          <Mail className="h-4 w-4" />
          {tNav("backToMailbox")}
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push(`/${locale}/profile/settings`)}
          className="flex-1 gap-2"
        >
          <UserCog className="h-4 w-4" />
          {tSettings("editProfile")}
        </Button>
        {canAdmin && (
          <Button
            variant="outline"
            onClick={() => router.push(`/${locale}/profile/admin`)}
            className="flex-1 gap-2"
          >
            <Settings className="h-4 w-4" />
            {tAdmin("title")}
          </Button>
        )}
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
