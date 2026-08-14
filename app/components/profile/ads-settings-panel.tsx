"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Megaphone, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"

interface AdsConfig {
  enabled: boolean
  splashAdUnitId: string
  bannerAdUnitId: string
  rewardedAdUnitId: string
  rewardedEnabled: boolean
  rewardEmailQuota: number
  rewardExpiryDays: number
  rewardExpiry: number
  rewardDailyLimit: number
}

const DEFAULT_CONFIG: AdsConfig = {
  enabled: false,
  splashAdUnitId: "",
  bannerAdUnitId: "",
  rewardedAdUnitId: "",
  rewardedEnabled: false,
  rewardEmailQuota: 1,
  rewardExpiryDays: 30,
  rewardExpiry: 30 * 24 * 60 * 60 * 1000,
  rewardDailyLimit: 3,
}

export function AdsSettingsPanel() {
  const t = useTranslations("profile.ads")
  const { toast } = useToast()
  const [config, setConfig] = useState<AdsConfig>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/config/ads")
      if (!res.ok) return
      const data = (await res.json()) as AdsConfig
      setConfig({ ...DEFAULT_CONFIG, ...data })
    } catch {
      // Panel remains editable with defaults.
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/config/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...config,
          rewardEmailQuota: Number(config.rewardEmailQuota) || 1,
          rewardExpiryDays: Number(config.rewardExpiryDays) || 0,
          rewardDailyLimit: Number(config.rewardDailyLimit) || 0,
        }),
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error || t("saveFailed"))
      }
      toast({ title: t("saveSuccess") })
      await fetchConfig()
    } catch (error) {
      toast({
        title: t("saveFailed"),
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="panel-card">
      <div className="mb-6 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Megaphone className="h-5 w-5" />
        </div>
        <h2 className="text-lg font-semibold">{t("title")}</h2>
      </div>

      <div className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label>{t("enabled")}</Label>
            <p className="text-xs text-muted-foreground">{t("enabledHint")}</p>
          </div>
          <Switch
            checked={config.enabled}
            onCheckedChange={(checked) =>
              setConfig((prev) => ({ ...prev, enabled: checked }))
            }
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{t("splashAdUnitId")}</Label>
            <Input
              value={config.splashAdUnitId}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  splashAdUnitId: e.target.value,
                }))
              }
              placeholder="adunit-xxxxxxxx"
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("bannerAdUnitId")}</Label>
            <Input
              value={config.bannerAdUnitId}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  bannerAdUnitId: e.target.value,
                }))
              }
              placeholder="adunit-xxxxxxxx"
            />
          </div>
        </div>

        <div className="space-y-4 rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label>{t("rewardedEnabled")}</Label>
              <p className="text-xs text-muted-foreground">
                {t("rewardedHint")}
              </p>
            </div>
            <Switch
              checked={config.rewardedEnabled}
              onCheckedChange={(checked) =>
                setConfig((prev) => ({ ...prev, rewardedEnabled: checked }))
              }
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t("rewardedAdUnitId")}</Label>
            <Input
              value={config.rewardedAdUnitId}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  rewardedAdUnitId: e.target.value,
                }))
              }
              placeholder="adunit-xxxxxxxx"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>{t("rewardEmailQuota")}</Label>
              <Input
                type="number"
                min="1"
                value={config.rewardEmailQuota}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    rewardEmailQuota: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("rewardExpiryDays")}</Label>
              <Input
                type="number"
                min="0"
                value={config.rewardExpiryDays}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    rewardExpiryDays: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("rewardDailyLimit")}</Label>
              <Input
                type="number"
                min="1"
                value={config.rewardDailyLimit}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    rewardDailyLimit: Number(e.target.value),
                  }))
                }
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{t("rewardHint")}</p>
        </div>

        <Button onClick={handleSave} disabled={loading} className="gap-2">
          <Save className="h-4 w-4" />
          {loading ? t("saving") : t("save")}
        </Button>
      </div>
    </div>
  )
}
