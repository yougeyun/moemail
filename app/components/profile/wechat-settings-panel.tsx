"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Smartphone, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"

interface WechatConfig {
  enabled: boolean
  appId: string
  appSecret: string
  subscribeTemplateId: string
}

export function WechatSettingsPanel() {
  const t = useTranslations("profile.wechat")
  const { toast } = useToast()
  const [config, setConfig] = useState<WechatConfig>({
    enabled: false,
    appId: "",
    appSecret: "",
    subscribeTemplateId: "",
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/config/wechat")
      if (!res.ok) return
      const data = (await res.json()) as WechatConfig
      setConfig(data)
    } catch {
      // Panel remains editable with defaults.
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/config/wechat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error || t("saveFailed"))
      }
      toast({ title: t("saveSuccess") })
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
          <Smartphone className="h-5 w-5" />
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
            <Label>{t("appId")}</Label>
            <Input
              value={config.appId}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, appId: e.target.value }))
              }
              placeholder="wx1234567890abcdef"
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("appSecret")}</Label>
            <Input
              type="password"
              value={config.appSecret}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  appSecret: e.target.value,
                }))
              }
              placeholder={t("appSecretPlaceholder")}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>{t("subscribeTemplateId")}</Label>
          <Input
            value={config.subscribeTemplateId}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                subscribeTemplateId: e.target.value,
              }))
            }
            placeholder="新邮件提醒模板 ID"
          />
          <p className="text-xs text-muted-foreground">{t("subscribeHint")}</p>
        </div>

        <Button onClick={handleSave} disabled={loading} className="gap-2">
          <Save className="h-4 w-4" />
          {loading ? t("saving") : t("save")}
        </Button>
      </div>
    </div>
  )
}
