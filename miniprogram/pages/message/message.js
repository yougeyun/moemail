const { request } = require("../../utils/request")
const { formatTime } = require("../../utils/format")

Page({
  data: {
    id: "",
    emailId: "",
    message: null,
    loading: true
  },

  onLoad(options) {
    this.setData({
      id: options.id,
      emailId: options.emailId
    })
    this.loadMessage()
  },

  async loadMessage() {
    try {
      const res = await request({
        url: `/api/emails/${this.data.emailId}/${this.data.id}`
      })
      this.setData({
        message: {
          subject: res.message.subject || "（无主题）",
          from: res.message.from_address || "",
          to: res.message.to_address || "",
          time: formatTime(res.message.received_at),
          html: res.message.html || "",
          content: res.message.content || "",
          displayContent: res.message.html || res.message.content || ""
        },
        loading: false
      })
    } catch (error) {
      this.setData({ loading: false })
      wx.showToast({ title: error.message, icon: "none" })
    }
  },

  copyText(event) {
    wx.setClipboardData({
      data: event.currentTarget.dataset.text
    })
  },

  reply() {
    if (!this.data.message) return
    wx.navigateTo({
      url: `/pages/compose/compose?emailId=${this.data.emailId}&to=${encodeURIComponent(this.data.message.from)}`
    })
  }
})
