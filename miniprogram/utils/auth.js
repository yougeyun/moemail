function hasLogin() {
  return Boolean(wx.getStorageSync("miniToken"))
}

function requireLogin() {
  if (hasLogin()) return true
  wx.showToast({ title: "请先登录后再使用该功能", icon: "none" })
  setTimeout(() => {
    wx.navigateTo({ url: "/pages/login/login" })
  }, 400)
  return false
}

module.exports = {
  hasLogin,
  requireLogin
}
