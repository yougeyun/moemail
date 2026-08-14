import { NextResponse } from "next/server"
import { getUserId } from "@/lib/apiKey"
import { grantRewardedEmailQuota } from "@/lib/ads"

export const runtime = "edge"

export async function POST() {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "未授权" }, { status: 401 })
  }

  try {
    const result = await grantRewardedEmailQuota(userId)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Failed to grant rewarded email quota:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "领取奖励失败" },
      { status: 400 }
    )
  }
}
