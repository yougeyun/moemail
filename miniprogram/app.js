const { getAdsConfig, showSplashAd } = require("./utils/ads")
const { request } = require("./utils/request")

App({
  globalData: {
    token: "",
    user: null,
    tabConfig: []
  },

  onLaunch() {
    const token = wx.getStorageSync("miniToken") || ""
    const user = wx.getStorageSync("miniUser") || null
    this.globalData.token = token
    this.globalData.user = user
    this.loadTabConfig()

    setTimeout(() => {
      getAdsConfig().then((config) => showSplashAd(config))
    }, 800)
  },

  async loadTabConfig() {
    try {
      const res = await request({ url: "/api/config/tabs" })
      this.globalData.tabConfig = (res && res.tabs) || []
    } catch (error) {
      this.globalData.tabConfig = []
    }
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
