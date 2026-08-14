const { API_BASE_URL } = require("./config")

function request(options) {
  const token = wx.getStorageSync("miniToken") || ""
  const header = Object.assign(
    {
      "Content-Type": "application/json"
    },
    options.header || {}
  )
  if (token) {
    header["X-Session-Token"] = token
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: API_BASE_URL + options.url,
      method: options.method || "GET",
      data: options.data || {},
      header,
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
          return
        }
        const message =
          (res.data && res.data.error) || "请求失败，请稍后重试"
        if (res.statusCode === 401) {
          if (
            message.includes("登录状态已失效") ||
            message.includes("未登录")
          ) {
            getApp().clearSession()
          }
        }
        reject(new Error(message))
      },
      fail() {
        reject(new Error("网络连接失败，请检查网络"))
      }
    })
  })
}

module.exports = {
  request,
  API_BASE_URL
}
