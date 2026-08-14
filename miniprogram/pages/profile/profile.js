const { request } = require("../../utils/request")

Page({
  data: {
    user: null,
    code: "",
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
        wx.redirectTo({ url: "/pages/login/login" })
        return
      }
      getApp().setSession(wx.getStorageSync("miniToken"), res.user)
      this.setData({ user: res.user })
    } catch (error) {
      wx.showToast({ title: error.message, icon: "none" })
    }
  },

  onCodeInput(event) {
    this.setData({ code: event.detail.value })
  },

  async redeem() {
    if (!this.data.code.trim()) {
      wx.showToast({ title: "请输入激活码", icon: "none" })
      return
    }
    if (this.data.redeeming) return
    this.setData({ redeeming: true })
    try {
      const res = await request({
        url: "/api/activation-codes/redeem",
        method: "POST",
        data: { code: this.data.code }
      })
      this.setData({ code: "", redeeming: false })
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
