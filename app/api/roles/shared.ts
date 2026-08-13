import { PERMISSIONS, Permission, ROLES } from "@/lib/permissions"
import { EXPIRY_OPTIONS } from "@/types/email"

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

export function normalizeDomains(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
}

export function normalizeExpiries(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return []
  }
  const validValues = EXPIRY_OPTIONS.map((option) => option.value)
  return value.filter(
    (item): item is number =>
      typeof item === "number" && validValues.includes(item)
  )
}

export function normalizeDefaultExpiry(value: unknown, allowedExpiries: number[]): number | null {
  if (value === null || value === undefined || value === "") {
    return null
  }
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 0) {
    return null
  }
  const validValues = EXPIRY_OPTIONS.map((option) => option.value)
  if (!validValues.includes(parsed)) {
    return null
  }
  if (allowedExpiries.length > 0 && !allowedExpiries.includes(parsed)) {
    return null
  }
  return parsed
}

export function normalizePrice(value: unknown): number {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 0) {
    return 0
  }
  return parsed
}

export function normalizeBoolean(value: unknown): boolean {
  return value === true
}

export function isProtectedRole(name: string): boolean {
  return name === ROLES.EMPEROR || name === ROLES.CIVILIAN
}

export function isRoleIcon(value: unknown): value is (typeof ROLE_ICON_OPTIONS)[number] {
  return typeof value === "string" && ROLE_ICON_OPTIONS.includes(value as (typeof ROLE_ICON_OPTIONS)[number])
}
