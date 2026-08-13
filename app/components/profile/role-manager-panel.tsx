"use client"

import { useCallback, useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import {
  Layers,
  Loader2,
  Lock,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { EMAIL_CONFIG } from "@/config"
import { PERMISSIONS, ROLES, getRoleIcon } from "@/lib/permissions"
import { ROLE_ICON_MAP, ROLE_ICON_OPTIONS } from "./role-ui"
import { EXPIRY_OPTIONS } from "@/types/email"
const PERMISSION_OPTIONS = Object.values(PERMISSIONS) as string[]

interface RoleItem {
  id: string
  name: string
  displayName: string | null
  description: string | null
  icon: string | null
  permissions: string[]
  dailyLimit: number | null
  maxEmails: number | null
  allowedDomains: string[] | null
  allowedExpiries: number[] | null
  defaultExpiry: number | null
  durationOptions: RoleDurationOption[]
  showUpperDomains: boolean
  price: number
  purchasable: boolean
  sortOrder: number
  isSystem: boolean
  userCount: number
}

interface RoleDurationOption {
  days: number
  price: number
}

interface RoleForm {
  name: string
  displayName: string
  description: string
  icon: string
  permissions: string[]
  dailyLimit: string
  maxEmails: string
  allowedDomains: string[]
  allowedExpiries: number[]
  defaultExpiry: string
  durationOptions: RoleDurationOption[]
  showUpperDomains: boolean
  price: string
  purchasable: boolean
  sortOrder: string
}

const EMPTY_FORM: RoleForm = {
  name: "",
  displayName: "",
  description: "",
  icon: "User2",
  permissions: [],
  dailyLimit: "-1",
  maxEmails: "",
  allowedDomains: [],
  allowedExpiries: [],
  defaultExpiry: "",
  durationOptions: [],
  showUpperDomains: false,
  price: "0",
  purchasable: false,
  sortOrder: "0",
}

export function RoleManagerPanel() {
  const t = useTranslations("profile.roleManager")
  const tCard = useTranslations("profile.card")
  const tExpiry = useTranslations("emails.create")
  const { toast } = useToast()
  const [roles, setRoles] = useState<RoleItem[]>([])
  const [availableDomains, setAvailableDomains] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<RoleItem | null>(null)
  const [form, setForm] = useState<RoleForm>(EMPTY_FORM)
  const [roleToDelete, setRoleToDelete] = useState<RoleItem | null>(null)

  const fetchRoles = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/roles")
      if (!res.ok) throw new Error("Failed to fetch roles")
      const data = await res.json() as {
        roles: RoleItem[]
        availableDomains?: string[]
      }
      setRoles(data.roles)
      setAvailableDomains(data.availableDomains || [])
    } catch {
      toast({ title: t("loadFailed"), variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [t, toast])

  useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  const builtInName = (name: string) => {
    if (name === ROLES.EMPEROR) return tCard("roles.EMPEROR")
    if (name === ROLES.DUKE) return tCard("roles.DUKE")
    if (name === ROLES.KNIGHT) return tCard("roles.KNIGHT")
    if (name === ROLES.CIVILIAN) return tCard("roles.CIVILIAN")
    return name
  }

  const roleName = (role: RoleItem) => role.displayName || builtInName(role.name)
  const permissionLabel = (permission: string) => t(`permissions.${permission}`)
  const expiryLabel = (value: number) => {
    if (value === EXPIRY_OPTIONS[0].value) return tExpiry("oneHour")
    if (value === EXPIRY_OPTIONS[1].value) return tExpiry("oneDay")
    if (value === EXPIRY_OPTIONS[2].value) return tExpiry("threeDays")
    if (value === EXPIRY_OPTIONS[3].value) return tExpiry("permanent")
    return String(value)
  }

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  const openEdit = (role: RoleItem) => {
    const effectiveLimit =
      role.dailyLimit ??
      EMAIL_CONFIG.DEFAULT_DAILY_SEND_LIMITS[
        role.name as keyof typeof EMAIL_CONFIG.DEFAULT_DAILY_SEND_LIMITS
      ] ??
      -1

    setEditing(role)
    setForm({
      name: role.name,
      displayName: role.displayName || "",
      description: role.description || "",
      icon: getRoleIcon(role),
      permissions: [...role.permissions],
      dailyLimit: String(effectiveLimit),
      maxEmails: role.maxEmails !== null && role.maxEmails !== undefined
        ? String(role.maxEmails)
        : "",
      allowedDomains: [...(role.allowedDomains ?? [])],
      allowedExpiries: [...(role.allowedExpiries ?? [])],
      defaultExpiry: role.defaultExpiry !== null && role.defaultExpiry !== undefined
        ? String(role.defaultExpiry)
        : "",
      durationOptions: (role.durationOptions || []).map((item) => ({ ...item })),
      showUpperDomains: role.showUpperDomains,
      price: String(role.price),
      purchasable: role.purchasable,
      sortOrder: String(role.sortOrder),
    })
    setDialogOpen(true)
  }

  const togglePermission = (permission: string) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((item) => item !== permission)
        : [...prev.permissions, permission],
    }))
  }

  const toggleExpiry = (value: number) => {
    setForm((prev) => ({
      ...prev,
      allowedExpiries: prev.allowedExpiries.includes(value)
        ? prev.allowedExpiries.filter((item) => item !== value)
        : [...prev.allowedExpiries, value],
    }))
  }

  const toggleDomain = (domain: string) => {
    setForm((prev) => ({
      ...prev,
      allowedDomains: prev.allowedDomains.includes(domain)
        ? prev.allowedDomains.filter((item) => item !== domain)
        : [...prev.allowedDomains, domain],
    }))
  }

  const addDurationOption = () => {
    setForm((prev) => ({
      ...prev,
      durationOptions: [...prev.durationOptions, { days: 30, price: 0 }],
    }))
  }

  const removeDurationOption = (index: number) => {
    setForm((prev) => ({
      ...prev,
      durationOptions: prev.durationOptions.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  const updateDurationOption = (
    index: number,
    field: "days" | "price",
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      durationOptions: prev.durationOptions.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: Number(value) || 0 } : item
      ),
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        displayName: form.displayName.trim(),
        description: form.description.trim(),
        icon: form.icon,
        permissions: form.permissions,
        dailyLimit: Number(form.dailyLimit),
        maxEmails: form.maxEmails ? Number(form.maxEmails) : null,
        allowedDomains: form.allowedDomains,
        allowedExpiries: form.allowedExpiries,
        defaultExpiry: form.defaultExpiry ? Number(form.defaultExpiry) : null,
        durationOptions: form.durationOptions,
        showUpperDomains: form.showUpperDomains,
        price: Number(form.price),
        purchasable: form.purchasable,
        sortOrder: Number(form.sortOrder),
      }

      if (editing) {
        if (editing.name === ROLES.EMPEROR || editing.name === ROLES.CIVILIAN) {
          delete payload.name
          delete payload.price
          delete payload.purchasable
        }
        if (editing.name === ROLES.EMPEROR) {
          delete payload.permissions
          delete payload.dailyLimit
          delete payload.maxEmails
          delete payload.sortOrder
          delete payload.allowedDomains
          delete payload.allowedExpiries
          delete payload.defaultExpiry
          delete payload.durationOptions
          delete payload.showUpperDomains
        }
      }

      const res = await fetch(editing ? `/api/roles/${editing.id}` : "/api/roles", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const error = await res.json() as { error: string }
        throw new Error(error.error)
      }

      toast({ title: t("saveSuccess") })
      setDialogOpen(false)
      await fetchRoles()
    } catch (error) {
      toast({
        title: t("saveFailed"),
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!roleToDelete) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/roles/${roleToDelete.id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const error = await res.json() as { error: string }
        throw new Error(error.error)
      }

      toast({ title: t("deleteSuccess") })
      setRoleToDelete(null)
      await fetchRoles()
    } catch (error) {
      toast({
        title: t("deleteFailed"),
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  const isProtected = (role: RoleItem) =>
    role.name === ROLES.EMPEROR || role.name === ROLES.CIVILIAN
  const lockedPermissionEditing = editing?.name === ROLES.EMPEROR
  const lockedLimitEditing = lockedPermissionEditing
  const lockedMaxEmailsEditing = lockedPermissionEditing
  const lockedShopEditing = editing
    ? editing.name === ROLES.EMPEROR || editing.name === ROLES.CIVILIAN
    : false
  const lockedDurationEditing = lockedShopEditing
  const lockedEmailRulesEditing = lockedPermissionEditing
  const lockedSortEditing = lockedPermissionEditing
  const domainOptions = Array.from(
    new Set([...availableDomains, ...form.allowedDomains])
  ).filter(Boolean)

  return (
    <div className="panel-card">
      <div className="mb-6 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Layers className="h-5 w-5" />
        </div>
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        <Button size="sm" className="ml-auto gap-1.5" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {t("create")}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">{t("loading")}</span>
        </div>
      ) : roles.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">{t("empty")}</div>
      ) : (
        <div className="space-y-3">
          {roles.map((role) => {
            const Icon = ROLE_ICON_MAP[getRoleIcon(role)] || ROLE_ICON_MAP.User2
            const protectedRole = isProtected(role)

            return (
              <div
                key={role.id}
                className="rounded-lg border border-border bg-card/60 p-4 transition-colors hover:border-primary/25"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{roleName(role)}</span>
                      {protectedRole && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                          <Lock className="h-3 w-3" />
                          {t("systemRole")}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {role.name}
                      {role.description ? ` · ${role.description}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    {t("userCount", { count: role.userCount })}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2.5"
                      onClick={() => openEdit(role)}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="ml-1">{t("edit")}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2.5 text-muted-foreground hover:text-destructive"
                      disabled={protectedRole || role.userCount > 0}
                      onClick={() => setRoleToDelete(role)}
                      title={role.userCount > 0 ? t("deleteHasUsers") : t("delete")}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="ml-1">{t("delete")}</span>
                    </Button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/70 pt-3">
                  <span className="text-xs text-muted-foreground">{t("permissionsLabel")}:</span>
                  {role.permissions.length === 0 ? (
                    <span className="text-xs text-muted-foreground">{t("noPermissions")}</span>
                  ) : (
                    role.permissions.map((permission) => (
                      <span
                        key={permission}
                        className="rounded-md bg-secondary/10 px-2 py-0.5 text-[11px] font-medium text-secondary"
                      >
                        {permissionLabel(permission)}
                      </span>
                    ))
                  )}
                  {role.purchasable && (
                    <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-600">
                      {t("price")}: {role.price}
                    </span>
                  )}
                  {role.allowedDomains && role.allowedDomains.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {t("allowedDomainsLabel")}: {role.allowedDomains.join(", ")}
                    </span>
                  )}
                  {role.allowedExpiries && role.allowedExpiries.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {t("allowedExpiriesLabel")}: {role.allowedExpiries.length}
                    </span>
                  )}
                  {role.durationOptions.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {t("durationOptions")}:{" "}
                      {role.durationOptions.map((option) => `${option.days}${t("days")}/${option.price}`).join(", ")}
                    </span>
                  )}
                  {role.showUpperDomains && (
                    <span className="text-xs text-muted-foreground">{t("showUpperDomains")}</span>
                  )}
                  {role.maxEmails !== null && role.maxEmails !== undefined && (
                    <span className="text-xs text-muted-foreground">
                      {t("maxEmails")}: {role.maxEmails}
                    </span>
                  )}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {t("dailyLimitLabel")}:{" "}
                    <strong>
                      {effectiveDailyLimitText(role, t)}
                    </strong>
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? t("editTitle") : t("createTitle")}</DialogTitle>
            <DialogDescription>{t("formDescription")}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {!editing && (
              <div className="grid gap-2">
                <Label htmlFor="role-name">{t("name")}</Label>
                <Input
                  id="role-name"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="vip / gold_member"
                />
                <p className="text-xs text-muted-foreground">{t("nameHint")}</p>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="role-display-name">{t("displayName")}</Label>
              <Input
                id="role-display-name"
                value={form.displayName}
                onChange={(e) => setForm((prev) => ({ ...prev, displayName: e.target.value }))}
                placeholder={t("displayNamePlaceholder")}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="role-description">{t("description")}</Label>
              <Textarea
                id="role-description"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder={t("descriptionPlaceholder")}
              />
            </div>

            <div className="grid gap-2">
              <Label>{t("icon")}</Label>
              <Select value={form.icon} onValueChange={(value) => setForm((prev) => ({ ...prev, icon: value }))}>
                <SelectTrigger className="w-full">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const Icon = ROLE_ICON_MAP[form.icon] || ROLE_ICON_MAP.User2
                      return <Icon className="h-4 w-4" />
                    })()}
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {ROLE_ICON_OPTIONS.map((iconName) => {
                    const Icon = ROLE_ICON_MAP[iconName]
                    return (
                      <SelectItem key={iconName} value={iconName}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {iconName}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>{t("permissionsLabel")}</Label>
              <div className="grid gap-2 rounded-lg border border-border/70 p-3 sm:grid-cols-2">
                {PERMISSION_OPTIONS.map((permission) => {
                  return (
                    <label
                      key={permission}
                      className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
                    >
                      <Checkbox
                        checked={form.permissions.includes(permission)}
                        onChange={() => togglePermission(permission)}
                        disabled={lockedPermissionEditing}
                      />
                      {permissionLabel(permission)}
                    </label>
                  )
                })}
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="role-daily-limit">{t("dailyLimit")}</Label>
                <Input
                  id="role-daily-limit"
                  type="number"
                  min="-1"
                  value={form.dailyLimit}
                  disabled={lockedLimitEditing}
                  onChange={(e) => setForm((prev) => ({ ...prev, dailyLimit: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">{t("dailyLimitHint")}</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role-max-emails">{t("maxEmails")}</Label>
                <Input
                  id="role-max-emails"
                  type="number"
                  min="1"
                  value={form.maxEmails}
                  disabled={lockedMaxEmailsEditing}
                  onChange={(e) => setForm((prev) => ({ ...prev, maxEmails: e.target.value }))}
                  placeholder={t("maxEmailsPlaceholder")}
                />
                <p className="text-xs text-muted-foreground">{t("maxEmailsHint")}</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role-sort-order">{t("sortOrder")}</Label>
                <Input
                  id="role-sort-order"
                  type="number"
                  min="0"
                  value={form.sortOrder}
                  disabled={lockedSortEditing}
                  onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>{t("allowedDomains")}</Label>
              <div className="grid gap-2 rounded-lg border border-border/70 p-3 sm:grid-cols-2">
                {domainOptions.length > 0 ? (
                  domainOptions.map((domain) => (
                    <label
                      key={domain}
                      className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
                    >
                      <Checkbox
                        checked={form.allowedDomains.includes(domain)}
                        onChange={() => toggleDomain(domain)}
                        disabled={lockedEmailRulesEditing}
                      />
                      @{domain}
                    </label>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">{t("noDomains")}</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{t("allowedDomainsHint")}</p>
            </div>

            <div className="grid gap-2">
              <Label>{t("allowedExpiries")}</Label>
              <div className="flex flex-wrap gap-4 rounded-lg border border-border/70 p-3">
                {EXPIRY_OPTIONS.map((option) => {
                  return (
                    <label
                      key={option.value}
                      className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
                    >
                      <Checkbox
                        checked={form.allowedExpiries.includes(option.value)}
                        onChange={() => toggleExpiry(option.value)}
                        disabled={lockedEmailRulesEditing}
                      />
                      {expiryLabel(option.value)}
                    </label>
                  )
                })}
              </div>
              <p className="text-xs text-muted-foreground">{t("allowedExpiriesHint")}</p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>{t("defaultExpiry")}</Label>
                <Select
                  value={form.defaultExpiry || "none"}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      defaultExpiry: value === "none" ? "" : value,
                    }))
                  }
                  disabled={lockedEmailRulesEditing}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("defaultExpiryNone")}</SelectItem>
                    {(form.allowedExpiries.length > 0
                      ? EXPIRY_OPTIONS.filter((option) =>
                          form.allowedExpiries.includes(option.value)
                        )
                      : EXPIRY_OPTIONS
                    ).map((option) => {
                      return (
                        <SelectItem key={option.value} value={String(option.value)}>
                          {expiryLabel(option.value)}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role-price">{t("price")}</Label>
                <Input
                  id="role-price"
                  type="number"
                  min="0"
                  value={form.price}
                  disabled={lockedShopEditing}
                  onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">{t("priceHint")}</p>
              </div>
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>{t("durationOptions")}</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addDurationOption}
                  disabled={lockedDurationEditing}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  {t("addDuration")}
                </Button>
              </div>
              <div className="space-y-2 rounded-lg border border-border/70 p-3">
                {form.durationOptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("durationEmpty")}</p>
                ) : (
                  form.durationOptions.map((option, index) => (
                    <div key={index} className="flex flex-wrap items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        value={option.days}
                        disabled={lockedDurationEditing}
                        onChange={(e) => updateDurationOption(index, "days", e.target.value)}
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">{t("days")}</span>
                      <Input
                        type="number"
                        min="0"
                        value={option.price}
                        disabled={lockedDurationEditing}
                        onChange={(e) => updateDurationOption(index, "price", e.target.value)}
                        className="w-28"
                      />
                      <span className="text-sm text-muted-foreground">{t("pointsUnit")}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        disabled={lockedDurationEditing}
                        onClick={() => removeDurationOption(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
              <p className="text-xs text-muted-foreground">{t("durationHint")}</p>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/70 p-4">
              <div>
                <Label htmlFor="role-show-upper-domains" className="text-sm font-medium">
                  {t("showUpperDomains")}
                </Label>
                <p className="text-xs text-muted-foreground">{t("showUpperDomainsHint")}</p>
              </div>
              <Switch
                id="role-show-upper-domains"
                checked={form.showUpperDomains}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({ ...prev, showUpperDomains: checked }))
                }
                disabled={lockedEmailRulesEditing}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/70 p-4">
              <div>
                <Label htmlFor="role-purchasable" className="text-sm font-medium">
                  {t("purchasable")}
                </Label>
                <p className="text-xs text-muted-foreground">{t("purchasableHint")}</p>
              </div>
              <Switch
                id="role-purchasable"
                checked={form.purchasable}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({ ...prev, purchasable: checked }))
                }
                disabled={lockedShopEditing}
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t("cancel")}</Button>
            </DialogClose>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? t("saving") : t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!roleToDelete}
        onOpenChange={(open) => {
          if (!open && !deleting) setRoleToDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteConfirm", { name: roleToDelete ? roleName(roleToDelete) : "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : t("deleteConfirmButton")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function effectiveDailyLimitText(
  role: RoleItem,
  t: (key: string) => string
) {
  const limit =
    role.dailyLimit ??
    EMAIL_CONFIG.DEFAULT_DAILY_SEND_LIMITS[
      role.name as keyof typeof EMAIL_CONFIG.DEFAULT_DAILY_SEND_LIMITS
    ] ??
    -1

  if (limit === 0) return t("dailyLimitUnlimited")
  if (limit === -1) return t("dailyLimitDisabled")
  return String(limit)
}
