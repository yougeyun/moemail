"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Image as ImageIcon, Loader2, Trash2, Upload } from "lucide-react"
import {
  fileToDataUrl,
  generateFirstCharacterIcon,
  generateIconSet,
} from "@/lib/client-image"

interface BrandSettings {
  siteName: string
  siteTitle: string
  siteDescription: string
  siteKeywords: string
  logo: string
  icons: Record<string, string>
}

export function BrandSettingsPanel() {
  const t = useTranslations("profile.website")
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [branding, setBranding] = useState<BrandSettings | null>(null)
  const [logoPreview, setLogoPreview] = useState("")
  const [iconPreview, setIconPreview] = useState("")
  const [passThrough, setPassThrough] = useState<Record<string, unknown>>({})

  const loadConfig = async () => {
    try {
      const response = await fetch("/api/config")
      if (!response.ok) return
      const data = (await response.json()) as {
        siteName?: string
        siteTitle?: string
        siteDescription?: string
        siteKeywords?: string
        hasLogo?: boolean
        icons?: Record<string, string>
        defaultRole?: string
        emailDomains?: string
        adminContact?: string
        maxEmails?: string
        turnstile?: {
          enabled: boolean
          siteKey: string
          secretKey: string
        }
      }
      setBranding({
        siteName: data.siteName || "mail.59pk.net",
        siteTitle: data.siteTitle || "",
        siteDescription: data.siteDescription || "",
        siteKeywords: data.siteKeywords || "",
        logo: data.hasLogo ? "/api/site-logo?t=" + Date.now() : "",
        icons: data.icons || {},
      })
      setLogoPreview(data.hasLogo ? "/api/site-logo?t=" + Date.now() : "")
      setIconPreview(data.icons?.[192] ? "/api/site-icon?size=192&t=" + Date.now() : "")
      setPassThrough({
        defaultRole: data.defaultRole,
        emailDomains: data.emailDomains,
        adminContact: data.adminContact,
        maxEmails: data.maxEmails,
        turnstile: data.turnstile || {
          enabled: false,
          siteKey: "",
          secretKey: "",
        },
      })
    } catch {
      // 本地或权限异常时静默失败
    }
  }

  useEffect(() => {
    loadConfig()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLogoChange = async (file: File | undefined) => {
    if (!file) return
    const dataUrl = await fileToDataUrl(file)
    setBranding((prev) => ({ ...(prev as BrandSettings), logo: dataUrl }))
    setLogoPreview(dataUrl)
  }

  const handleIconChange = async (file: File | undefined) => {
    if (!file) return
    const icons = await generateIconSet(file)
    setBranding((prev) => ({ ...(prev as BrandSettings), icons }))
    setIconPreview(icons["192"])
  }

  const removeLogo = () => {
    setBranding((prev) => ({ ...(prev as BrandSettings), logo: "" }))
    setLogoPreview("")
  }

  const handleSave = async () => {
    if (!branding) return
    setLoading(true)
    try {
      let icons = branding.icons
      if (Object.keys(icons).length === 0) {
        const generated: Record<string, string> = {}
        for (const size of [16, 32, 192, 512]) {
          generated[String(size)] = await generateFirstCharacterIcon(
            branding.siteName,
            size
          )
        }
        icons = generated
      }

      const response = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...passThrough,
          siteName: branding.siteName,
          siteTitle: branding.siteTitle,
          siteDescription: branding.siteDescription,
          siteKeywords: branding.siteKeywords,
          logo: branding.logo,
          icons,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error((data as { error?: string }).error || t("saveFailed"))
      }

      toast({ title: t("saveSuccess") })
      setLogoPreview(branding.logo ? "/api/site-logo?t=" + Date.now() : "")
      setIconPreview(icons["192"] ? "/api/site-icon?size=192&t=" + Date.now() : "")
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

  if (!branding) {
    return (
      <div className="panel-card">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ImageIcon className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold">{t("siteName")}</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="panel-card space-y-5">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <ImageIcon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">{t("brandSettings")}</h2>
          <p className="text-xs text-muted-foreground">{t("siteName")}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="site-name">{t("siteName")}</Label>
          <Input
            id="site-name"
            value={branding.siteName}
            onChange={(e) =>
              setBranding({ ...branding, siteName: e.target.value })
            }
            placeholder={t("siteNamePlaceholder")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="site-title">{t("siteTitle")}</Label>
          <Input
            id="site-title"
            value={branding.siteTitle}
            onChange={(e) =>
              setBranding({ ...branding, siteTitle: e.target.value })
            }
            placeholder={t("siteTitlePlaceholder")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="site-description">{t("siteDescription")}</Label>
          <Input
            id="site-description"
            value={branding.siteDescription}
            onChange={(e) =>
              setBranding({ ...branding, siteDescription: e.target.value })
            }
            placeholder={t("siteDescriptionPlaceholder")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="site-keywords">{t("siteKeywords")}</Label>
          <Input
            id="site-keywords"
            value={branding.siteKeywords}
            onChange={(e) =>
              setBranding({ ...branding, siteKeywords: e.target.value })
            }
            placeholder={t("siteKeywordsPlaceholder")}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 rounded-lg border border-border/80 p-4">
          <Label>{t("logo")}</Label>
          <div className="flex items-center gap-3">
            {logoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoPreview}
                alt=""
                className="h-12 w-12 rounded-lg border border-border object-contain"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">
                {t("siteName")}
              </div>
            )}
            <div className="space-y-1">
              <label className="block">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => handleLogoChange(e.target.files?.[0])}
                />
                <Button type="button" variant="outline" size="sm" asChild>
                  <span className="gap-1.5">
                    <Upload className="h-4 w-4" />
                    {logoPreview ? t("logoReplace") : t("logoUpload")}
                  </span>
                </Button>
              </label>
              {logoPreview && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-destructive"
                  onClick={removeLogo}
                >
                  <Trash2 className="h-4 w-4" />
                  {t("logoRemove")}
                </Button>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{t("logoHint")}</p>
        </div>

        <div className="space-y-2 rounded-lg border border-border/80 p-4">
          <Label>{t("icon")}</Label>
          <div className="flex items-center gap-3">
            <div className="flex items-end gap-1">
              {[16, 32, 192].map((size) => (
                <span
                  key={size}
                  className="inline-flex items-center justify-center overflow-hidden rounded border border-border bg-background"
                  style={{ width: Math.min(size, 56), height: Math.min(size, 56) }}
                >
                  {iconPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={iconPreview}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">?</span>
                  )}
                </span>
              ))}
            </div>
            <label className="block">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => handleIconChange(e.target.files?.[0])}
              />
              <Button type="button" variant="outline" size="sm" asChild>
                <span className="gap-1.5">
                  <Upload className="h-4 w-4" />
                  {t("iconUpload")}
                </span>
              </Button>
            </label>
          </div>
          <p className="text-xs text-muted-foreground">{t("iconHint")}</p>
        </div>
      </div>

      <Button onClick={handleSave} disabled={loading} className="w-full sm:w-auto">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {loading ? t("saving") : t("saveTemplate")}
      </Button>
    </div>
  )
}
