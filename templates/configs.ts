import type { TemplateConfig } from "./types"

export const DEFAULT_TEMPLATE_ID = "east-paper"

export const TEMPLATE_CONFIGS: TemplateConfig[] = [
  {
    id: "east-paper",
    name: "东方云笺",
    description: "宣纸暖底、朱砂青瓷配色，中式雅致风格。",
    version: "1.0.0",
    thumbnail:
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMjUwIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI1MCIgZmlsbD0iI0Y3RjVGMFIvPjxyZWN0IHg9IjI0IiB5PSI0OCIgd2lkdGg9IjExNiIgaGVpZ2h0PSIxNCIgcng9IjciIGZpbGw9IiNDMjQ1MkYiLz48cmVjdCB4PSIyNCIgeT0iODAiIHdpZHRoPSIyNDAiIGhlaWdodD0iMjAiIHJ4PSIxMCIgZmlsbD0iIzIyMjIyMiIvPjxyZWN0IHg9IjI0IiB5PSIxMTYiIHdpZHRoPSIxODAiIGhlaWdodD0iMTAiIHJ4PSI1IiBmaWxsPSIjOTk5OTk5Ii8+PHJlY3QgeD0iMTA4IiB5PSIxNjAiIHdpZHRoPSIxODAiIGhlaWdodD0iNjAiIHJ4PSIxMiIgZmlsbD0iI0ZGRkZGRiIgc3Ryb2tlPSIjRTRFMEQ2Ii8+PC9zdmc+",
  },
  {
    id: "neon-night",
    name: "霓虹夜航",
    description: "深空黑底、霓虹青紫配色，赛博夜景风格。",
    version: "1.0.0",
    thumbnail:
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMjUwIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI1MCIgZmlsbD0iIzA1MDcwRCIvPjxyZWN0IHg9IjI0IiB5PSI0OCIgd2lkdGg9IjExNiIgaGVpZ2h0PSIxNCIgcng9IjciIGZpbGw9IiMyMkQzRUUiLz48cmVjdCB4PSIyNCIgeT0iODAiIHdpZHRoPSIyNDAiIGhlaWdodD0iMjAiIHJ4PSIxMCIgZmlsbD0iI0U1RUFGMiIvPjxyZWN0IHg9IjI0IiB5PSIxMTYiIHdpZHRoPSIxODAiIGhlaWdodD0iMTAiIHJ4PSI1IiBmaWxsPSIjN0U5MkIwIi8+PHJlY3QgeD0iMTA4IiB5PSIxNjAiIHdpZHRoPSIxODAiIGhlaWdodD0iNjAiIHJ4PSIxMiIgZmlsbD0iIzBCMTIyMCIgc3Ryb2tlPSIjMjJEM0VFIi8+PC9zdmc+",
  },
  {
    id: "classic-clean-blue",
    name: "经典简洁·清爽蓝",
    description: "白底浅灰分区、品牌蓝主色，干净高效的通用风格。",
    version: "1.0.0",
    thumbnail:
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMjUwIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI1MCIgZmlsbD0iI0YyRjVGOSIvPjxyZWN0IHg9IjI0IiB5PSI0OCIgd2lkdGg9IjExNiIgaGVpZ2h0PSIxNCIgcng9IjciIGZpbGw9IiMyNTYzRUIiLz48cmVjdCB4PSIyNCIgeT0iODAiIHdpZHRoPSIyNDAiIGhlaWdodD0iMjAiIHJ4PSIxMCIgZmlsbD0iIzFGMjkzNyIvPjxyZWN0IHg9IjI0IiB5PSIxMTYiIHdpZHRoPSIxODAiIGhlaWdodD0iMTAiIHJ4PSI1IiBmaWxsPSIjOEM5QUI1Ii8+PHJlY3QgeD0iMTA4IiB5PSIxNjAiIHdpZHRoPSIxODAiIGhlaWdodD0iNjAiIHJ4PSIxMiIgZmlsbD0iI0ZGRkZGRiIgc3Ryb2tlPSIjRTNFOEVGIi8+PC9zdmc+",
  },
]

export function isTemplateId(
  templateId: string | null | undefined
): boolean {
  return TEMPLATE_CONFIGS.some(
    (template) => template.id === templateId
  )
}
