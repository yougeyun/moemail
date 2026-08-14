import { getAdsConfig } from "@/lib/ads"

export const runtime = "edge"

export async function GET() {
  const config = await getAdsConfig()
  return Response.json({
    enabled: config.enabled,
    splashAdUnitId: config.splashAdUnitId,
    bannerAdUnitId: config.bannerAdUnitId,
    rewardedAdUnitId: config.rewardedAdUnitId,
    rewardedEnabled: config.rewardedEnabled,
    rewardEmailQuota: config.rewardEmailQuota,
    rewardExpiryDays: config.rewardExpiryDays,
    rewardDailyLimit: config.rewardDailyLimit,
  })
}
