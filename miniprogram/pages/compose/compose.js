const { request } = require("../../utils/request")
const { requireLogin } = require("../../utils/auth")

Page({
  data: {
    emailId: "",
    to: "",
    subject: "",
    content: "",
    sending: false,
    canSend: true,
    remainingEmails: null,
    error: "",
    emailChoices: [],
    emailIndex: 0,
    selectedSender: ""
  },

  onLoad(options) {
    if (!requireLogin()) return
    const forwardDraft = wx.getStorageSync("forwardDraft") || null
    if (forwardDraft) {
      wx.removeStorageSync("forwardDraft")
    }
    this.setData({
      emailId: options.emailId || "",
      to: options.to ? decodeURIComponent(options.to) : "",
      subject: forwardDraft ? forwardDraft.subject : "",
      content: forwardDraft ? forwardDraft.content : ""
    })
    this.loadPermission()
    this.loadEmails()
  },

  async loadEmails() {
    const res = await request({ url: "/api/emails" }).catch(() => ({
      emails: []
    }))
    const emails = res.emails || []
    let emailIndex = emails.findIndex((item) => item.id === this.data.emailId)
    if (emailIndex === -1) {
      emailIndex = 0
    }
    this.setData({
      emailChoices: emails,
      emailIndex,
      emailId: emails[emailIndex] ? emails[emailIndex].id : "",
      selectedSender: emails[emailIndex] ? emails[emailIndex].address : ""
    })
  },

  onEmailChange(event) {
    const index = Number(event.detail.value)
    const email = this.data.emailChoices[index]
    this.setData({
      emailIndex: index,
      emailId: email ? email.id : "",
      selectedSender: email ? email.address : ""
    })
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
