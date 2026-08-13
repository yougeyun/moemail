"use client"

import { useCallback, useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { CreditCard, ListChecks, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"

interface PaymentSettings {
  wechatEnabled: boolean
  wechatAppId: string
  wechatMchId: string
  wechatSerialNo: string
  wechatNotifyUrl: string
  wechatPrivateKeyConfigured: boolean
  alipayEnabled: boolean
  alipayAppId: string
  alipayNotifyUrl: string
  alipayPrivateKeyConfigured: boolean
  alipayPublicKeyConfigured: boolean
}

interface OrderItem {
  id: string
  userId: string
  username: string | null
  roleName: string
  roleDisplayName: string | null
  price: number
  durationDays: number | null
  paymentMethod: string | null
  createdAt: string
}

const EMPTY: PaymentSettings = {
  wechatEnabled: false,
  wechatAppId: "",
  wechatMchId: "",
  wechatSerialNo: "",
  wechatNotifyUrl: "",
  wechatPrivateKeyConfigured: false,
  alipayEnabled: false,
  alipayAppId: "",
  alipayNotifyUrl: "",
  alipayPrivateKeyConfigured: false,
  alipayPublicKeyConfigured: false,
}

export function PaymentSettingsPanel() {
  const t = useTranslations("profile.payment")
  const { toast } = useToast()
  const [settings, setSettings] = useState<PaymentSettings>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [wechatPrivateKey, setWechatPrivateKey] = useState("")
  const [alipayPrivateKey, setAlipayPrivateKey] = useState("")
  const [alipayPublicKey, setAlipayPublicKey] = useState("")
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/payment/orders")
      if (!res.ok) return
      const data = await res.json() as { orders: OrderItem[] }
      setOrders(data.orders)
    } catch {
      // Orders are optional in the settings view.
    }
  }, [])

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/config/payment")
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json() as PaymentSettings
      setSettings(data)
    } catch {
      toast({ title: t("loadFailed"), variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [t, toast])

  useEffect(() => {
    fetchSettings()
    fetchOrders()
  }, [fetchSettings, fetchOrders])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/config/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wechatEnabled: settings.wechatEnabled,
          wechatAppId: settings.wechatAppId,
          wechatMchId: settings.wechatMchId,
          wechatSerialNo: settings.wechatSerialNo,
          wechatPrivateKey: wechatPrivateKey || undefined,
          wechatNotifyUrl: settings.wechatNotifyUrl,
          alipayEnabled: settings.alipayEnabled,
          alipayAppId: settings.alipayAppId,
          alipayPrivateKey: alipayPrivateKey || undefined,
          alipayPublicKey: alipayPublicKey || undefined,
          alipayNotifyUrl: settings.alipayNotifyUrl,
        }),
      })

      if (!res.ok) {
        const error = await res.json() as { error: string }
        throw new Error(error.error)
      }

      toast({ title: t("saveSuccess") })
      setWechatPrivateKey("")
      setAlipayPrivateKey("")
      setAlipayPublicKey("")
      await fetchSettings()
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

  const handleConfirmOrder = async (orderId: string) => {
    setConfirmingOrderId(orderId)
    try {
      const res = await fetch("/api/payment/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      })
      if (!res.ok) {
        const error = await res.json() as { error: string }
        throw new Error(error.error)
      }
      toast({ title: t("orderConfirmed") })
      await fetchOrders()
    } catch (error) {
      toast({
        title: t("orderConfirmFailed"),
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      })
    } finally {
      setConfirmingOrderId(null)
    }
  }

  return (
    <div className="panel-card">
      <div className="mb-6 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <CreditCard className="h-5 w-5" />
        </div>
        <h2 className="text-lg font-semibold">{t("title")}</h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-4 rounded-lg border border-border/70 p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-semibold">{t("wechat")}</Label>
                <p className="text-xs text-muted-foreground">{t("wechatHint")}</p>
              </div>
              <Switch
                checked={settings.wechatEnabled}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({ ...prev, wechatEnabled: checked }))
                }
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label>{t("appId")}</Label>
                <Input
                  value={settings.wechatAppId}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, wechatAppId: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label>{t("mchId")}</Label>
                <Input
                  value={settings.wechatMchId}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, wechatMchId: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label>{t("serialNo")}</Label>
                <Input
                  value={settings.wechatSerialNo}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, wechatSerialNo: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label>{t("notifyUrl")}</Label>
                <Input
                  value={settings.wechatNotifyUrl}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, wechatNotifyUrl: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>{t("privateKey")}</Label>
              <Textarea
                value={wechatPrivateKey}
                onChange={(e) => setWechatPrivateKey(e.target.value)}
                placeholder={
                  settings.wechatPrivateKeyConfigured
                    ? t("keyConfigured")
                    : t("privateKeyPlaceholder")
                }
                className="min-h-[90px] font-mono text-xs"
              />
            </div>
          </div>

          <div className="space-y-4 rounded-lg border border-border/70 p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-semibold">{t("alipay")}</Label>
                <p className="text-xs text-muted-foreground">{t("alipayHint")}</p>
              </div>
              <Switch
                checked={settings.alipayEnabled}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({ ...prev, alipayEnabled: checked }))
                }
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label>{t("appId")}</Label>
                <Input
                  value={settings.alipayAppId}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, alipayAppId: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label>{t("notifyUrl")}</Label>
                <Input
                  value={settings.alipayNotifyUrl}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, alipayNotifyUrl: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label>{t("privateKey")}</Label>
                <Textarea
                  value={alipayPrivateKey}
                  onChange={(e) => setAlipayPrivateKey(e.target.value)}
                  placeholder={
                    settings.alipayPrivateKeyConfigured
                      ? t("keyConfigured")
                      : t("privateKeyPlaceholder")
                  }
                  className="min-h-[90px] font-mono text-xs"
                />
              </div>
              <div className="grid gap-1.5">
                <Label>{t("publicKey")}</Label>
                <Textarea
                  value={alipayPublicKey}
                  onChange={(e) => setAlipayPublicKey(e.target.value)}
                  placeholder={
                    settings.alipayPublicKeyConfigured
                      ? t("keyConfigured")
                      : t("publicKeyPlaceholder")
                  }
                  className="min-h-[90px] font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {orders.length > 0 && (
            <div className="space-y-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
              <div className="flex items-center gap-2 font-semibold">
                <ListChecks className="h-4 w-4 text-amber-600" />
                {t("pendingOrders")}
              </div>
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card/60 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">
                      {order.roleDisplayName || order.roleName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {order.username || order.userId} · {order.paymentMethod} ·{" "}
                      {order.durationDays
                        ? t("daysValue", { days: order.durationDays })
                        : t("permanent")}
                    </div>
                  </div>
                  <span className="font-semibold">{order.price}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={confirmingOrderId === order.id}
                    onClick={() => handleConfirmOrder(order.id)}
                  >
                    {confirmingOrderId === order.id && (
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    )}
                    {t("confirmOrder")}
                  </Button>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">{t("pendingOrdersHint")}</p>
            </div>
          )}

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {saving ? t("saving") : t("save")}
          </Button>
        </div>
      )}
    </div>
  )
}
