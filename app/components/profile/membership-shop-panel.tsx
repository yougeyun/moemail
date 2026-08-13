"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useTranslations } from "next-intl"
import { Loader2, Plus, ShoppingCart, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { getRoleIcon } from "@/lib/permissions"
import { ROLE_ICON_MAP } from "./role-ui"

interface ShopRole {
  id: string
  name: string
  displayName: string | null
  description: string | null
  icon: string | null
  price: number
  sortOrder: number
  permissions: string[]
  allowedDomains: string[] | null
  allowedExpiries: number[] | null
}

const CART_KEY = "moemail_member_cart"

export function MembershipShopPanel() {
  const t = useTranslations("profile.shop")
  const tRole = useTranslations("profile.roleManager")
  const { update } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [roles, setRoles] = useState<ShopRole[]>([])
  const [points, setPoints] = useState(0)
  const [currentRoleSort, setCurrentRoleSort] = useState(999)
  const [loading, setLoading] = useState(true)
  const [checkingOut, setCheckingOut] = useState(false)
  const [cart, setCart] = useState<string[]>([])

  const loadCart = useCallback(() => {
    try {
      const raw = localStorage.getItem(CART_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as unknown
        if (Array.isArray(parsed)) {
          setCart(parsed.filter((item): item is string => typeof item === "string"))
        }
      }
    } catch {
      setCart([])
    }
  }, [])

  const saveCart = useCallback((next: string[]) => {
    setCart(next)
    localStorage.setItem(CART_KEY, JSON.stringify(next))
  }, [])

  const fetchShop = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/member-shop")
      if (!res.ok) throw new Error("Failed to fetch shop")
      const data = await res.json() as {
        roles: ShopRole[]
        points: number
        currentRoleSort: number
      }
      setRoles(data.roles)
      setPoints(data.points)
      setCurrentRoleSort(data.currentRoleSort)
    } catch {
      toast({ title: t("loadFailed"), variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [t, toast])

  useEffect(() => {
    loadCart()
    fetchShop()
  }, [loadCart, fetchShop])

  const addToCart = (roleId: string) => {
    if (!cart.includes(roleId)) {
      saveCart([...cart, roleId])
    }
  }

  const removeFromCart = (roleId: string) => {
    saveCart(cart.filter((id) => id !== roleId))
  }

  const cartRoles = useMemo(
    () => roles.filter((role) => cart.includes(role.id)),
    [roles, cart]
  )
  const totalPrice = cartRoles.reduce((sum, role) => sum + role.price, 0)

  const canBuyRole = (role: ShopRole) => role.sortOrder < currentRoleSort

  const handleCheckout = async () => {
    if (cartRoles.length === 0 || points < totalPrice) {
      toast({
        title: t("checkoutFailed"),
        description: points < totalPrice ? t("insufficientPoints") : undefined,
        variant: "destructive",
      })
      return
    }

    setCheckingOut(true)
    const sorted = [...cartRoles].sort((a, b) => b.sortOrder - a.sortOrder)
    let remainingCart = [...cart]

    try {
      for (const role of sorted) {
        const res = await fetch("/api/member-shop", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roleId: role.id }),
        })

        if (!res.ok) {
          const error = await res.json() as { error: string }
          throw new Error(error.error)
        }

        const data = await res.json() as { points: number }
        setPoints(data.points)
        remainingCart = remainingCart.filter((id) => id !== role.id)
      }

      saveCart(remainingCart)
      await update()
      router.refresh()
      toast({ title: t("buySuccess") })
    } catch (error) {
      saveCart(remainingCart)
      toast({
        title: t("checkoutFailed"),
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      })
    } finally {
      setCheckingOut(false)
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
        <span className="ml-auto text-sm text-muted-foreground">
          {t("currentPoints", { points })}
        </span>
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
            const inCart = cart.includes(role.id)
            const buyable = canBuyRole(role)

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
                  <div className="text-sm font-bold text-primary">{role.price}</div>
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

                <div className="mt-auto flex items-center justify-between border-t border-border/70 pt-3">
                  <span className="text-xs text-muted-foreground">
                    {role.allowedDomains && role.allowedDomains.length > 0
                      ? role.allowedDomains.join(", ")
                      : t("allDomains")}
                  </span>
                  <Button
                    size="sm"
                    variant={inCart ? "outline" : "default"}
                    disabled={!buyable}
                    onClick={() =>
                      inCart ? removeFromCart(role.id) : addToCart(role.id)
                    }
                  >
                    {inCart ? (
                      <>
                        <Trash2 className="mr-1 h-4 w-4" />
                        {t("removeFromCart")}
                      </>
                    ) : (
                      <>
                        <Plus className="mr-1 h-4 w-4" />
                        {t("addToCart")}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-lg border border-primary/25 bg-primary/5 p-4">
        <ShoppingCart className="h-5 w-5 text-primary" />
        <span className="text-sm font-medium">
          {t("cartCount", { count: cartRoles.length })}
        </span>
        <span className="text-sm text-muted-foreground">
          {t("total")}: <strong className="text-foreground">{totalPrice}</strong>
        </span>
        <Button
          className="ml-auto"
          disabled={checkingOut || cartRoles.length === 0 || points < totalPrice}
          onClick={handleCheckout}
        >
          {checkingOut && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {checkingOut ? t("checkingOut") : t("checkout")}
        </Button>
      </div>
    </div>
  )
}
