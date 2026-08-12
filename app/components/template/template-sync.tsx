"use client"

import { useEffect } from "react"

export function TemplateSync({ templateId }: { templateId: string }) {
  useEffect(() => {
    document.body.dataset.template = templateId
  }, [templateId])
  return null
}
