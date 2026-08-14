const { request } = require("../../utils/request")
const { formatTime } = require("../../utils/format")

Page({
  data: {
    selectedEmail: null,
    showEmailChoices: false,
    emailChoices: [],
    messages: [],
    loading: false,
    nextCursor: null,
    total: 0
  },

  onShow() {
    const token = wx.getStorageSync("miniToken")
    if (!token) {
      wx.redirectTo({ url: "/pages/login/login" })
      return
    }
    const selectedEmail = wx.getStorageSync("selectedEmail") || null
    this.setData({ selectedEmail })
    this.loadMessages(true)
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
      const url = `/api/emails/${this.data.selectedEmail.id}?cursor=${this.data.nextCursor || ""}`
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
