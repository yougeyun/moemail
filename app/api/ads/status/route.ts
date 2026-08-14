import { NextResponse } from "next/server"
import { getUserId } from "@/lib/apiKey"
import { getAdsConfig, getAdsUserStatus } from "@/lib/ads"

export const runtime = "edge"

export async function GET() {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "未授权" }, { status: 401 })
  }

  const config = await getAdsConfig()
  const status = await getAdsUserStatus(userId)

  return NextResponse.json({
    ...status,
    rewardEmailQuota: config.rewardEmailQuota,
    rewardExpiryDays: config.rewardExpiryDays,
  })
}
