const { request } = require("../../utils/request")
const { formatTime } = require("../../utils/format")

Page({
  data: {
    messages: [],
    loading: false,
    loadingMore: false,
    nextCursor: null,
    total: 0
  },

  onShow() {
    this.checkSession()
    this.startPolling()
  },

  onHide() {
    this.stopPolling()
  },

  onUnload() {
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
      this.loadMessages(true)
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

  onPullDownRefresh() {
    this.loadMessages(true).finally(() => wx.stopPullDownRefresh())
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
      const url = `/api/messages?type=sent&cursor=${cursor}`
      const res = await request({ url })
      const mapped = (res.messages || []).map((item) => ({
        id: item.id,
        emailId: item.email_id,
        emailAddress: item.email_address,
        to: item.to_address || "",
        subject: item.subject || "（无主题）",
        time: formatTime(item.sent_at || item.received_at)
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
    wx.navigateTo({
      url: `/pages/message/message?id=${id}&emailId=${emailid}`
    })
  },

  goCompose() {
    wx.navigateTo({ url: "/pages/compose/compose" })
  }
})
