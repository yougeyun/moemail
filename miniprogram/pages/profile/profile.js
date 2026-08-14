const { request } = require("../../utils/request")

Page({
  data: {
    user: null,
    unbound: false,
    mode: "bind",
    email: "",
    password: "",
    code: "",
    sendingCode: false,
    submitting: false,
    notice: "",
    codeText: "",
    redeeming: false
  },

  onShow() {
    const token = wx.getStorageSync("miniToken")
    if (!token) {
      wx.redirectTo({ url: "/pages/login/login" })
      return
    }
    this.loadUser()
  },

  async loadUser() {
    try {
      const res = await request({ url: "/api/auth/wechat/me" })
      if (res.needsBinding) {
        getApp().setSession(wx.getStorageSync("miniToken"), null)
        this.setData({
          unbound: true,
          user: null
        })
        return
      }
      getApp().setSession(wx.getStorageSync("miniToken"), res.user)
      this.setData({
        unbound: false,
        user: res.user
      })
    } catch (error) {
      if (error.message.includes("登录状态已失效") || error.message.includes("未登录")) {
        getApp().clearSession()
        wx.redirectTo({ url: "/pages/login/login" })
        return
      }
      wx.showToast({ title: error.message, icon: "none" })
    }
  },

  setMode(event) {
    this.setData({
      mode: event.currentTarget.dataset.mode,
      notice: ""
    })
  },

  onEmailInput(event) {
    this.setData({ email: event.detail.value })
  },

  onPasswordInput(event) {
    this.setData({ password: event.detail.value })
  },

  onCodeInput(event) {
    this.setData({ code: event.detail.value })
  },

  async sendCode() {
    if (this.data.sendingCode) return
    if (!this.data.email) {
      wx.showToast({ title: "请先填写邮箱", icon: "none" })
      return
    }
    this.setData({ sendingCode: true, notice: "" })
    try {
      const res = await request({
        url: "/api/auth/verification",
        method: "POST",
        data: {
          email: this.data.email,
          purpose: this.data.mode === "bind" ? "bind" : "register"
        }
      })
      if (res.mode === "link") {
        this.setData({
          notice: "激活邮件已发送，请点击邮件中的链接完成验证",
          sendingCode: false
        })
      } else {
        wx.showToast({ title: "验证码已发送", icon: "success" })
        this.setData({ sendingCode: false })
      }
    } catch (error) {
      wx.showToast({ title: error.message, icon: "none" })
      this.setData({ sendingCode: false })
    }
  },

  async submit() {
    if (this.data.submitting) return
    this.setData({ submitting: true, notice: "" })
    const isBind = this.data.mode === "bind"
    try {
      const res = await request({
        url: isBind ? "/api/auth/wechat/bind" : "/api/auth/wechat/register",
        method: "POST",
        data: {
          token: wx.getStorageSync("miniToken"),
          email: this.data.email,
          password: this.data.password,
          code: this.data.code
        }
      })
      if (res.verificationRequired) {
        this.setData({
          notice: "激活邮件已发送，请点击邮件中的链接完成验证",
          submitting: false
        })
        return
      }
      getApp().setSession(res.token, res.user)
      this.setData({
        unbound: false,
        user: res.user,
        submitting: false,
        email: "",
        password: "",
        code: ""
      })
      wx.showToast({ title: "绑定成功", icon: "success" })
    } catch (error) {
      wx.showToast({ title: error.message, icon: "none" })
      this.setData({ submitting: false })
    }
  },

  onCodeTextInput(event) {
    this.setData({ codeText: event.detail.value })
  },

  async redeem() {
    if (!this.data.codeText.trim()) {
      wx.showToast({ title: "请输入激活码", icon: "none" })
      return
    }
    if (this.data.redeeming) return
    this.setData({ redeeming: true })
    try {
      await request({
        url: "/api/activation-codes/redeem",
        method: "POST",
        data: { code: this.data.codeText }
      })
      this.setData({ codeText: "", redeeming: false })
      wx.showToast({ title: "兑换成功", icon: "success" })
      this.loadUser()
    } catch (error) {
      this.setData({ redeeming: false })
      wx.showToast({ title: error.message, icon: "none" })
    }
  },

  logout() {
    getApp().clearSession()
    wx.redirectTo({ url: "/pages/login/login" })
  }
})
