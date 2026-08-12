import { Header } from "@/components/layout/header"
import { auth } from "@/lib/auth"
import { Shield, Zap, Clock, Code2 } from "lucide-react"
import { ActionButton } from "@/components/home/action-button"
import { FeatureCard } from "@/components/home/feature-card"
import { LiveInboxPreview } from "@/components/home/live-inbox-preview"
import { getTranslations } from "next-intl/server"
import type { Locale } from "@/i18n/config"

export const runtime = "edge"

export default async function EastPaperHomePage({
  locale,
}: {
  locale: Locale
}) {
  const session = await auth()
  const t = await getTranslations({ locale, namespace: "home" })

  return (
    <div className="app-bg min-h-screen">
      <div className="container mx-auto max-w-[1280px] px-4 lg:px-8">
        <Header />

        <main className="relative flex min-h-[calc(100vh-4rem)] items-center py-6">
          <div className="absolute inset-0 -z-10 bg-grid-neon opacity-70" />
          <div className="absolute inset-x-0 top-16 -z-10 h-48 bg-gradient-to-b from-primary/10 to-transparent" />

          <div className="grid w-full items-center gap-10 py-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="text-center lg:text-left">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-xs font-medium text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                {t("badge")}
              </div>

              <div className="flex items-start gap-3">
                <span className="mt-1.5 hidden h-12 w-1 shrink-0 rounded-full bg-gradient-to-b from-primary to-brand-gold sm:block" />
                <h1 className="text-3xl font-bold leading-[1.4] text-foreground sm:text-4xl lg:text-[2.5rem]">
                  {t("title")}
                </h1>
              </div>

              <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-muted-foreground lg:mx-0">
                {t("subtitle")}
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-3 lg:justify-start">
                <ActionButton isLoggedIn={!!session} />
              </div>
            </div>

            <LiveInboxPreview />
          </div>
        </main>

        <section className="pb-8">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
        </section>
      </div>
    </div>
  )
}
