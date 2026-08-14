"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Mail, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

export function EmailBindingPanel({
  initialEmail,
}: {
  initialEmail?: string | null
}) {
  const t = useTranslations("profile.emailBind")
  const { toast } = useToast()
  const [boundEmail, setBoundEmail] = useState(initialEmail || "")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [code, setCode] = useState("")
  const [notice, setNotice] = useState("")
  const [sendingCode, setSendingCode] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSendCode = async () => {
    if (!email.trim() || !password) {
      toast({ title: t("required"), variant: "destructive" })
      return
    }
    setSendingCode(true)
    setNotice("")
    try {
      const res = await fetch("/api/user/email/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error || t("sendFailed"))
      }
      const data = (await res.json()) as { mode?: string }
      if (data.mode === "link") {
        setNotice(t("linkNotice"))
      } else {
        toast({ title: t("codeSent") })
      }
    } catch (error) {
      toast({
        title: t("sendFailed"),
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      })
    } finally {
      setSendingCode(false)
    }
  }

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      toast({ title: t("required"), variant: "destructive" })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/user/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          code,
        }),
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error || t("saveFailed"))
      }
      const data = (await res.json()) as {
        success?: boolean
        verificationRequired?: boolean
        email?: string
      }
      if (data.verificationRequired) {
        setNotice(t("linkNotice"))
      } else {
        setBoundEmail(data.email || email.trim())
        setEmail("")
        setPassword("")
        setCode("")
        setNotice("")
        toast({ title: t("saveSuccess") })
      }
    } catch (error) {
      toast({
        title: t("saveFailed"),
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="panel-card">
      <div className="mb-6 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Mail className="h-5 w-5" />
        </div>
        <h2 className="text-lg font-semibold">
          {boundEmail ? t("changeTitle") : t("bindTitle")}
        </h2>
      </div>

      {boundEmail && (
        <p className="mb-4 text-sm text-muted-foreground">
          {t("currentEmail")}：{boundEmail}
        </p>
      )}

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>{t("email")}</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={boundEmail ? t("newEmailPlaceholder") : t("emailPlaceholder")}
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t("password")}</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("passwordPlaceholder")}
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t("code")}</Label>
          <div className="flex gap-3">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={t("codePlaceholder")}
            />
            <Button
              variant="outline"
              onClick={handleSendCode}
              disabled={sendingCode}
              className="shrink-0 gap-2"
            >
              <Send className="h-4 w-4" />
              {sendingCode ? t("sending") : t("sendCode")}
            </Button>
          </div>
        </div>

        {notice && (
          <p className="rounded-lg bg-orange-50 px-3 py-2 text-sm text-orange-600">
            {notice}
          </p>
        )}

        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? t("saving") : boundEmail ? t("change") : t("bind")}
        </Button>
      </div>
    </div>
  )
}
