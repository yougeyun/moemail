export const ROLES = {
  EMPEROR: 'emperor',
  DUKE: 'duke',
  KNIGHT: 'knight',
  CIVILIAN: 'civilian',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

export const PERMISSIONS = {
  MANAGE_EMAIL: 'manage_email',
  MANAGE_WEBHOOK: 'manage_webhook',
  PROMOTE_USER: 'promote_user',
  MANAGE_ROLES: 'manage_roles',
  MANAGE_CONFIG: 'manage_config',
  MANAGE_API_KEY: 'manage_api_key',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [ROLES.EMPEROR]: Object.values(PERMISSIONS),
  [ROLES.DUKE]: [
    PERMISSIONS.MANAGE_EMAIL,
    PERMISSIONS.MANAGE_WEBHOOK,
    PERMISSIONS.MANAGE_API_KEY,
  ],
  [ROLES.KNIGHT]: [
    PERMISSIONS.MANAGE_EMAIL,
    PERMISSIONS.MANAGE_WEBHOOK,
  ],
  [ROLES.CIVILIAN]: [],
} as const;

export const BUILTIN_ROLE_ICONS: Record<Role, string> = {
  [ROLES.EMPEROR]: "Crown",
  [ROLES.DUKE]: "Gem",
  [ROLES.KNIGHT]: "Sword",
  [ROLES.CIVILIAN]: "User2",
}

export type RolePermissionSource = {
  name: string
  permissions?: string | string[] | null
}

export function getRolePermissions(role: RolePermissionSource): Permission[] {
  if (Array.isArray(role.permissions)) {
    return role.permissions.filter(isPermission)
  }

  if (typeof role.permissions === "string" && role.permissions) {
    try {
      const parsed = JSON.parse(role.permissions) as unknown
      if (Array.isArray(parsed)) {
        return parsed.filter(isPermission)
      }
    } catch {
      // Fall back to built-in permission map when stored JSON is invalid.
    }
  }

  return ROLE_PERMISSIONS[role.name as Role] ?? []
}

export function getRoleIcon(role: { name: string; icon?: string | null }): string {
  if (role.icon && role.icon !== "User2") {
    return role.icon
  }
  return BUILTIN_ROLE_ICONS[role.name as Role] || role.icon || "User2"
}

function isPermission(value: unknown): value is Permission {
  return typeof value === "string" && Object.values(PERMISSIONS).includes(value as Permission)
}

export function hasPermission(
  userRoles: RolePermissionSource[],
  permission: Permission
): boolean {
  return userRoles.some((role) => getRolePermissions(role).includes(permission))
}
