import { redirect } from "next/navigation"
import { checkPermission } from "@/lib/auth"
import { PERMISSIONS } from "@/lib/permissions"

export const runtime = "edge"

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const [canConfig, canRoles, canPromote, canWebhook] = await Promise.all([
    checkPermission(PERMISSIONS.MANAGE_CONFIG),
    checkPermission(PERMISSIONS.MANAGE_ROLES),
    checkPermission(PERMISSIONS.PROMOTE_USER),
    checkPermission(PERMISSIONS.MANAGE_WEBHOOK),
  ])

  const firstSection = canConfig
    ? "website"
    : canRoles
      ? "members"
      : canPromote
        ? "users"
        : canWebhook
          ? "developer"
          : null

  redirect(
    firstSection
      ? `/${locale}/profile/admin/${firstSection}`
      : `/${locale}/profile`
  )
}
