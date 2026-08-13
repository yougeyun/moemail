"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Mail, Send, Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"

interface SystemMailConfig {
  enabled: boolean
  mode: "code" | "link"
  relayUrl: string
  relayToken: string
  fromEmail: string
  fromName: string
}

export function SystemMailPanel() {
  const t = useTranslations("profile.systemMail")
  const { toast } = useToast()
  const [config, setConfig] = useState<SystemMailConfig>({
    enabled: false,
    mode: "code",
    relayUrl: "",
    relayToken: "",
    fromEmail: "",
    fromName: "",
  })
  const [testEmail, setTestEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/config/system-mail")
      if (!res.ok) return
      const data = (await res.json()) as SystemMailConfig
      setConfig(data)
    } catch {
      // Panel remains editable with defaults.
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/config/system-mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })
      if (!res.ok) throw new Error(t("saveFailed"))
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

  const handleTest = async () => {
    if (!testEmail.trim()) {
      toast({ title: t("testEmailRequired"), variant: "destructive" })
      return
    }
    setTesting(true)
    try {
      const res = await fetch("/api/config/system-mail/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testEmail.trim() }),
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error || t("testFailed"))
      }
      toast({ title: t("testSuccess") })
    } catch (error) {
      toast({
        title: t("testFailed"),
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="panel-card">
      <div className="mb-6 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Settings2 className="h-5 w-5" />
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
            <Label>{t("mode")}</Label>
            <Select
              value={config.mode}
              onValueChange={(mode) =>
                setConfig((prev) => ({
                  ...prev,
                  mode: mode as "code" | "link",
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="code">{t("modeCode")}</SelectItem>
                <SelectItem value="link">{t("modeLink")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t("relayUrl")}</Label>
            <Input
              value={config.relayUrl}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  relayUrl: e.target.value,
                }))
              }
              placeholder="https://mail-relay.example.com/send"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{t("relayToken")}</Label>
            <Input
              type="password"
              value={config.relayToken}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  relayToken: e.target.value,
                }))
              }
              placeholder={t("relayTokenPlaceholder")}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("fromEmail")}</Label>
            <Input
              value={config.fromEmail}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  fromEmail: e.target.value,
                }))
              }
              placeholder="no-reply@qq.com"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{t("fromName")}</Label>
            <Input
              value={config.fromName}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  fromName: e.target.value,
                }))
              }
              placeholder="mail.59pk.net"
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("testEmail")}</Label>
            <Input
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={handleSave} disabled={loading} className="gap-2">
            <Mail className="h-4 w-4" />
            {loading ? t("saving") : t("save")}
          </Button>
          <Button
            variant="outline"
            onClick={handleTest}
            disabled={testing}
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            {testing ? t("testing") : t("testSend")}
          </Button>
        </div>
      </div>
    </div>
  )
}
