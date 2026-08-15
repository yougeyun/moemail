"use client"

import Link from "next/link"
import { ReactNode } from "react"
import { useLocale, useTranslations } from "next-intl"
import {
  ArrowLeft,
  Globe,
  KeyRound,
  LayoutGrid,
  Mail,
  Megaphone,
  Settings,
  Users,
  UserCog,
  Wrench,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface AdminSettingsLayoutProps {
  active: string
  sections: string[]
  children: ReactNode
}

const SECTION_ICONS: Record<string, typeof Globe> = {
  website: Globe,
  members: Users,
  users: UserCog,
  activation: KeyRound,
  email: Mail,
  wechat: Megaphone,
  navigation: LayoutGrid,
  developer: Wrench,
}

export function AdminSettingsLayout({
  active,
  sections,
  children,
}: AdminSettingsLayoutProps) {
  const t = useTranslations("profile.admin")
  const locale = useLocale()

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">{t("title")}</h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              {t("subtitle")}
            </p>
          </div>
        </div>
        <Link
          href={`/${locale}/profile`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("back")}
        </Link>
      </div>

      <div className="flex flex-col gap-5 lg:flex-row">
        <aside className="shrink-0 lg:w-56">
          <nav className="panel-card flex gap-1.5 overflow-x-auto p-2 lg:flex-col">
            {sections.map((key) => {
              const Icon = SECTION_ICONS[key] || Globe
              const isActive = key === active
              return (
                <Link
                  key={key}
                  href={`/${locale}/profile/admin/${key}`}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{t(key)}</span>
                </Link>
              )
            })}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  )
}
