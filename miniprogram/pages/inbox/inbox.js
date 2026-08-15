const { request } = require("../../utils/request")
const { formatTime } = require("../../utils/format")
const { getAdsConfig, createBanner } = require("../../utils/ads")

Page({
  data: {
    messages: [],
    loading: false,
    loadingMore: false,
    nextCursor: null,
    total: 0,
    emailFilters: [],
    filterIndex: 0,
    activeEmailId: "",
    activeEmailAddress: "全部邮箱",
    unreadOnly: false,
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
      if (!this.data.loading) {
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
      this.loadEmailFilters()
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

  async loadEmailFilters() {
    try {
      let emails = []
      let cursor = ""
      do {
        const query = cursor
          ? `pageSize=100&cursor=${encodeURIComponent(cursor)}`
          : "pageSize=100"
        const res = await request({ url: `/api/emails?${query}` })
        const page = res.emails || []
        const seen = new Set(emails.map((item) => item.id))
        emails = emails.concat(page.filter((item) => !seen.has(item.id)))
        cursor = res.nextCursor || ""
      } while (cursor)
      const filters = [{ id: "", address: "全部邮箱" }].concat(
        emails.map((item) => ({
          id: item.id,
          address: item.address
        }))
      )
      const currentId = this.data.activeEmailId
      const index = filters.findIndex((item) => item.id === currentId)
      const activeIndex = index === -1 ? 0 : index
      this.setData({
        emailFilters: filters,
        filterIndex: activeIndex,
        activeEmailId: filters[activeIndex].id,
        activeEmailAddress: filters[activeIndex].address
      })
    } catch (error) {
      wx.showToast({ title: error.message, icon: "none" })
    }
  },

  onFilterEmailChange(event) {
    const index = Number(event.detail.value)
    const filter = this.data.emailFilters[index]
    if (!filter) return
    this.setData({
      filterIndex: index,
      activeEmailId: filter.id,
      activeEmailAddress: filter.address
    })
    if (filter.id) {
      wx.setStorageSync("selectedEmail", {
        id: filter.id,
        address: filter.address
      })
    } else {
      wx.removeStorageSync("selectedEmail")
    }
    this.loadMessages(true)
  },

  onUnreadChange(event) {
    this.setData({ unreadOnly: Boolean(event.detail.value) })
    this.loadMessages(true)
  },

  onPullDownRefresh() {
    Promise.all([this.loadEmailFilters(), this.loadMessages(true)]).finally(
      () => wx.stopPullDownRefresh()
    )
  },

  onReachBottom() {
    if (this.data.nextCursor) {
      this.loadMessages(false)
    }
  },

  async loadMessages(reset) {
    if (this.data.loading) return
    this.setData({ loading: true, loadingMore: !reset })
    try {
      const cursor = reset ? "" : this.data.nextCursor || ""
      const params = []
      params.push("pageSize=50")
      if (this.data.activeEmailId) {
        params.push(`emailId=${encodeURIComponent(this.data.activeEmailId)}`)
      }
      if (this.data.unreadOnly) {
        params.push("unread=1")
      }
      if (cursor) {
        params.push(`cursor=${encodeURIComponent(cursor)}`)
      }
      const query = params.length ? `?${params.join("&")}` : ""
      const res = await request({ url: `/api/messages${query}` })
      const mapped = (res.messages || []).map((item) => ({
        id: item.id,
        emailId: item.email_id,
        emailAddress: item.email_address,
        from: item.from_address || "",
        subject: item.subject || "（无主题）",
        time: formatTime(item.received_at),
        isRead: Boolean(item.is_read)
      }))
      this.setData({
        messages: reset ? mapped : this.data.messages.concat(mapped),
        nextCursor: res.nextCursor || null,
        total: res.total || mapped.length,
        loading: false,
        loadingMore: false
      })
    } catch (error) {
      this.setData({ loading: false, loadingMore: false })
      if (reset) {
        wx.showToast({ title: error.message, icon: "none" })
      }
    }
  },

  openMessage(event) {
    const { id, emailid } = event.currentTarget.dataset
    this.setData({
      messages: this.data.messages.map((item) =>
        item.id === id ? { ...item, isRead: true } : item
      )
    })
    wx.navigateTo({
      url: `/pages/message/message?id=${id}&emailId=${emailid}`
    })
  },

  goCompose() {
    const fallback = this.data.emailFilters[1]
    const emailId =
      this.data.activeEmailId || (fallback ? fallback.id : "")
    wx.navigateTo({
      url: `/pages/compose/compose${emailId ? `?emailId=${emailId}` : ""}`
    })
  }
})
