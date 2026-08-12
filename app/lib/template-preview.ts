import { isTemplateId } from "@/templates/configs"
import { checkPermission } from "@/lib/auth"
import { PERMISSIONS } from "@/lib/permissions"

export async function resolvePreviewTemplateId(
  searchParams: Record<string, string | string[] | undefined>,
  activeTemplateId: string
): Promise<string> {
  const raw =
    typeof searchParams.template === "string"
      ? searchParams.template
      : null
  if (!raw || !isTemplateId(raw)) return activeTemplateId

  if (process.env.NODE_ENV === "development") return raw

  try {
    const canPreview = await checkPermission(PERMISSIONS.MANAGE_CONFIG)
    return canPreview ? raw : activeTemplateId
  } catch {
    return activeTemplateId
  }
}
