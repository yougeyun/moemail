const { getAdsConfig, showSplashAd } = require("./utils/ads")

App({
  globalData: {
    token: "",
    user: null
  },

  onLaunch() {
    const token = wx.getStorageSync("miniToken") || ""
    const user = wx.getStorageSync("miniUser") || null
    this.globalData.token = token
    this.globalData.user = user

    setTimeout(() => {
      getAdsConfig().then((config) => showSplashAd(config))
    }, 800)
  },

  setSession(token, user) {
    this.globalData.token = token
    this.globalData.user = user || null
    wx.setStorageSync("miniToken", token)
    if (user) {
      wx.setStorageSync("miniUser", user)
    } else {
      wx.removeStorageSync("miniUser")
    }
  },

  clearSession() {
    this.globalData.token = ""
    this.globalData.user = null
    wx.removeStorageSync("miniToken")
    wx.removeStorageSync("miniUser")
  }
})
