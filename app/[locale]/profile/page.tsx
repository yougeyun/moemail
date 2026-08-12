import { Header } from "@/components/layout/header"
import { ProfileCard } from "@/components/profile/profile-card"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import type { Locale } from "@/i18n/config"

export const runtime = "edge"

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: localeFromParams } = await params
  const locale = localeFromParams as Locale
  const session = await auth()
  
  if (!session?.user) {
    redirect(`/${locale}`)
  }

  return (
    <div className="app-bg relative min-h-screen">
      <div className="absolute inset-0 -z-10 bg-grid-neon opacity-40" />
      <div className="container mx-auto px-4 lg:px-8 max-w-[1080px]">
        <Header />
        <main className="pb-10 pt-8">
          <ProfileCard user={session.user} />
        </main>
      </div>
    </div>
  )
}

