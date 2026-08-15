"use client"

import { useCallback, useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { LayoutGrid, Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"

interface MiniTabItem {
  key: string
  label: string
  enabled: boolean
}

export function TabSettingsPanel() {
  const t = useTranslations("profile.tabs")
  const { toast } = useToast()
  const [tabs, setTabs] = useState<MiniTabItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchTabs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/config/tabs")
      if (!res.ok) throw new Error("loadFailed")
      const data = (await res.json()) as { tabs: MiniTabItem[] }
      setTabs(data.tabs || [])
    } catch {
      toast({ title: t("loadFailed"), variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [t, toast])

  useEffect(() => {
    fetchTabs()
  }, [fetchTabs])

  const updateTab = (index: number, patch: Partial<MiniTabItem>) => {
    setTabs((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item
      )
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/config/tabs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tabs }),
      })
      if (!res.ok) throw new Error("saveFailed")
      toast({ title: t("saveSuccess") })
    } catch {
      toast({ title: t("saveFailed"), variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="panel-card">
      <div className="mb-6 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <LayoutGrid className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">{t("title")}</h2>
          <p className="text-xs text-muted-foreground">{t("description")}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-3">
          {tabs.map((tab, index) => (
            <div
              key={tab.key}
              className="grid gap-3 rounded-lg border border-border/70 p-4 sm:grid-cols-[1fr_auto]"
            >
              <div className="grid gap-1.5">
                <Label>{t("label")}</Label>
                <Input
                  value={tab.label}
                  onChange={(e) => updateTab(index, { label: e.target.value })}
                  maxLength={8}
                />
              </div>
              <div className="flex items-end gap-3">
                <div className="flex items-center gap-2 pb-2">
                  <Switch
                    checked={tab.enabled}
                    onCheckedChange={(checked) =>
                      updateTab(index, { enabled: checked })
                    }
                  />
                  <span className="text-sm text-muted-foreground">
                    {t("enabled")}
                  </span>
                </div>
              </div>
            </div>
          ))}

          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" />
            {saving ? t("saving") : t("save")}
          </Button>
        </div>
      )}
    </div>
  )
}
