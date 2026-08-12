"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { SignButton } from "@/components/auth/sign-button"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { LanguageSwitcher } from "@/components/layout/language-switcher"
import { Logo } from "@/components/ui/logo"
import { cn } from "@/lib/utils"

export function Header() {
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations("common.nav")

  const links = [
    { href: `/${locale}`, label: t("home"), exact: true },
    { href: `/${locale}/moe`, label: t("mailbox") },
    { href: `/${locale}/profile`, label: t("profile") },
  ]

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b bg-background/75 backdrop-blur-xl">
      <div className="container mx-auto h-full px-4 lg:px-8 max-w-[1600px]">
        <div className="h-full flex items-center justify-between gap-3">
          <Logo />

          <nav className="hidden md:flex items-center gap-1 rounded-full border border-border/70 bg-background/60 p-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-4 py-1.5 text-sm rounded-full transition-all",
                  isActive(link.href, link.exact)
                    ? "bg-primary text-primary-foreground neon-glow"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-x-1.5 sm:gap-x-3">
            <LanguageSwitcher />
            <ThemeToggle />
            <SignButton />
          </div>
        </div>
      </div>
    </header>
  )
}
