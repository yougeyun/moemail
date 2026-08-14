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

  onShareAppMessage() {
    return {
      title: this.data.message
        ? this.data.message.subject
        : "临时邮箱邮件",
      path: `/pages/message/message?id=${this.data.id}&emailId=${this.data.emailId}`
    }
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
  },

  forward() {
    if (!this.data.message) return
    const subject = this.data.message.subject.startsWith("Fwd:")
      ? this.data.message.subject
      : `Fwd: ${this.data.message.subject}`
    const content =
      `\n\n---------- 原始邮件 ----------\n` +
      `发件人：${this.data.message.from || "未知"}\n` +
      `时间：${this.data.message.time}\n\n` +
      (this.data.message.content || "")
    wx.setStorageSync("forwardDraft", { subject, content })
    wx.navigateTo({
      url: `/pages/compose/compose?emailId=${this.data.emailId}`
    })
  }
})
