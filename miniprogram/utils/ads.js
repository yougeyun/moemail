const { API_BASE_URL } = require("./config")

let cachedConfig = null
let fetching = null

function fetchConfig(force) {
  if (cachedConfig && !force) return Promise.resolve(cachedConfig)
  if (fetching) return fetching

  fetching = new Promise((resolve) => {
    wx.request({
      url: `${API_BASE_URL}/api/ads/config`,
      method: "GET",
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cachedConfig = res.data || null
          resolve(cachedConfig)
        } else {
          resolve(null)
        }
      },
      fail() {
        resolve(null)
      },
      complete() {
        fetching = null
      }
    })
  })
  return fetching
}

function getAdsConfig() {
  return fetchConfig()
}

function showSplashAd(config) {
  if (
    !config ||
    !config.enabled ||
    !config.splashAdUnitId ||
    !wx.createInterstitialAd
  ) {
    return
  }

  const ad = wx.createInterstitialAd({
    adUnitId: config.splashAdUnitId
  })
  ad.onError(() => {})
  ad.show().catch(() => {
    ad.load()
      .then(() => ad.show())
      .catch(() => {})
  })
}

function createBanner(config) {
  if (!config || !config.enabled || !config.bannerAdUnitId || !wx.createBannerAd) {
    return null
  }

  const windowInfo = wx.getWindowInfo
    ? wx.getWindowInfo()
    : wx.getSystemInfoSync()
  const top = Math.max(0, (windowInfo.windowHeight || 600) - 150)
  const ad = wx.createBannerAd({
    adUnitId: config.bannerAdUnitId,
    adIntervals: 30,
    style: {
      left: 0,
      top,
      width: windowInfo.windowWidth || 375
    }
  })
  ad.onError(() => {})
  return ad
}

function showRewardedVideo(adUnitId) {
  return new Promise((resolve) => {
    if (!adUnitId || !wx.createRewardedVideoAd) {
      resolve(false)
      return
    }

    const ad = wx.createRewardedVideoAd({ adUnitId })
    let settled = false
    const finish = (ended) => {
      if (settled) return
      settled = true
      try {
        ad.offClose(onClose)
        ad.offError(onError)
      } catch (error) {
        // Older base libraries may not expose offClose/offError.
      }
      resolve(ended)
    }
    const onClose = (result) => finish(Boolean(result && result.isEnded))
    const onError = () => finish(false)

    ad.onClose(onClose)
    ad.onError(onError)
    ad.show().catch(() => {
      ad.load()
        .then(() => ad.show())
        .catch(() => finish(false))
    })
  })
}

module.exports = {
  getAdsConfig,
  showSplashAd,
  createBanner,
  showRewardedVideo
}
