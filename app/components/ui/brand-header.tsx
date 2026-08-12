"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { ExternalLink, Mail } from "lucide-react"

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

  const displayTitle = title || t("title")
  const displaySubtitle = subtitle || t("subtitle")
  const displayCtaText = ctaText || t("cta")

  return (
    <div className="text-center space-y-5 lg:pb-4">
      <div className="flex justify-center pt-2">
        <Link
          href="https://moemail.app"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-3 transition-opacity hover:opacity-85"
        >
          <svg
            width="52"
            height="52"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-[0_0_14px_hsl(var(--primary)/0.35)] group-hover:drop-shadow-[0_0_20px_hsl(var(--primary)/0.55)] transition-all duration-300"
          >
            <rect
              x="8"
              y="16"
              width="48"
              height="36"
              rx="6"
              fill="hsl(var(--card))"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
            />
            <path
              d="M8 16l24 16 24-16"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
            />
            <path
              d="M24 27h4v12h-4zM30 27h4v12h-4zM36 27h4v12h-4z"
              fill="hsl(var(--primary))"
            />
            <path
              d="M27 33h4v4h-4zM33 33h4v4h-4zM39 33h4v4h-4z"
              fill="hsl(var(--secondary))"
            />
          </svg>
          <span className="text-3xl font-bold tracking-wider text-gradient-brand">
            MoeMail
          </span>
        </Link>
      </div>

      <div className="space-y-3">
        <h1 className="mx-auto max-w-2xl text-2xl font-bold tracking-wide md:text-3xl">
          <span className="text-gradient-neon">{displayTitle}</span>
        </h1>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          {displaySubtitle}
        </p>
      </div>

      <div className="flex justify-center">
        <Button asChild size="lg" className="gap-2 px-8">
          <Link href="https://moemail.app" target="_blank" rel="noopener noreferrer">
            <Mail className="h-5 w-5" />
            {displayCtaText}
            <ExternalLink className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
