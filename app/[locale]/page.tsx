import { getTemplateById } from "@/templates/registry"
import { getActiveTemplateId } from "@/lib/site-config"
import { resolvePreviewTemplateId } from "@/lib/template-preview"
import { TemplateSync } from "@/components/template/template-sync"
import type { Locale } from "@/i18n/config"

export const runtime = "edge"

export default async function Home({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { locale: localeFromParams } = await params
  const locale = localeFromParams as Locale
  const query = await searchParams
  const activeTemplateId = await getActiveTemplateId()
  const templateId = await resolvePreviewTemplateId(query, activeTemplateId)

  const template = getTemplateById(templateId)
  const HomePage = template.HomePage

  return (
    <>
      <TemplateSync templateId={templateId} />
      <HomePage locale={locale} />
    </>
  )
}
