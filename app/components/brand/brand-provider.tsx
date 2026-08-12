"use client"

import { createContext, use, type ReactNode } from "react"
import type { SiteBranding } from "@/lib/site-config"

const DEFAULT_BRANDING: SiteBranding = {
  siteName: "MoeMail",
  siteTitle: "",
  siteDescription: "",
  siteKeywords: "",
  logo: "",
  icons: {},
  activeTemplate: "east-paper",
}

const BrandContext = createContext<SiteBranding | null>(null)

export function BrandProvider({
  value,
  children,
}: {
  value: SiteBranding
  children: ReactNode
}) {
  return <BrandContext value={value}>{children}</BrandContext>
}

export function useBranding(): SiteBranding {
  return use(BrandContext) ?? DEFAULT_BRANDING
}
