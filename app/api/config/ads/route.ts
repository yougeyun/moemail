import { NextResponse } from "next/server"
import { checkPermission } from "@/lib/auth"
import { PERMISSIONS } from "@/lib/permissions"
import { getAdsConfig, saveAdsConfig, type AdsConfig } from "@/lib/ads"

export const runtime = "edge"

export async function GET() {
  const canAccess = await checkPermission(PERMISSIONS.MANAGE_CONFIG)
  if (!canAccess) {
    return NextResponse.json({ error: "权限不足" }, { status: 403 })
  }
  return NextResponse.json(await getAdsConfig())
}

export async function POST(request: Request) {
  const canAccess = await checkPermission(PERMISSIONS.MANAGE_CONFIG)
  if (!canAccess) {
    return NextResponse.json({ error: "权限不足" }, { status: 403 })
  }

  try {
    const body = (await request.json()) as Partial<AdsConfig>
    const current = await getAdsConfig()
    const candidate: AdsConfig = {
      enabled: Boolean(body.enabled ?? current.enabled),
      splashAdUnitId: (body.splashAdUnitId ?? current.splashAdUnitId).trim(),
      bannerAdUnitId: (body.bannerAdUnitId ?? current.bannerAdUnitId).trim(),
      rewardedAdUnitId: (body.rewardedAdUnitId ?? current.rewardedAdUnitId).trim(),
      rewardedEnabled: Boolean(body.rewardedEnabled ?? current.rewardedEnabled),
      rewardEmailQuota: Number(body.rewardEmailQuota ?? current.rewardEmailQuota),
      rewardExpiryDays: Number(
        body.rewardExpiryDays ?? current.rewardExpiryDays
      ),
      rewardExpiry: Number(body.rewardExpiry ?? current.rewardExpiry),
      rewardDailyLimit: Number(body.rewardDailyLimit ?? current.rewardDailyLimit),
    }

    if (
      candidate.enabled &&
      !candidate.splashAdUnitId &&
      !candidate.bannerAdUnitId &&
      !candidate.rewardedAdUnitId
    ) {
      return NextResponse.json(
        { error: "启用广告前至少需要填写一个广告位 ID" },
        { status: 400 }
      )
    }
    if (candidate.rewardedEnabled && !candidate.rewardedAdUnitId) {
      return NextResponse.json(
        { error: "启用激励视频奖励前必须填写激励视频广告位 ID" },
        { status: 400 }
      )
    }

    const next = await saveAdsConfig(candidate)
    return NextResponse.json({ success: true, config: next })
  } catch (error) {
    console.error("Failed to save ads config:", error)
    return NextResponse.json(
      { error: "保存广告配置失败" },
      { status: 500 }
    )
  }
}
