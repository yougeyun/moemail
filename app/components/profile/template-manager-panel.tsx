"use client"

import { useEffect, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Eye, LayoutTemplate, Loader2, Power } from "lucide-react"
import { TEMPLATE_CONFIGS } from "@/templates/configs"
import { cn } from "@/lib/utils"

export function TemplateManagerPanel() {
  const t = useTranslations("profile.website")
  const locale = useLocale()
  const { toast } = useToast()
  const [activeTemplate, setActiveTemplate] = useState("east-paper")
  const [switchingId, setSwitchingId] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/config")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        const config = data as { activeTemplate?: string } | null
        if (config?.activeTemplate) {
          setActiveTemplate(config.activeTemplate)
        }
      })
      .catch(() => undefined)
  }, [])

  const handleEnable = async (templateId: string) => {
    setSwitchingId(templateId)
    try {
      const response = await fetch("/api/config/template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activeTemplate: templateId }),
      })
      if (!response.ok) throw new Error()
      setActiveTemplate(templateId)
      toast({ title: t("saveSuccess") })
    } catch {
      toast({
        title: t("saveFailed"),
        variant: "destructive",
      })
    } finally {
      setSwitchingId(null)
    }
  }

  const handlePreview = (templateId: string) => {
    window.open(`/${locale}?template=${templateId}`, "_blank")
  }

  return (
    <div className="panel-card space-y-5">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <LayoutTemplate className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">{t("templateManager")}</h2>
          <p className="text-xs text-muted-foreground">
            {t("templateManagerDescription")}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {TEMPLATE_CONFIGS.map((template) => {
          const isActive = template.id === activeTemplate
          return (
            <div
              key={template.id}
              className={cn(
                "group overflow-hidden rounded-xl border bg-card/85 transition-all",
                isActive
                  ? "border-primary/40 shadow-md"
                  : "border-border/80 hover:border-primary/25"
              )}
            >
              <div className="relative aspect-[8/5] overflow-hidden border-b border-border/70 bg-muted/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={template.thumbnail}
                  alt={template.name}
                  className="h-full w-full object-cover"
                />
                {isActive && (
                  <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
                    {t("active")}
                  </span>
                )}
              </div>
              <div className="space-y-3 p-4">
                <div>
                  <h3 className="font-semibold text-foreground">
                    {template.name}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {template.description}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => handlePreview(template.id)}
                  >
                    <Eye className="h-4 w-4" />
                    {t("preview")}
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1.5"
                    disabled={isActive || switchingId === template.id}
                    onClick={() => handleEnable(template.id)}
                  >
                    {switchingId === template.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Power className="h-4 w-4" />
                    )}
                    {t("enable")}
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
