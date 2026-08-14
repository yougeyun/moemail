const { request } = require("../../utils/request")
const { formatTime } = require("../../utils/format")
const { getAdsConfig, createBanner } = require("../../utils/ads")

Page({
  data: {
    selectedEmail: null,
    showEmailChoices: false,
    emailChoices: [],
    messages: [],
    loading: false,
    nextCursor: null,
    total: 0,
    adsEnabled: false
  },

  onShow() {
    this.checkSession()
    this.startPolling()
  },

  onHide() {
    this.destroyBanner()
    this.stopPolling()
  },

  onUnload() {
    this.destroyBanner()
    this.stopPolling()
  },

  startPolling() {
    this.stopPolling()
    this.pollTimer = setInterval(() => {
      if (this.data.selectedEmail) {
        this.loadMessages(true)
      }
    }, 30000)
  },

  stopPolling() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer)
      this.pollTimer = null
    }
  },

  async checkSession() {
    const token = wx.getStorageSync("miniToken")
    if (!token) {
      wx.redirectTo({ url: "/pages/login/login" })
      return
    }
    try {
      const res = await request({ url: "/api/auth/wechat/me" })
      if (res.needsBinding) {
        wx.showToast({ title: "请先绑定邮箱", icon: "none" })
        wx.switchTab({ url: "/pages/profile/profile" })
        return
      }
      const selectedEmail = wx.getStorageSync("selectedEmail") || null
      this.setData({ selectedEmail })
      this.loadMessages(true)
      this.loadAds()
    } catch (error) {
      if (
        error.message.includes("登录状态已失效") ||
        error.message.includes("未登录")
      ) {
        getApp().clearSession()
        wx.redirectTo({ url: "/pages/login/login" })
      }
    }
  },

  async loadAds() {
    const config = await getAdsConfig()
    if (!config || !config.enabled) {
      this.destroyBanner()
      this.setData({ adsEnabled: false })
      return
    }
    this.setData({ adsEnabled: Boolean(config.bannerAdUnitId) })
    this.ensureBanner(config)
  },

  ensureBanner(config) {
    this.destroyBanner()
    if (config && config.enabled && config.bannerAdUnitId) {
      this.bannerAd = createBanner(config)
      if (this.bannerAd) {
        this.bannerAd.show().catch(() => {})
      }
    }
  },

  destroyBanner() {
    if (this.bannerAd) {
      try {
        this.bannerAd.destroy()
      } catch (error) {
        // Banner may already be destroyed by the runtime.
      }
      this.bannerAd = null
    }
  },

  onPullDownRefresh() {
    this.loadMessages(true).finally(() => wx.stopPullDownRefresh())
  },

  onReachBottom() {
    if (this.data.nextCursor) {
      this.loadMessages(false)
    }
  },

  async loadMessages(reset) {
    if (!this.data.selectedEmail) return
    if (this.data.loading) return
    this.setData({ loading: true })
    try {
      const cursor = reset ? "" : this.data.nextCursor || ""
      const url = `/api/emails/${this.data.selectedEmail.id}?cursor=${cursor}`
      const res = await request({ url })
      const mapped = (res.messages || []).map((item) => ({
        id: item.id,
        subject: item.subject || "（无主题）",
        from: item.from_address || "",
        time: formatTime(item.received_at)
      }))
      this.setData({
        messages: reset ? mapped : this.data.messages.concat(mapped),
        nextCursor: res.nextCursor || null,
        total: res.total || mapped.length,
        loading: false
      })
    } catch (error) {
      this.setData({ loading: false })
      if (reset) {
        wx.showToast({ title: error.message, icon: "none" })
      }
    }
  },

  async toggleEmailChoices() {
    if (this.data.showEmailChoices) {
      this.setData({ showEmailChoices: false })
      return
    }
    try {
      const res = await request({ url: "/api/emails" })
      this.setData({
        emailChoices: res.emails || [],
        showEmailChoices: true
      })
    } catch (error) {
      wx.showToast({ title: error.message, icon: "none" })
    }
  },

  chooseEmail(event) {
    const { id, address } = event.currentTarget.dataset
    wx.setStorageSync("selectedEmail", { id, address })
    this.setData({
      selectedEmail: { id, address },
      showEmailChoices: false,
      messages: [],
      nextCursor: null
    })
    this.loadMessages(true)
  },

  openMessage(event) {
    const { id } = event.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/message/message?id=${id}&emailId=${this.data.selectedEmail.id}`
    })
  },

  goCompose() {
    wx.navigateTo({
      url: `/pages/compose/compose?emailId=${this.data.selectedEmail.id}`
    })
  }
})
