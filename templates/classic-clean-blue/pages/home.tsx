import { Header } from "@/components/layout/header"
import { auth } from "@/lib/auth"
import { Shield, Zap, Clock, Code2 } from "lucide-react"
import { ActionButton } from "@/components/home/action-button"
import { FeatureCard } from "@/components/home/feature-card"
import { LiveInboxPreview } from "@/components/home/live-inbox-preview"
import { getTranslations } from "next-intl/server"
import type { Locale } from "@/i18n/config"

export const runtime = "edge"

export default async function ClassicCleanBlueHomePage({
  locale,
}: {
  locale: Locale
}) {
  const session = await auth()
  const t = await getTranslations({ locale, namespace: "home" })

  return (
    <div className="app-bg min-h-screen">
      <div className="container mx-auto max-w-[1100px] px-4 lg:px-6">
        <Header />

        <main className="flex min-h-[calc(100vh-4rem)] items-center py-6">
          <div className="w-full">
            <div className="grid items-center gap-6 lg:grid-cols-[1fr_1fr]">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-md bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {t("badge")}
                </div>
                <h1 className="text-3xl font-bold leading-snug text-foreground sm:text-4xl">
                  {t("title")}
                </h1>
                <p className="mt-3 max-w-lg text-base leading-relaxed text-muted-foreground">
                  {t("subtitle")}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <ActionButton isLoggedIn={!!session} />
                </div>
              </div>

              <LiveInboxPreview />
            </div>

                <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <FeatureCard
                icon={<Shield className="h-5 w-5" />}
                title={t("features.privacy.title")}
                description={t("features.privacy.description")}
              />
              <FeatureCard
                icon={<Zap className="h-5 w-5" />}
                title={t("features.instant.title")}
                description={t("features.instant.description")}
              />
              <FeatureCard
                icon={<Clock className="h-5 w-5" />}
                title={t("features.expiry.title")}
                description={t("features.expiry.description")}
              />
              <FeatureCard
                icon={<Code2 className="h-5 w-5" />}
                title={t("features.openapi.title")}
                description={t("features.openapi.description")}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
