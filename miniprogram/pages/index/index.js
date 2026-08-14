const { request } = require("../../utils/request")
const { formatTime, expiryLabel } = require("../../utils/format")
const { getAdsConfig, createBanner, showRewardedVideo } = require("../../utils/ads")

Page({
  data: {
    loading: false,
    emails: [],
    domains: [],
    domainIndex: 0,
    selectedDomain: "",
    expiryOptions: [
      { value: 3600000, label: "1小时" },
      { value: 86400000, label: "1天" },
      { value: 604800000, label: "7天" },
      { value: 0, label: "永久" }
    ],
    expiryIndex: 1,
    selectedExpiry: 86400000,
    selectedExpiryLabel: "1天",
    name: "",
    count: 1,
    emailLimit: null,
    quotaRemaining: null,
    total: 0,
    adsEnabled: false,
    rewardedAdUnitId: "",
    rewardEmailQuota: 1,
    rewardDailyLimit: 0,
    rewardTodayCount: 0,
    rewardRemaining: 0,
    showRewardButton: false,
    rewarding: false
  },

  onShow() {
    this.checkLogin()
  },

  onHide() {
    this.destroyBanner()
  },

  onUnload() {
    this.destroyBanner()
  },

  onPullDownRefresh() {
    Promise.all([this.loadConfig(), this.loadEmails(), this.loadAds()]).finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  async checkLogin() {
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
      this.loadConfig()
      this.loadEmails()
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
    const adsConfig = await getAdsConfig()
    if (!adsConfig || !adsConfig.enabled) {
      this.destroyBanner()
      this.setData({ adsEnabled: false, showRewardButton: false })
      return
    }

    const statusRes = await request({ url: "/api/ads/status" }).catch(() => null)
    const rewardRemaining =
      statusRes && typeof statusRes.remaining === "number"
        ? statusRes.remaining
        : 0
    this.setData({
      adsEnabled: true,
      rewardedAdUnitId: adsConfig.rewardedAdUnitId || "",
      rewardEmailQuota: adsConfig.rewardEmailQuota || 1,
      rewardDailyLimit: adsConfig.rewardDailyLimit || 0,
      rewardTodayCount: statusRes ? statusRes.todayCount || 0 : 0,
      rewardRemaining,
      showRewardButton:
        Boolean(adsConfig.rewardedEnabled) &&
        Boolean(adsConfig.rewardedAdUnitId) &&
        rewardRemaining > 0
    })
    this.ensureBanner(adsConfig)
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

  async watchRewardedVideo() {
    if (this.data.rewarding) return
    this.setData({ rewarding: true })
    try {
      const ended = await showRewardedVideo(this.data.rewardedAdUnitId)
      if (!ended) {
        wx.showToast({ title: "完整观看视频后才能领取奖励", icon: "none" })
        return
      }
      await request({ url: "/api/ads/reward", method: "POST" })
      wx.showToast({ title: "奖励已到账", icon: "success" })
      this.loadAds()
      this.loadConfig()
      this.loadEmails()
    } catch (error) {
      wx.showToast({ title: error.message, icon: "none" })
    } finally {
      this.setData({ rewarding: false })
    }
  },

  async loadConfig() {
    try {
      const res = await request({ url: "/api/config" })
      const allDomains = (res.emailDomains || "mail.59pk.net")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
      const allowedDomains =
        res.emailRules && res.emailRules.allowedDomains
          ? res.emailRules.allowedDomains
          : allDomains
      const domains = allowedDomains.length ? allowedDomains : allDomains
      const expiryValues =
        res.emailRules &&
        res.emailRules.allowedExpiries &&
        res.emailRules.allowedExpiries.length
          ? res.emailRules.allowedExpiries
          : [3600000, 86400000, 604800000, 0]
      const expiryOptions = expiryValues.map((value) => ({
        value,
        label: expiryLabel(value)
      }))
      this.setData({
        domains,
        selectedDomain: domains[0] || "",
        expiryOptions,
        selectedExpiry: expiryValues[0] || 86400000,
        selectedExpiryLabel: expiryLabel(expiryValues[0] || 86400000),
        expiryIndex: 0,
        emailLimit: res.emailLimit,
        quotaRemaining:
          res.emailQuota && typeof res.emailQuota.remaining === "number"
            ? res.emailQuota.remaining
            : null
      })
    } catch (error) {
      // Config is optional; email list still loads.
    }
  },

  async loadEmails() {
    this.setData({ loading: true })
    try {
      const res = await request({ url: "/api/emails" })
      const emails = (res.emails || []).map((item) => ({
        id: item.id,
        address: item.address,
        expiresText: formatTime(item.expiresAt)
      }))
      this.setData({
        emails,
        total: res.total || emails.length,
        loading: false
      })
    } catch (error) {
      this.setData({ loading: false })
      wx.showToast({ title: error.message, icon: "none" })
    }
  },

  onNameInput(event) {
    this.setData({ name: event.detail.value })
  },

  onCountInput(event) {
    this.setData({ count: event.detail.value })
  },

  onDomainChange(event) {
    const index = Number(event.detail.value)
    this.setData({
      domainIndex: index,
      selectedDomain: this.data.domains[index]
    })
  },

  onExpiryChange(event) {
    const index = Number(event.detail.value)
    this.setData({
      expiryIndex: index,
      selectedExpiry: this.data.expiryOptions[index].value,
      selectedExpiryLabel: this.data.expiryOptions[index].label
    })
  },

  async createEmail() {
    const count = Math.max(1, Math.floor(Number(this.data.count) || 1))
    const payload = {
      name: this.data.name.trim(),
      domain: this.data.selectedDomain,
      expiryTime: this.data.selectedExpiry
    }
    try {
      if (count === 1) {
        await request({
          url: "/api/emails/generate",
          method: "POST",
          data: payload
        })
      } else {
        await request({
          url: "/api/emails/batch",
          method: "POST",
          data: Object.assign({ count }, payload)
        })
      }
      wx.showToast({ title: "创建成功", icon: "success" })
      this.setData({ name: "", count: 1 })
      this.loadEmails()
      this.loadConfig()
    } catch (error) {
      wx.showToast({ title: error.message, icon: "none" })
      if (
        error.message.includes("最大邮箱数量限制") ||
        error.message.includes("额度")
      ) {
        wx.showModal({
          title: "邮箱额度不足",
          content: `当前额度不足，可看激励视频增加 ${this.data.rewardEmailQuota} 个邮箱额度`,
          confirmText: "看视频领取",
          cancelText: "取消",
          success: (result) => {
            if (result.confirm) {
              this.watchRewardedVideo()
            }
          }
        })
      }
    }
  },

  copyEmail(event) {
    wx.setClipboardData({
      data: event.currentTarget.dataset.address
    })
  },

  deleteEmail(event) {
    const id = event.currentTarget.dataset.id
    wx.showModal({
      title: "删除邮箱",
      content: "删除后该邮箱下的邮件将无法恢复",
      confirmColor: "#E5484D",
      success: async (result) => {
        if (!result.confirm) return
        try {
          await request({
            url: `/api/emails/${id}`,
            method: "DELETE"
          })
          this.loadEmails()
          this.loadConfig()
        } catch (error) {
          wx.showToast({ title: error.message, icon: "none" })
        }
      }
    })
  },

  selectEmail(event) {
    const { id, address } = event.currentTarget.dataset
    wx.setStorageSync("selectedEmail", { id, address })
    wx.switchTab({ url: "/pages/inbox/inbox" })
  }
})
