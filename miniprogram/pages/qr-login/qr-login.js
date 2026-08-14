const { request } = require("../../utils/request")

Page({
  data: {
    token: "",
    status: "loading",
    message: "正在确认登录..."
  },

  onLoad(options) {
    const scene = decodeURIComponent(options.scene || options.token || "")
    this.setData({ token: scene })
    this.confirmLogin(scene)
  },

  onShow() {
    if (this.data.token && this.data.status === "login") {
      this.confirmLogin(this.data.token)
    }
  },

  async confirmLogin(token) {
    if (!token) {
      this.setData({
        status: "error",
        message: "登录二维码参数无效"
      })
      return
    }

    const miniToken = wx.getStorageSync("miniToken")
    if (!miniToken) {
      this.setData({
        status: "login",
        message: "请先登录小程序并绑定邮箱"
      })
      return
    }

    this.setData({
      status: "loading",
      message: "正在确认登录..."
    })

    try {
      await request({
        url: "/api/auth/qrcode/confirm",
        method: "POST",
        data: { token }
      })
      this.setData({
        status: "success",
        message: "已确认，请回到电脑端继续操作"
      })
      setTimeout(() => {
        if (wx.exitMiniProgram) {
          wx.exitMiniProgram()
        }
      }, 1500)
    } catch (error) {
      this.setData({
        status: "error",
        message: error.message
      })
    }
  },

  goLogin() {
    wx.navigateTo({ url: "/pages/login/login" })
  },

  backHome() {
    wx.switchTab({ url: "/pages/index/index" })
  }
})
