import { and, eq, gte, sql } from "drizzle-orm"
import { getRequestContext } from "@cloudflare/next-on-pages"
import { createDb } from "@/lib/db"
import { adRewardRecords, userEmailQuotas, users } from "@/lib/schema"
import { getEmailQuotaSummary } from "@/lib/email-quota"

export interface AdsConfig {
  enabled: boolean
  splashAdUnitId: string
  bannerAdUnitId: string
  rewardedAdUnitId: string
  rewardedEnabled: boolean
  rewardEmailQuota: number
  rewardExpiryDays: number
  rewardExpiry: number
  rewardDailyLimit: number
}

export const DEFAULT_ADS_CONFIG: AdsConfig = {
  enabled: false,
  splashAdUnitId: "",
  bannerAdUnitId: "",
  rewardedAdUnitId: "",
  rewardedEnabled: false,
  rewardEmailQuota: 1,
  rewardExpiryDays: 30,
  rewardExpiry: 30 * 24 * 60 * 60 * 1000,
  rewardDailyLimit: 3,
}

function getEnv() {
  try {
    return getRequestContext().env ?? null
  } catch {
    return null
  }
}

export async function getAdsConfig(): Promise<AdsConfig> {
  const env = getEnv()
  if (!env?.SITE_CONFIG) return { ...DEFAULT_ADS_CONFIG }

  try {
    const raw = await env.SITE_CONFIG.get("ADS_CONFIG")
    if (!raw) return { ...DEFAULT_ADS_CONFIG }
    const parsed = JSON.parse(raw) as Partial<AdsConfig>
    return {
      ...DEFAULT_ADS_CONFIG,
      ...parsed,
    }
  } catch {
    return { ...DEFAULT_ADS_CONFIG }
  }
}

export async function saveAdsConfig(config: AdsConfig) {
  const env = getEnv()
  if (!env?.SITE_CONFIG) {
    throw new Error("广告配置暂不可用")
  }

  const next: AdsConfig = {
    ...DEFAULT_ADS_CONFIG,
    ...config,
    rewardExpiry:
      Number(config.rewardExpiryDays) === 0
        ? 0
        : Math.max(0, Number(config.rewardExpiryDays)) * 24 * 60 * 60 * 1000,
  }
  await env.SITE_CONFIG.put("ADS_CONFIG", JSON.stringify(next))
  return next
}

export async function getTodayRewardCount(userId: string): Promise<number> {
  const db = createDb()
  const start = new Date()
  start.setHours(0, 0, 0, 0)

  const rows = await db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(adRewardRecords)
    .where(
      and(
        eq(adRewardRecords.userId, userId),
        gte(adRewardRecords.createdAt, start)
      )
    )

  return Number(rows[0]?.count ?? 0)
}

export async function getAdsUserStatus(userId: string) {
  const config = await getAdsConfig()
  const todayCount = await getTodayRewardCount(userId)
  return {
    enabled: config.enabled && config.rewardedEnabled,
    dailyLimit: config.rewardDailyLimit,
    todayCount,
    remaining: Math.max(0, config.rewardDailyLimit - todayCount),
  }
}

export async function grantRewardedEmailQuota(userId: string) {
  const config = await getAdsConfig()
  if (!config.enabled || !config.rewardedEnabled || !config.rewardedAdUnitId) {
    throw new Error("激励视频功能未开启")
  }

  const db = createDb()
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  })
  if (!user) {
    throw new Error("账号不存在")
  }

  const todayCount = await getTodayRewardCount(userId)
  if (todayCount >= config.rewardDailyLimit) {
    throw new Error("今日激励视频奖励次数已用完")
  }

  const quota = Math.max(1, Math.floor(Number(config.rewardEmailQuota) || 1))
  const expiryDays = Math.max(0, Math.floor(Number(config.rewardExpiryDays) || 0))
  const expiry = config.rewardExpiry || (expiryDays === 0 ? 0 : expiryDays * 24 * 60 * 60 * 1000)
  const now = new Date()

  await db.insert(adRewardRecords).values({
    userId,
    quota,
    expiryDays,
    expiry,
    createdAt: now,
  })
  await db.insert(userEmailQuotas).values({
    userId,
    quota,
    expiryDays,
    expiry,
    sourceType: "ad_reward",
    createdAt: now,
  })

  const updatedQuota = user.redeemedEmailQuota + quota
  await db
    .update(users)
    .set({ redeemedEmailQuota: updatedQuota })
    .where(eq(users.id, userId))

  const summary = await getEmailQuotaSummary(userId, {
    redeemedEmailQuota: updatedQuota,
  })
  const status = await getAdsUserStatus(userId)

  return {
    success: true,
    addedQuota: quota,
    emailQuota: summary,
    rewardStatus: status,
  }
}
