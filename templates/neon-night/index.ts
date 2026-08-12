import type { TemplateDefinition } from "../types"
import NeonNightHomePage from "./pages/home"

export const neonNightTemplate: TemplateDefinition = {
  config: {
    id: "neon-night",
    name: "霓虹夜航",
    description: "深空黑底、霓虹青紫配色，赛博夜景风格。",
    version: "1.0.0",
    thumbnail:
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMjUwIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI1MCIgZmlsbD0iIzA1MDcwRCIvPjxyZWN0IHg9IjI0IiB5PSI0OCIgd2lkdGg9IjExNiIgaGVpZ2h0PSIxNCIgcng9IjciIGZpbGw9IiMyMkQzRUUiLz48cmVjdCB4PSIyNCIgeT0iODAiIHdpZHRoPSIyNDAiIGhlaWdodD0iMjAiIHJ4PSIxMCIgZmlsbD0iI0U1RUFGMiIvPjxyZWN0IHg9IjI0IiB5PSIxMTYiIHdpZHRoPSIxODAiIGhlaWdodD0iMTAiIHJ4PSI1IiBmaWxsPSIjN0U5MkIwIi8+PHJlY3QgeD0iMTA4IiB5PSIxNjAiIHdpZHRoPSIxODAiIGhlaWdodD0iNjAiIHJ4PSIxMiIgZmlsbD0iIzBCMTIyMCIgc3Ryb2tlPSIjMjJEM0VFIi8+PC9zdmc+",
  },
  HomePage: NeonNightHomePage,
}
