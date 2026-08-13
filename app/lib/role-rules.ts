export interface RoleEmailRulesSource {
  allowedDomains?: string | string[] | null
  allowedExpiries?: string | number[] | null
  defaultExpiry?: number | null
}

export interface RoleEmailRules {
  allowedDomains: string[] | null
  allowedExpiries: number[] | null
  defaultExpiry: number | null
}

export function getRoleEmailRules(role: RoleEmailRulesSource): RoleEmailRules {
  return {
    allowedDomains: parseStringList(role.allowedDomains),
    allowedExpiries: parseNumberList(role.allowedExpiries),
    defaultExpiry:
      typeof role.defaultExpiry === "number" && Number.isInteger(role.defaultExpiry)
        ? role.defaultExpiry
        : null,
  }
}

export function parseStringList(value: unknown): string[] | null {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string")
  }
  if (typeof value === "string" && value) {
    try {
      const parsed = JSON.parse(value) as unknown
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === "string")
      }
    } catch {
      return null
    }
  }
  return null
}

export function parseNumberList(value: unknown): number[] | null {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is number => typeof item === "number" && Number.isInteger(item)
    )
  }
  if (typeof value === "string" && value) {
    try {
      const parsed = JSON.parse(value) as unknown
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (item): item is number => typeof item === "number" && Number.isInteger(item)
        )
      }
    } catch {
      return null
    }
  }
  return null
}

export interface RoleDurationOption {
  days: number
  price: number
}

export function getRoleDurationOptions(
  value: string | RoleDurationOption[] | null | undefined
): RoleDurationOption[] {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is RoleDurationOption =>
        typeof item === "object" &&
        item !== null &&
        Number.isInteger(item.days) &&
        item.days >= 1 &&
        Number.isInteger(item.price) &&
        item.price >= 0
    )
  }

  if (typeof value === "string" && value) {
    try {
      const parsed = JSON.parse(value) as unknown
      if (Array.isArray(parsed)) {
        return getRoleDurationOptions(parsed)
      }
    } catch {
      return []
    }
  }

  return []
}
