"use client"

import { useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { ArrowLeft, UserCog, MessageCircle, Save } from "lucide-react"
import type { User } from "next-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { EmailBindingPanel } from "./email-binding-panel"

export function ProfileSettings({ user }: { user: User }) {
  const t = useTranslations("profile.settings")
  const locale = useLocale()
  const router = useRouter()
  const { toast } = useToast()
  const [username, setUsername] = useState(user.username || "")
  const [saving, setSaving] = useState(false)
  const [wechatBound, setWechatBound] = useState(
    Boolean(user.providers?.includes("wechat"))
  )
  const [unbinding, setUnbinding] = useState(false)

  const handleSaveUsername = async () => {
    if (!username.trim()) {
      toast({ title: t("usernameRequired"), variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error || t("saveFailed"))
      }
      toast({ title: t("saveSuccess") })
      router.refresh()
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

  const handleUnbindWechat = async () => {
    if (!window.confirm(t("unbindConfirm"))) return
    setUnbinding(true)
    try {
      const res = await fetch("/api/user/wechat", { method: "DELETE" })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error || t("unbindFailed"))
      }
      setWechatBound(false)
      toast({ title: t("unbindSuccess") })
      router.refresh()
    } catch (error) {
      toast({
        title: t("unbindFailed"),
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      })
    } finally {
      setUnbinding(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/${locale}/profile`)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("back")}
        </Button>
      </div>

      <div className="panel-card">
        <div className="mb-6 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <UserCog className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold">{t("usernameTitle")}</h2>
        </div>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>{t("username")}</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t("usernamePlaceholder")}
            />
          </div>
          <Button onClick={handleSaveUsername} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? t("saving") : t("saveUsername")}
          </Button>
        </div>
      </div>

      <EmailBindingPanel initialEmail={user.email} />

      <div className="panel-card">
        <div className="mb-6 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MessageCircle className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold">{t("wechatTitle")}</h2>
        </div>
        <p className="text-sm font-medium">
          {wechatBound ? t("wechatBound") : t("wechatUnbound")}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{t("wechatHint")}</p>
        {wechatBound && (
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            disabled={unbinding}
            onClick={handleUnbindWechat}
          >
            {unbinding ? t("saving") : t("unbindWechat")}
          </Button>
        )}
      </div>
    </div>
  )
}
