export interface TemplateConfig {
  id: string
  name: string
  description: string
  version: string
  thumbnail: string
}

import type { ComponentType } from "react"
import type { Locale } from "@/i18n/config"

export interface HomePageProps {
  locale: Locale
}

export interface TemplateDefinition {
  config: TemplateConfig
  HomePage: ComponentType<HomePageProps>
}
