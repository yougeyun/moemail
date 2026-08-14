const { request } = require("../../utils/request")

Page({
  data: {
    emailId: "",
    to: "",
    subject: "",
    content: "",
    sending: false,
    canSend: true,
    remainingEmails: null,
    error: ""
  },

  onLoad(options) {
    this.setData({
      emailId: options.emailId || "",
      to: options.to ? decodeURIComponent(options.to) : ""
    })
    this.loadPermission()
  },

  async loadPermission() {
    try {
      const res = await request({ url: "/api/emails/send-permission" })
      this.setData({
        canSend: res.canSend,
        remainingEmails: res.remainingEmails,
        error: res.error || ""
      })
    } catch (error) {
      this.setData({ error: error.message })
    }
  },

  onToInput(event) {
    this.setData({ to: event.detail.value })
  },

  onSubjectInput(event) {
    this.setData({ subject: event.detail.value })
  },

  onContentInput(event) {
    this.setData({ content: event.detail.value })
  },

  async send() {
    if (!this.data.to || !this.data.subject || !this.data.content) {
      wx.showToast({ title: "请完整填写收件人、主题和内容", icon: "none" })
      return
    }
    if (this.data.sending) return
    this.setData({ sending: true })
    try {
      const res = await request({
        url: `/api/emails/${this.data.emailId}/send`,
        method: "POST",
        data: {
          to: this.data.to,
          subject: this.data.subject,
          content: this.data.content
        }
      })
      this.setData({ sending: false })
      wx.showToast({ title: "发送成功", icon: "success" })
      if (typeof res.remainingEmails === "number") {
        this.setData({ remainingEmails: res.remainingEmails })
      }
      setTimeout(() => wx.navigateBack(), 800)
    } catch (error) {
      this.setData({ sending: false })
      wx.showToast({ title: error.message, icon: "none" })
    }
  }
})
