import { Header } from "@/components/layout/header"
import { auth } from "@/lib/auth"
import { Shield, Zap, Clock, Code2 } from "lucide-react"
import { ActionButton } from "@/components/home/action-button"
import { FeatureCard } from "@/components/home/feature-card"
import { LiveInboxPreview } from "@/components/home/live-inbox-preview"
import { getTranslations } from "next-intl/server"
import type { Locale } from "@/i18n/config"

export const runtime = "edge"

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: localeFromParams } = await params
  const locale = localeFromParams as Locale
  const session = await auth()
  const t = await getTranslations({ locale, namespace: "home" })

  return (
    <div className="app-bg min-h-screen">
      <div className="container mx-auto px-4 lg:px-8 max-w-[1600px]">
        <Header />

        <main className="relative flex min-h-[calc(100vh-4rem)] items-center">
          <div className="absolute inset-0 -z-10 bg-grid-neon opacity-60" />
          <div className="absolute inset-x-0 top-24 -z-10 h-64 bg-gradient-to-b from-primary/10 to-transparent blur-3xl" />

          <div className="grid w-full items-center gap-12 py-16 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="text-center lg:text-left">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-lime-400" />
                {t("subtitle")}
              </div>

              <h1 className="text-4xl font-extrabold leading-tight tracking-wide sm:text-5xl lg:text-6xl">
                <span className="text-gradient-neon">{t("title")}</span>
              </h1>

              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground lg:mx-0 lg:text-lg">
                一次创建，实时收信。隐私、速度与可爱并存，让每一次验证码和订阅都安全落地。
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
                <ActionButton isLoggedIn={!!session} />
              </div>
            </div>

            <LiveInboxPreview />
          </div>
        </main>

        <section className="pb-16">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
