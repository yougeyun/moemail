import type { TemplateDefinition } from "../types"
import ClassicCleanBlueHomePage from "./pages/home"

export const classicCleanBlueTemplate: TemplateDefinition = {
  config: {
    id: "classic-clean-blue",
    name: "经典简洁·清爽蓝",
    description: "白底浅灰分区、品牌蓝主色，干净高效的通用风格。",
    version: "1.0.0",
    thumbnail:
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMjUwIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI1MCIgZmlsbD0iI0YyRjVGOSIvPjxyZWN0IHg9IjI0IiB5PSI0OCIgd2lkdGg9IjExNiIgaGVpZ2h0PSIxNCIgcng9IjciIGZpbGw9IiMyNTYzRUIiLz48cmVjdCB4PSIyNCIgeT0iODAiIHdpZHRoPSIyNDAiIGhlaWdodD0iMjAiIHJ4PSIxMCIgZmlsbD0iIzFGMjkzNyIvPjxyZWN0IHg9IjI0IiB5PSIxMTYiIHdpZHRoPSIxODAiIGhlaWdodD0iMTAiIHJ4PSI1IiBmaWxsPSIjOEM5QUI1Ii8+PHJlY3QgeD0iMTA4IiB5PSIxNjAiIHdpZHRoPSIxODAiIGhlaWdodD0iNjAiIHJ4PSIxMiIgZmlsbD0iI0ZGRkZGRiIgc3Ryb2tlPSIjRTNFOEVGIi8+PC9zdmc+",
  },
  HomePage: ClassicCleanBlueHomePage,
}
