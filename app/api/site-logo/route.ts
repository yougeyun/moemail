import { NextResponse } from "next/server"
import { getSiteBranding, parseDataUrl } from "@/lib/site-config"

export const runtime = "edge"

export async function GET() {
  const branding = await getSiteBranding()
  if (!branding.logo) {
    return new NextResponse(null, { status: 204 })
  }

  const image = parseDataUrl(branding.logo)
  if (!image) {
    return new NextResponse(null, { status: 204 })
  }

  return new Response(image.bytes, {
    headers: {
      "Content-Type": image.mimeType,
      "Cache-Control": "public, max-age=300",
    },
  })
}
