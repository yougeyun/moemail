"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { ExternalLink, Mail } from "lucide-react"
import { useBranding } from "@/components/brand/brand-provider"

interface BrandHeaderProps {
  title?: string
  subtitle?: string
  ctaText?: string
}

export function BrandHeader({
  title,
  subtitle,
  ctaText,
}: BrandHeaderProps) {
  const t = useTranslations("emails.shared.brand")
  const { siteName, logo } = useBranding()

  const displayTitle = title || t("title")
  const displaySubtitle = subtitle || t("subtitle")
  const displayCtaText = ctaText || t("cta")

  return (
    <div className="space-y-5 text-center lg:pb-4">
      <div className="flex justify-center pt-2">
        <Link
          href="https://moemail.app"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-3 transition-opacity hover:opacity-85"
        >
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logo}
              alt=""
              className="h-11 w-11 rounded-lg object-contain"
            />
          ) : null}
          <span className="text-2xl font-bold text-foreground">{siteName}</span>
        </Link>
      </div>

      <div className="space-y-3">
        <h1 className="mx-auto max-w-3xl text-2xl font-bold leading-relaxed text-foreground md:text-3xl">
          {displayTitle}
        </h1>
        <p className="mx-auto max-w-xl text-sm leading-relaxed text-muted-foreground">
          {displaySubtitle}
        </p>
      </div>

      <div className="flex justify-center">
        <Button asChild size="lg" className="gap-2 px-7">
          <Link href="https://moemail.app" target="_blank" rel="noopener noreferrer">
            <Mail className="h-4 w-4" />
            {displayCtaText}
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
