import { Header } from "@/components/layout/header"
import { auth } from "@/lib/auth"
import { Shield, Zap, Clock, Code2 } from "lucide-react"
import { ActionButton } from "@/components/home/action-button"
import { FeatureCard } from "@/components/home/feature-card"
import { LiveInboxPreview } from "@/components/home/live-inbox-preview"
import { getTranslations } from "next-intl/server"
import type { Locale } from "@/i18n/config"

export const runtime = "edge"

export default async function NeonNightHomePage({
  locale,
}: {
  locale: Locale
}) {
  const session = await auth()
  const t = await getTranslations({ locale, namespace: "home" })

  return (
    <div className="app-bg flex min-h-screen flex-col">
      <div className="container mx-auto flex max-w-[1280px] flex-1 flex-col px-4 lg:px-8">
        <Header />

        <main className="relative flex flex-1 flex-col py-1 lg:py-6">
          <div className="absolute inset-0 -z-10 bg-grid-neon opacity-60" />
          <div className="absolute inset-x-0 top-20 -z-10 h-56 bg-gradient-to-b from-primary/10 to-transparent blur-2xl" />

          <div className="grid w-full flex-1 content-center items-center gap-5 py-1 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:py-4">
            <div className="text-center lg:text-left">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary lg:mb-5">
                <span className="h-1.5 w-1.5 rounded-full bg-lime-400 shadow-[0_0_8px_rgba(163,230,53,0.8)]" />
                {t("badge")}
              </div>

              <h1 className="text-3xl font-extrabold leading-[1.25] tracking-wide text-foreground sm:text-4xl lg:text-[2.75rem]">
                <span className="text-gradient-neon">{t("title")}</span>
              </h1>

              <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-muted-foreground lg:mx-0 lg:mt-4">
                {t("subtitle")}
              </p>

              <div className="mt-5 flex flex-wrap justify-center gap-3 lg:mt-7 lg:justify-start">
                <ActionButton isLoggedIn={!!session} />
              </div>
            </div>

            <div className="animate-fade-up" style={{ animationDelay: "200ms" }}>
              <LiveInboxPreview />
            </div>
          </div>

          <section className="animate-fade-up pt-3 pb-1 lg:pt-8 lg:pb-6" style={{ animationDelay: "320ms" }}>
            <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-4">
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
        </main>
      </div>
    </div>
  )
}
