"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useTranslations } from "next-intl"
import { Loader2, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getRoleIcon } from "@/lib/permissions"
import { ROLE_ICON_MAP } from "./role-ui"

interface DurationOption {
  days: number
  price: number
}

interface ShopRole {
  id: string
  name: string
  displayName: string | null
  description: string | null
  icon: string | null
  price: number
  sortOrder: number
  durationOptions: DurationOption[]
  permissions: string[]
  allowedDomains: string[] | null
  allowedExpiries: number[] | null
}

type PaymentMethod = "points" | "wechat" | "alipay"

export function MembershipShopPanel() {
  const t = useTranslations("profile.shop")
  const tRole = useTranslations("profile.roleManager")
  const { update } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [roles, setRoles] = useState<ShopRole[]>([])
  const [points, setPoints] = useState(0)
  const [currentRoleSort, setCurrentRoleSort] = useState(999)
  const [currentExpiresAt, setCurrentExpiresAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [purchasingRoleId, setPurchasingRoleId] = useState<string | null>(null)
  const [selectedDurations, setSelectedDurations] = useState<Record<string, number>>({})
  const [paymentMethods, setPaymentMethods] = useState<Record<string, PaymentMethod>>({})

  const fetchShop = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/member-shop")
      if (!res.ok) throw new Error("Failed to fetch shop")
      const data = await res.json() as {
        roles: ShopRole[]
        points: number
        currentRoleSort: number
        currentExpiresAt: string | null
      }
      setRoles(data.roles)
      setPoints(data.points)
      setCurrentRoleSort(data.currentRoleSort)
      setCurrentExpiresAt(data.currentExpiresAt)
    } catch {
      toast({ title: t("loadFailed"), variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [t, toast])

  useEffect(() => {
    fetchShop()
  }, [fetchShop])

  const durationFor = (role: ShopRole) =>
    role.durationOptions.length > 0
      ? role.durationOptions
      : [{ days: 0, price: role.price }]

  const selectedDuration = (role: ShopRole) => {
    const options = durationFor(role)
    const selected = selectedDurations[role.id]
    return options.find((option) => option.days === selected) || options[0]
  }

  const handlePurchase = async (role: ShopRole) => {
    const duration = selectedDuration(role)
    const method = paymentMethods[role.id] || "points"
    setPurchasingRoleId(role.id)
    try {
      const res = await fetch("/api/member-shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleId: role.id,
          durationDays: duration.days,
          paymentMethod: method,
        }),
      })

      const data = await res.json() as {
        error?: string
        points?: number
        paymentUrl?: string
        paymentQr?: string
      }

      if (!res.ok) {
        throw new Error(data.error || t("checkoutFailed"))
      }

      if (data.paymentUrl) {
        window.open(data.paymentUrl, "_blank", "noopener,noreferrer")
      } else if (data.paymentQr) {
        toast({ title: t("paymentQrHint") })
      } else {
        if (typeof data.points === "number") {
          setPoints(data.points)
        }
        await update()
        router.refresh()
        toast({ title: t("buySuccess") })
      }
    } catch (error) {
      toast({
        title: t("checkoutFailed"),
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      })
    } finally {
      setPurchasingRoleId(null)
    }
  }

  const permissionLabel = (permission: string) => tRole(`permissions.${permission}`)

  return (
    <div className="panel-card">
      <div className="mb-6 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <ShoppingCart className="h-5 w-5" />
        </div>
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        <div className="ml-auto text-right text-sm text-muted-foreground">
          <div>{t("currentPoints", { points })}</div>
          {currentExpiresAt && (
            <div className="text-xs">{t("currentExpiresAt", { date: currentExpiresAt })}</div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">{t("loading")}</span>
        </div>
      ) : roles.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">{t("empty")}</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {roles.map((role) => {
            const Icon = ROLE_ICON_MAP[getRoleIcon(role)] || ROLE_ICON_MAP.User2
            const buyable = role.sortOrder <= currentRoleSort
            const options = durationFor(role)
            const duration = selectedDuration(role)
            const method = paymentMethods[role.id] || "points"

            return (
              <div
                key={role.id}
                className="flex flex-col rounded-lg border border-border bg-card/60 p-4 transition-colors hover:border-primary/25"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">
                      {role.displayName || role.name}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {role.description || role.name}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {role.permissions.slice(0, 4).map((permission) => (
                    <span
                      key={permission}
                      className="rounded-md bg-secondary/10 px-1.5 py-0.5 text-[11px] font-medium text-secondary"
                    >
                      {permissionLabel(permission)}
                    </span>
                  ))}
                </div>

                <div className="mt-4 grid gap-2 border-t border-border/70 pt-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">{t("duration")}</Label>
                      <Select
                        value={String(duration.days)}
                        onValueChange={(value) =>
                          setSelectedDurations((prev) => ({
                            ...prev,
                            [role.id]: Number(value),
                          }))
                        }
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {options.map((option) => (
                            <SelectItem key={option.days} value={String(option.days)}>
                              {option.days === 0
                                ? t("permanent")
                                : t("daysValue", { days: option.days })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">{t("paymentMethod")}</Label>
                      <Select
                        value={method}
                        onValueChange={(value) =>
                          setPaymentMethods((prev) => ({
                            ...prev,
                            [role.id]: value as PaymentMethod,
                          }))
                        }
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="points">{t("methodPoints")}</SelectItem>
                          <SelectItem value="wechat">{t("methodWechat")}</SelectItem>
                          <SelectItem value="alipay">{t("methodAlipay")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-primary">{duration.price}</span>
                    <Button
                      size="sm"
                      disabled={!buyable || purchasingRoleId === role.id}
                      onClick={() => handlePurchase(role)}
                    >
                      {purchasingRoleId === role.id && (
                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      )}
                      {t("buyNow")}
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
