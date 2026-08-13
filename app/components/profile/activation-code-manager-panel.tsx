"use client"

import { useCallback, useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Copy, KeyRound, Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

interface ActivationCodeItem {
  id: string
  code: string
  emailQuota: number
  sendQuota: number
  emailExpiryDays: number
  usedAt: string | null
  expiresAt: string | null
  usedUsername: string | null
}

export function ActivationCodeManagerPanel() {
  const t = useTranslations("profile.activationCodeManager")
  const { toast } = useToast()
  const [count, setCount] = useState("10")
  const [emailQuota, setEmailQuota] = useState("0")
  const [sendQuota, setSendQuota] = useState("0")
  const [emailExpiryDays, setEmailExpiryDays] = useState("30")
  const [prefix, setPrefix] = useState("")
  const [expiresInDays, setExpiresInDays] = useState("")
  const [generatedCodes, setGeneratedCodes] = useState<ActivationCodeItem[]>([])
  const [codes, setCodes] = useState<ActivationCodeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  const fetchCodes = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/activation-codes")
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json() as { codes: ActivationCodeItem[] }
      setCodes(data.codes)
    } catch {
      toast({ title: t("loadFailed"), variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [t, toast])

  useEffect(() => {
    fetchCodes()
  }, [fetchCodes])

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const res = await fetch("/api/activation-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count: Number(count) || 1,
          emailQuota: Number(emailQuota) || 0,
          sendQuota: Number(sendQuota) || 0,
          emailExpiryDays: Number(emailExpiryDays) || 0,
          prefix: prefix.trim(),
          expiresInDays: Number(expiresInDays) || 0,
        }),
      })
      const data = await res.json() as {
        error?: string
        codes?: ActivationCodeItem[]
      }
      if (!res.ok) {
        throw new Error(data.error || t("generateFailed"))
      }
      setGeneratedCodes(data.codes || [])
      toast({ title: t("generateSuccess") })
      await fetchCodes()
    } catch (error) {
      toast({
        title: t("generateFailed"),
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      toast({ title: t("copied") })
    } catch {
      toast({ title: t("copyFailed"), variant: "destructive" })
    }
  }

  return (
    <div className="panel-card">
      <div className="mb-6 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <KeyRound className="h-5 w-5" />
        </div>
        <h2 className="text-lg font-semibold">{t("title")}</h2>
      </div>

      <div className="grid gap-3 rounded-lg border border-border/70 p-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="grid gap-1.5">
          <Label>{t("count")}</Label>
          <Input type="number" min="1" max="500" value={count} onChange={(e) => setCount(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label>{t("emailQuota")}</Label>
          <Input type="number" min="0" value={emailQuota} onChange={(e) => setEmailQuota(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label>{t("sendQuota")}</Label>
          <Input type="number" min="0" value={sendQuota} onChange={(e) => setSendQuota(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label>{t("emailExpiryDays")}</Label>
          <Input type="number" min="0" value={emailExpiryDays} onChange={(e) => setEmailExpiryDays(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label>{t("prefix")}</Label>
          <Input value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder={t("prefixPlaceholder")} />
        </div>
        <div className="grid gap-1.5">
          <Label>{t("expiresInDays")}</Label>
          <Input type="number" min="0" value={expiresInDays} onChange={(e) => setExpiresInDays(e.target.value)} />
        </div>
      </div>

      <Button onClick={handleGenerate} disabled={generating} className="mt-4">
        {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        <Plus className="mr-2 h-4 w-4" />
        {generating ? t("generating") : t("generate")}
      </Button>

      {generatedCodes.length > 0 && (
        <div className="mt-4 rounded-lg border border-primary/25 bg-primary/5 p-4">
          <div className="mb-2 text-sm font-semibold">{t("generatedTitle")}</div>
          <div className="flex max-h-56 flex-col gap-2 overflow-y-auto">
            {generatedCodes.map((item) => (
              <div key={item.code} className="flex items-center gap-2 rounded-md bg-background/70 px-3 py-2">
                <span className="flex-1 font-mono text-sm">{item.code}</span>
                <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => copyCode(item.code)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <div className="mb-3 text-sm font-semibold">{t("historyTitle")}</div>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : codes.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">{t("empty")}</div>
        ) : (
          <div className="space-y-2">
            {codes.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card/60 px-3 py-2 text-sm">
                <span className="font-mono">{item.code}</span>
                <span className="text-xs text-muted-foreground">
                  {t("emailQuotaShort", { count: item.emailQuota })} · {t("sendQuotaShort", { count: item.sendQuota })}
                  {item.emailExpiryDays > 0 && (
                    <span> · {t("expiryDays", { days: item.emailExpiryDays })}</span>
                  )}
                </span>
                <span className="ml-auto text-xs">
                  {item.usedAt
                    ? t("used", { user: item.usedUsername || "" })
                    : t("unused")}
                </span>
                <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => copyCode(item.code)}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
