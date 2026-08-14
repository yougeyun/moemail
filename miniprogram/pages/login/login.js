const { request } = require("../../utils/request")

Page({
  data: {
    step: "login",
    needsBinding: false,
    email: "",
    password: "",
    code: "",
    sendingCode: false,
    submitting: false,
    notice: "",
    avatarDataUrl: "",
    nickname: "",
    savingProfile: false
  },

  onLoad() {
    this.checkSession()
  },

  async checkSession() {
    const token = wx.getStorageSync("miniToken")
    if (!token) return
    try {
      const res = await request({ url: "/api/auth/wechat/me" })
      if (res.bound) {
        getApp().setSession(token, res.user)
        wx.switchTab({ url: "/pages/index/index" })
      }
    } catch (error) {
      // Token is invalid; stay on login page.
    }
  },

  async handleWechatLogin() {
    if (this.data.submitting) return
    this.setData({ submitting: true, notice: "" })
    try {
      const loginCode = await new Promise((resolve, reject) => {
        wx.login({
          success: resolve,
          fail: reject
        })
      })
      const res = await request({
        url: "/api/auth/wechat/login",
        method: "POST",
        data: { code: loginCode.code }
      })
      getApp().setSession(res.token, res.user || null)
      if (res.bound) {
        await this.saveProfile()
        wx.switchTab({ url: "/pages/index/index" })
        return
      }
      if (!this.data.nickname.trim() && !this.data.avatarDataUrl) {
        this.setData({
          needsBinding: true,
          step: "profile",
          submitting: false
        })
        return
      }
      this.setData({
        needsBinding: true,
        step: "choice",
        submitting: false
      })
    } catch (error) {
      wx.showToast({ title: error.message, icon: "none" })
      this.setData({ submitting: false })
    }
  },

  chooseStep(event) {
    this.setData({
      step: event.currentTarget.dataset.step,
      notice: ""
    })
  },

  goProfile() {
    if (this.data.nickname.trim() || this.data.avatarDataUrl) {
      wx.setStorageSync("pendingProfile", {
        nickname: this.data.nickname.trim(),
        avatarDataUrl: this.data.avatarDataUrl
      })
    }
    wx.switchTab({ url: "/pages/profile/profile" })
  },

  onChooseAvatar(event) {
    const filePath = event.detail.avatarUrl
    if (!filePath) return
    const fs = wx.getFileSystemManager()
    fs.readFile({
      filePath,
      encoding: "base64",
      success: (res) => {
        this.setData({
          avatarDataUrl: `data:image/jpeg;base64,${res.data}`
        })
      },
      fail: () => {
        wx.showToast({ title: "头像读取失败", icon: "none" })
      }
    })
  },

  onNicknameInput(event) {
    this.setData({ nickname: event.detail.value })
  },

  goChoice() {
    if (!this.data.nickname.trim()) {
      wx.showToast({ title: "请填写昵称", icon: "none" })
      return
    }
    this.setData({ step: "choice" })
  },

  async saveProfile() {
    const nickname = this.data.nickname.trim()
    const avatarDataUrl = this.data.avatarDataUrl
    if (!nickname && !avatarDataUrl) return
    try {
      await request({
        url: "/api/user/profile",
        method: "PATCH",
        data: {
          name: nickname || undefined,
          image: avatarDataUrl || undefined
        }
      })
      wx.removeStorageSync("pendingProfile")
    } catch (error) {
      console.warn("保存微信资料失败", error)
    }
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
          purpose: this.data.step === "bind" ? "bind" : "register"
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
    const isBind = this.data.step === "bind"
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
      await this.saveProfile()
      wx.switchTab({ url: "/pages/index/index" })
    } catch (error) {
      wx.showToast({ title: error.message, icon: "none" })
      this.setData({ submitting: false })
    }
  }
})
