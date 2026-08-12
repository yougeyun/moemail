import { NextResponse } from "next/server"
import { getSiteBranding, parseDataUrl } from "@/lib/site-config"

export const runtime = "edge"

const SUPPORTED_SIZES = [16, 32, 192, 512] as const

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sizeParam = Number(searchParams.get("size") || "192")
  const size = (
    SUPPORTED_SIZES.includes(sizeParam as (typeof SUPPORTED_SIZES)[number])
      ? sizeParam
      : 192
  ) as (typeof SUPPORTED_SIZES)[number]

  const branding = await getSiteBranding()
  const dataUrl = branding.icons[size]

  if (dataUrl) {
    const image = parseDataUrl(dataUrl)
    if (image) {
      return new Response(image.bytes, {
        headers: {
          "Content-Type": image.mimeType,
          "Cache-Control": "public, max-age=300",
        },
      })
    }
  }

  const fallbackSize = size >= 256 ? 512 : 192
  return NextResponse.redirect(
    new URL(`/icons/icon-${fallbackSize}x${fallbackSize}.png`, request.url)
  )
}
