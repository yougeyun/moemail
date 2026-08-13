"use client"

import { useCallback, useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { KeyRound, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useConfig } from "@/hooks/use-config"

export function ActivationCodePanel() {
  const t = useTranslations("profile.activationCode")
  const { toast } = useToast()
  const { fetch: fetchConfig } = useConfig()
  const [emailQuota, setEmailQuota] = useState(0)
  const [sendQuota, setSendQuota] = useState(0)
  const [code, setCode] = useState("")
  const [redeeming, setRedeeming] = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/activation-codes/status")
      if (!res.ok) return
      const data = await res.json() as {
        redeemedEmailQuota: number
        redeemedSendQuota: number
      }
      setEmailQuota(data.redeemedEmailQuota)
      setSendQuota(data.redeemedSendQuota)
    } catch {
      // Quota panel is optional.
    }
  }, [])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  const handleRedeem = async () => {
    if (!code.trim()) return
    setRedeeming(true)
    try {
      const res = await fetch("/api/activation-codes/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      })
      const data = await res.json() as {
        error?: string
        redeemedEmailQuota?: number
        redeemedSendQuota?: number
      }
      if (!res.ok) {
        throw new Error(data.error || t("redeemFailed"))
      }
      setEmailQuota(data.redeemedEmailQuota ?? emailQuota)
      setSendQuota(data.redeemedSendQuota ?? sendQuota)
      setCode("")
      await fetchConfig()
      toast({ title: t("redeemSuccess") })
    } catch (error) {
      toast({
        title: t("redeemFailed"),
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      })
    } finally {
      setRedeeming(false)
    }
  }

  return (
    <div className="panel-card">
      <div className="mb-6 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <KeyRound className="h-5 w-5" />
        </div>
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        <div className="ml-auto text-right text-sm text-muted-foreground">
          <div>{t("emailQuota", { count: emailQuota })}</div>
          <div>{t("sendQuota", { count: sendQuota })}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1">
          <Label htmlFor="activation-code">{t("code")}</Label>
          <Input
            id="activation-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t("codePlaceholder")}
            className="mt-1 uppercase"
          />
        </div>
        <Button onClick={handleRedeem} disabled={redeeming || !code.trim()}>
          {redeeming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {redeeming ? t("redeeming") : t("redeem")}
        </Button>
      </div>
    </div>
  )
}
