import type { TemplateDefinition } from "../types"
import EastPaperHomePage from "./pages/home"

export const eastPaperTemplate: TemplateDefinition = {
  config: {
    id: "east-paper",
    name: "东方云笺",
    description: "宣纸暖底、朱砂青瓷配色，中式雅致风格。",
    version: "1.0.0",
    thumbnail:
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMjUwIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI1MCIgZmlsbD0iI0Y3RjVGMFIvPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSI0MDAiIGhlaWdodD0iMjUwIiBmaWxsPSIjRjdGNUYwIi8+PHJlY3QgeD0iMjQiIHk9IjQ4IiB3aWR0aD0iMTE2IiBoZWlnaHQ9IjE0IiByeD0iNyIgZmlsbD0iI0MyNDUyRiIvPjxyZWN0IHg9IjI0IiB5PSI4MCIgd2lkdGg9IjI0MCIgaGVpZ2h0PSIyMCIgcng9IjEwIiBmaWxsPSIjMjIyMjIyIi8+PHJlY3QgeD0iMjQiIHk9IjExNiIgd2lkdGg9IjE4MCIgaGVpZ2h0PSIxMCIgcng9IjUiIGZpbGw9IiM5OTk5OTkiLz48cmVjdCB4PSIxMDgiIHk9IjE2MCIgd2lkdGg9IjE4MCIgaGVpZ2h0PSI2MCIgcng9IjEyIiBmaWxsPSIjRkZGRkZGIiBzdHJva2U9IiNFNEUwRDYiLz48L3N2Zz4=",
  },
  HomePage: EastPaperHomePage,
}
