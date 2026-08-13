import { PERMISSIONS, Permission, ROLES } from "@/lib/permissions"

export const ROLE_ICON_OPTIONS = [
  "Crown",
  "Gem",
  "Sword",
  "User2",
  "Star",
  "Shield",
  "Zap",
  "Rocket",
  "Medal",
  "Heart",
  "Sparkles",
  "BadgeCheck",
] as const

export const ROLE_NAME_PATTERN = /^[a-z][a-z0-9_-]{1,31}$/

export function parseRolePermissions(value: unknown): Permission[] {
  if (!Array.isArray(value)) {
    return []
  }

  const allPermissions = Object.values(PERMISSIONS)
  return value.filter(
    (permission): permission is Permission =>
      typeof permission === "string" && allPermissions.includes(permission as Permission)
  )
}

export function normalizeDailyLimit(value: unknown): number {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < -1) {
    return -1
  }
  return parsed
}

export function isProtectedRole(name: string): boolean {
  return name === ROLES.EMPEROR || name === ROLES.CIVILIAN
}

export function isRoleIcon(value: unknown): value is (typeof ROLE_ICON_OPTIONS)[number] {
  return typeof value === "string" && ROLE_ICON_OPTIONS.includes(value as (typeof ROLE_ICON_OPTIONS)[number])
}
