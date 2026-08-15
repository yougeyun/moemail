"use client"

import React, { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Zap, Gem, Sword, User2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

interface EmailServiceConfig {
  enabled: boolean
  roleLimits: Record<string, number>
}

interface RoleOption {
  id: string
  name: string
  displayName: string | null
}

export function EmailServiceConfig() {
  const t = useTranslations("profile.emailService")
  const tCard = useTranslations("profile.card")
  const tSend = useTranslations("emails.send")
  const [config, setConfig] = useState<EmailServiceConfig>({
    enabled: false,
    roleLimits: {},
  })
  const [roles, setRoles] = useState<RoleOption[]>([])
  const [rolesLoaded, setRolesLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchConfig()
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      const res = await fetch("/api/roles")
      if (res.ok) {
        const data = await res.json() as { roles: RoleOption[] }
        setRoles(
          (data.roles || []).filter((role) => role.name !== "emperor")
        )
      }
    } catch (error) {
      console.error("Failed to fetch roles:", error)
    } finally {
      setRolesLoaded(true)
    }
  }

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/config/email-service")
      if (res.ok) {
        const data = await res.json() as EmailServiceConfig
        setConfig(data)
      }
    } catch (error) {
      console.error("Failed to fetch email service config:", error)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const saveData = {
        enabled: config.enabled,
        roleLimits: config.roleLimits
      }

      const res = await fetch("/api/config/email-service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saveData),
      })

      if (!res.ok) {
        const error = await res.json() as { error: string }
        throw new Error(error.error || t("saveFailed"))
      }

      toast({
        title: t("saveSuccess"),
        description: t("saveSuccess"),
      })
    } catch (error) {
      toast({
        title: t("saveFailed"),
        description: error instanceof Error ? error.message : t("saveFailed"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="panel-card">
      <div className="flex items-center gap-2 mb-6">
        <Zap className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">{t("title")}</h2>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="enabled" className="text-sm font-medium">
              {t("enable")}
            </Label>
            <p className="text-xs text-muted-foreground">
              {t("enableDescription")}
            </p>
          </div>
          <Switch
            id="enabled"
            checked={config.enabled}
            onCheckedChange={(checked: boolean) =>
              setConfig((prev: EmailServiceConfig) => ({ ...prev, enabled: checked }))
            }
          />
        </div>

        {config.enabled && (
          <>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
              {t("relayHint")}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t("roleLimits")}
              </Label>
              <div className="space-y-4">
                <div className="rounded-lg border border-secondary/25 bg-secondary/10 p-4 text-sm">
                  <p className="mb-3 flex items-center gap-2 font-semibold text-secondary">
                    <div className="h-2 w-2 rounded-full bg-secondary"></div>
                    {t("fixedRoleLimits")}
                  </p>
                  <div className="space-y-2 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                      <span><strong>{tCard("roles.EMPEROR")}</strong> - {t("emperorLimit")}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                    <p className="text-sm font-medium text-foreground">{t("configRoleLabel")}</p>
                  </div>
                  {!rolesLoaded ? (
                    <p className="text-sm text-muted-foreground">{t("loading")}</p>
                  ) : roles.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("noRoles")}</p>
                  ) : (
                    roles.map((role) => {
                      const limit = config.roleLimits[role.name] ?? -1
                      const isDisabled = limit === -1
                      const isEnabled = !isDisabled
                    
                      return (
                        <div
                          key={role.id}
                          className={`group relative p-4 border-2 rounded-xl transition-all duration-200 ${
                            isEnabled
                              ? 'border-primary/30 bg-primary/5 shadow-sm'
                              : 'border-border hover:border-primary/25 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="relative">
                                <Checkbox
                                  id={`role-${role.name}`}
                                  checked={isEnabled}
                                  onChange={(checked: boolean) => {
                                    setConfig((prev: EmailServiceConfig) => ({
                                      ...prev,
                                      roleLimits: {
                                        ...prev.roleLimits,
                                        [role.name]: checked ? 0 : -1
                                      }
                                    }))
                                  }}
                                />
                              </div>
                              <div>
                                <Label
                                  htmlFor={`role-${role.name}`}
                                  className="text-base font-semibold cursor-pointer select-none flex items-center gap-2"
                                >
                                  {role.name === 'duke' ? (
                                    <Gem className="h-5 w-5 text-primary" />
                                  ) : role.name === 'knight' ? (
                                    <Sword className="h-5 w-5 text-primary" />
                                  ) : (
                                    <User2 className="h-5 w-5 text-muted-foreground" />
                                  )}
                                  {role.displayName || role.name}
                                </Label>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {isEnabled ? t("enabled") : t("disabled")}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="text-right">
                                <Label className="mb-1 block text-xs font-medium text-muted-foreground">{t("dailyLimit")}</Label>
                                <div className="flex items-center space-x-2">
                                  <Input
                                    type="number"
                                    min="-1"
                                    value={isEnabled ? String(limit) : "0"}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                      setConfig((prev: EmailServiceConfig) => ({
                                        ...prev,
                                        roleLimits: {
                                          ...prev.roleLimits,
                                          [role.name]: parseInt(e.target.value) || 0
                                        }
                                      }))
                                    }
                                    className="w-20 h-9 text-center text-sm font-medium"
                                    placeholder="0"
                                    disabled={isDisabled}
                                  />
                                  <span className="text-xs text-muted-foreground whitespace-nowrap">{tSend("dailyLimitUnit")}</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">0 = {t("unlimited")}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        <Button 
          onClick={handleSave}
          disabled={loading}
          className="w-full"
        >
          {loading ? t("saving") : t("save")}
        </Button>
      </div>
    </div>
  )
} 
