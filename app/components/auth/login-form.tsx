"use client"

import { useCallback, useState } from "react"
import { signIn } from "next-auth/react"
import { useTranslations } from "next-intl"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { KeyRound, Loader2, Mail, User2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Turnstile } from "@/components/auth/turnstile"
import { Logo } from "@/components/ui/logo"

interface TurnstileConfigProps {
  enabled: boolean
  siteKey: string
}

interface LoginFormProps {
  turnstile?: TurnstileConfigProps
}

interface FormErrors {
  account?: string
  email?: string
  password?: string
  confirmPassword?: string
  code?: string
}

export function LoginForm({ turnstile }: LoginFormProps) {
  const [account, setAccount] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [code, setCode] = useState("")
  const [codeSent, setCodeSent] = useState(false)
  const [codeMode, setCodeMode] = useState<"code" | "link">("code")
  const [sendingCode, setSendingCode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [turnstileToken, setTurnstileToken] = useState("")
  const [turnstileResetCounter, setTurnstileResetCounter] = useState(0)
  const [activeTab, setActiveTab] = useState<"login" | "register">("login")
  const { toast } = useToast()
  const t = useTranslations("auth.loginForm")

  const turnstileSiteKey = turnstile?.siteKey ?? ""
  const turnstileEnabled = Boolean(turnstile?.enabled && turnstileSiteKey)

  const resetTurnstile = useCallback(() => {
    setTurnstileToken("")
    setTurnstileResetCounter((prev) => prev + 1)
  }, [])

  const ensureTurnstileSolved = () => {
    if (!turnstileEnabled) return true
    if (turnstileToken) return true

    toast({
      title: t("toast.turnstileRequired"),
      description: t("toast.turnstileRequiredDesc"),
      variant: "destructive",
    })
    return false
  }

  const clearForm = () => {
    setAccount("")
    setEmail("")
    setPassword("")
    setConfirmPassword("")
    setCode("")
    setCodeSent(false)
    setErrors({})
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value as "login" | "register")
    clearForm()
  }

  const validateLoginForm = () => {
    const newErrors: FormErrors = {}
    if (!account) newErrors.account = t("errors.accountRequired")
    if (!password) newErrors.password = t("errors.passwordRequired")
    if (password && password.length < 8) {
      newErrors.password = t("errors.passwordTooShort")
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateRegisterForm = () => {
    const newErrors: FormErrors = {}
    if (!email) newErrors.email = t("errors.emailRequired")
    if (!password) newErrors.password = t("errors.passwordRequired")
    if (password && password.length < 8) {
      newErrors.password = t("errors.passwordTooShort")
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = t("errors.confirmPasswordRequired")
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = t("errors.passwordMismatch")
    }
    if (codeMode === "code" && !code) {
      newErrors.code = t("errors.codeRequired")
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLogin = async () => {
    if (!validateLoginForm()) return
    if (!ensureTurnstileSolved()) return

    setLoading(true)
    try {
      const result = await signIn("credentials", {
        username: account,
        password,
        turnstileToken,
        redirect: false,
      })

      if (result?.error) {
        toast({
          title: t("toast.loginFailed"),
          description: result.error,
          variant: "destructive",
        })
        setLoading(false)
        resetTurnstile()
        return
      }

      window.location.href = "/"
    } catch (error) {
      toast({
        title: t("toast.loginFailed"),
        description: error instanceof Error ? error.message : t("toast.loginFailedDesc"),
        variant: "destructive",
      })
      setLoading(false)
      resetTurnstile()
    }
  }

  const handleSendCode = async () => {
    if (!email) {
      setErrors({ email: t("errors.emailRequired") })
      return
    }
    if (!ensureTurnstileSolved()) return

    setSendingCode(true)
    try {
      const res = await fetch("/api/auth/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          purpose: "register",
          turnstileToken,
        }),
      })
      const data = (await res.json()) as {
        error?: string
        mode?: "code" | "link"
      }
      if (!res.ok) {
        throw new Error(data.error || t("toast.sendCodeFailed"))
      }
      setCodeMode(data.mode || "code")
      setCodeSent(true)
      toast({
        title: t("toast.codeSent"),
        description:
          data.mode === "link"
            ? t("toast.activationSentDesc")
            : t("toast.codeSentDesc"),
      })
    } catch (error) {
      toast({
        title: t("toast.sendCodeFailed"),
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      })
    } finally {
      setSendingCode(false)
    }
  }

  const handleRegister = async () => {
    if (!validateRegisterForm()) return
    if (!ensureTurnstileSolved()) return

    setLoading(true)
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          code: codeMode === "code" ? code : undefined,
          turnstileToken,
        }),
      })

      const data = (await response.json()) as {
        error?: string
        verificationRequired?: boolean
      }

      if (!response.ok) {
        throw new Error(data.error || t("toast.registerFailedDesc"))
      }

      if (data.verificationRequired) {
        toast({
          title: t("toast.activationSent"),
          description: t("toast.activationSentDesc"),
        })
        setLoading(false)
        clearForm()
        resetTurnstile()
        return
      }

      const result = await signIn("credentials", {
        username: email,
        password,
        turnstileToken,
        redirect: false,
      })

      if (result?.error) {
        toast({
          title: t("toast.loginFailed"),
          description: result.error || t("toast.autoLoginFailed"),
          variant: "destructive",
        })
        setLoading(false)
        resetTurnstile()
        return
      }

      window.location.href = "/"
    } catch (error) {
      toast({
        title: t("toast.registerFailed"),
        description: error instanceof Error ? error.message : t("toast.registerFailedDesc"),
        variant: "destructive",
      })
      setLoading(false)
      resetTurnstile()
    }
  }

  return (
    <Card className="w-[95%] max-w-md panel overflow-hidden shadow-xl">
      <CardHeader className="space-y-2 border-b border-border/70 bg-card/60 px-7 pb-6 pt-8">
        <div className="flex justify-center pb-1">
          <Logo />
        </div>
        <CardTitle className="text-center text-2xl text-foreground">
          {t("title")}
        </CardTitle>
        <CardDescription className="text-center leading-relaxed">
          {t("subtitle")}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-7 pb-8 pt-6">
        <Tabs value={activeTab} className="w-full" onValueChange={handleTabChange}>
          <TabsList className="mb-6 grid w-full grid-cols-2 rounded-lg bg-muted/70 p-1">
            <TabsTrigger value="login">{t("tabs.login")}</TabsTrigger>
            <TabsTrigger value="register">{t("tabs.register")}</TabsTrigger>
          </TabsList>
          <div className="min-h-[240px]">
            <TabsContent value="login" className="mt-0 space-y-4">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <div className="relative">
                    <div className="absolute left-3 top-2.5 text-muted-foreground">
                      <User2 className="h-5 w-5" />
                    </div>
                    <Input
                      className={cn(
                        "h-10 pl-10 pr-4",
                        errors.account && "border-destructive focus-visible:ring-destructive"
                      )}
                      placeholder={t("fields.account")}
                      value={account}
                      onChange={(e) => {
                        setAccount(e.target.value)
                        setErrors({})
                      }}
                      disabled={loading}
                    />
                  </div>
                  {errors.account && (
                    <p className="text-xs text-destructive">{errors.account}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <div className="relative">
                    <div className="absolute left-3 top-2.5 text-muted-foreground">
                      <KeyRound className="h-5 w-5" />
                    </div>
                    <Input
                      className={cn(
                        "h-10 pl-10 pr-4",
                        errors.password && "border-destructive focus-visible:ring-destructive"
                      )}
                      type="password"
                      placeholder={t("fields.password")}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        setErrors({})
                      }}
                      disabled={loading}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive">{errors.password}</p>
                  )}
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleLogin}
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("actions.login")}
              </Button>
            </TabsContent>

            <TabsContent value="register" className="mt-0 space-y-4">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <div className="relative">
                    <div className="absolute left-3 top-2.5 text-muted-foreground">
                      <Mail className="h-5 w-5" />
                    </div>
                    <Input
                      className={cn(
                        "h-10 pl-10 pr-4",
                        errors.email && "border-destructive focus-visible:ring-destructive"
                      )}
                      type="email"
                      placeholder={t("fields.email")}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        setErrors({})
                      }}
                      disabled={loading}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <div className="relative">
                    <div className="absolute left-3 top-2.5 text-muted-foreground">
                      <KeyRound className="h-5 w-5" />
                    </div>
                    <Input
                      className={cn(
                        "h-10 pl-10 pr-4",
                        errors.password && "border-destructive focus-visible:ring-destructive"
                      )}
                      type="password"
                      placeholder={t("fields.password")}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        setErrors({})
                      }}
                      disabled={loading}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive">{errors.password}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <div className="relative">
                    <div className="absolute left-3 top-2.5 text-muted-foreground">
                      <KeyRound className="h-5 w-5" />
                    </div>
                    <Input
                      className={cn(
                        "h-10 pl-10 pr-4",
                        errors.confirmPassword && "border-destructive focus-visible:ring-destructive"
                      )}
                      type="password"
                      placeholder={t("fields.confirmPassword")}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value)
                        setErrors({})
                      }}
                      disabled={loading}
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-destructive">{errors.confirmPassword}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <div className="flex gap-2">
                    <Input
                      className={cn(
                        "h-10 flex-1",
                        errors.code && "border-destructive focus-visible:ring-destructive"
                      )}
                      placeholder={t("fields.code")}
                      value={code}
                      onChange={(e) => {
                        setCode(e.target.value)
                        setErrors({})
                      }}
                      disabled={loading || codeMode === "link"}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 shrink-0"
                      onClick={handleSendCode}
                      disabled={sendingCode || !email}
                    >
                      {sendingCode ? t("actions.sending") : t("actions.sendCode")}
                    </Button>
                  </div>
                  {errors.code && (
                    <p className="text-xs text-destructive">{errors.code}</p>
                  )}
                  {codeSent && codeMode === "link" && (
                    <p className="text-xs text-muted-foreground">
                      {t("toast.activationSentDesc")}
                    </p>
                  )}
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleRegister}
                disabled={loading || !codeSent}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("actions.register")}
              </Button>
            </TabsContent>
          </div>
        </Tabs>
        {turnstileEnabled && turnstileSiteKey && (
          <div className={cn("space-y-2", activeTab === "login" ? "mt-4" : "")}>
            <Turnstile
              siteKey={turnstileSiteKey}
              onVerify={setTurnstileToken}
              onExpire={resetTurnstile}
              resetSignal={turnstileResetCounter}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
