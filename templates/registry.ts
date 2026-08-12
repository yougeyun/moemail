import type { TemplateDefinition } from "./types"
import { eastPaperTemplate } from "./east-paper"
import { neonNightTemplate } from "./neon-night"
import { classicCleanBlueTemplate } from "./classic-clean-blue"
import { TEMPLATE_CONFIGS } from "./configs"

export const DEFAULT_TEMPLATE_ID = "east-paper"

export const TEMPLATES: TemplateDefinition[] = [
  eastPaperTemplate,
  neonNightTemplate,
  classicCleanBlueTemplate,
]

export { TEMPLATE_CONFIGS }

export function isTemplateId(
  templateId: string | null | undefined
): boolean {
  return TEMPLATE_CONFIGS.some(
    (template) => template.id === templateId
  )
}

export function getTemplateById(
  templateId?: string | null
): TemplateDefinition {
  return (
    TEMPLATES.find((template) => template.config.id === templateId) ??
    eastPaperTemplate
  )
}
