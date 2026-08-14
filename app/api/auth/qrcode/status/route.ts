import { NextResponse } from "next/server"
import { getQrLoginRecord } from "@/lib/qr-login"

export const runtime = "edge"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const token = url.searchParams.get("token")
  if (!token) {
    return NextResponse.json({ error: "参数无效" }, { status: 400 })
  }

  const record = await getQrLoginRecord(token)
  if (!record) {
    return NextResponse.json({ status: "expired" })
  }

  if (record.status === "confirmed" && record.ticket) {
    return NextResponse.json({
      status: "confirmed",
      ticket: record.ticket,
    })
  }

  return NextResponse.json({ status: record.status })
}
