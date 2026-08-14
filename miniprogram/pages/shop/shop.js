const { request } = require("../../utils/request")

function formatPrice(price) {
  return Number(price || 0).toFixed(2)
}

Page({
  data: {
    loading: true,
    roles: [],
    currentRoleName: "",
    currentExpiresAt: "",
    selectedIndex: 0,
    selectedRole: null,
    durationIndex: 0,
    selectedDurationLabel: "",
    paymentMethod: "wechat",
    paying: false,
    error: ""
  },

  onShow() {
    this.load()
  },

  async load() {
    this.setData({ loading: true, error: "" })
    try {
      const res = await request({ url: "/api/member-shop" })
      const roles = (res.roles || []).map((role) => {
        const rawDurations =
          role.durationOptions && role.durationOptions.length
            ? role.durationOptions
            : [{ days: 0, price: role.price }]
        const durations = rawDurations.map((item) => ({
          days: item.days,
          price: item.price,
          label:
            item.days === 0
              ? `永久 ¥${formatPrice(item.price)}`
              : `${item.days} 天 ¥${formatPrice(item.price)}`
        }))
        return {
          ...role,
          durations
        }
      })
      const currentRole = roles.find((role) => role.id === res.currentRoleId)
      this.setData({
        roles,
        currentRoleName: currentRole
          ? currentRole.displayName || currentRole.name
          : "",
        currentExpiresAt: res.currentExpiresAt || "",
        loading: false
      })
      if (roles.length > 0) {
        this.setData({
          selectedIndex: 0,
          selectedRole: roles[0],
          durationIndex: 0,
          selectedDurationLabel: roles[0].durations[0].label
        })
      }
    } catch (error) {
      this.setData({ loading: false, error: error.message })
    }
  },

  selectRole(event) {
    const index = Number(event.currentTarget.dataset.index)
    this.setData({
      selectedIndex: index,
      selectedRole: this.data.roles[index],
      durationIndex: 0,
      selectedDurationLabel: this.data.roles[index].durations[0].label
    })
  },

  selectDuration(event) {
    const durationIndex = Number(event.detail.value)
    this.setData({
      durationIndex,
      selectedDurationLabel: this.data.selectedRole.durations[durationIndex].label
    })
  },

  selectMethod(event) {
    this.setData({
      paymentMethod: event.currentTarget.dataset.method
    })
  },

  async buy() {
    if (this.data.paying) return
    const role = this.data.selectedRole
    if (!role) return
    const duration = role.durations[this.data.durationIndex]

    if (this.data.paymentMethod === "alipay") {
      wx.showModal({
        title: "支付宝支付",
        content: "支付宝请在电脑端完成支付",
        showCancel: false
      })
      return
    }

    this.setData({ paying: true })
    try {
      const res = await request({
        url: "/api/member-shop",
        method: "POST",
        data: {
          roleId: role.id,
          durationDays: duration.days,
          paymentMethod: this.data.paymentMethod,
          source: "miniprogram"
        }
      })

      if (this.data.paymentMethod === "wechat") {
        await new Promise((resolve, reject) => {
          wx.requestPayment({
            timeStamp: res.paymentParams.timeStamp,
            nonceStr: res.paymentParams.nonceStr,
            package: res.paymentParams.package,
            signType: res.paymentParams.signType,
            paySign: res.paymentParams.paySign,
            success: resolve,
            fail: reject
          })
        })
        wx.showToast({ title: "支付成功，正在确认订单", icon: "none" })
        await this.waitOrderCompleted(res.orderId)
        wx.showToast({ title: "会员已到账", icon: "success" })
        this.load()
      }
    } catch (error) {
      if (error && error.errMsg && error.errMsg.includes("cancel")) {
        wx.showToast({ title: "已取消支付", icon: "none" })
      } else {
        wx.showToast({ title: error.message || "支付失败", icon: "none" })
      }
    } finally {
      this.setData({ paying: false })
    }
  },

  async waitOrderCompleted(orderId) {
    for (let index = 0; index < 20; index++) {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      const res = await request({
        url: `/api/payment/orders/${orderId}`
      })
      if (res.status === "completed") return
      if (res.status !== "pending") {
        throw new Error("订单状态异常，请联系管理员")
      }
    }
    throw new Error("订单确认超时，请稍后在个人中心查看")
  }
})
