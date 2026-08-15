const { request } = require("../../utils/request")
const { getAdsConfig, showRewardedVideo } = require("../../utils/ads")
const { formatTime } = require("../../utils/format")

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
    redeeming: false,
    rewardedAdUnitId: "",
    rewardEmailQuota: 1,
    rewardRemaining: 0,
    showRewardButton: false,
    rewarding: false,
    roleName: "",
    memberExpiresAt: "",
    emailCount: 0,
    sendRemaining: null,
    subscribeEnabled: false,
    subscribeTemplateId: "",
    showSubscribeSwitch: false,
    subscribeLoading: false
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
        user: res.user,
        roleName: res.role
          ? res.role.displayName || res.role.name
          : "",
        memberExpiresAt: res.role && res.role.expiresAt
          ? formatTime(res.role.expiresAt)
          : ""
      })
      this.loadAdsStatus()
      this.loadSubscribeStatus()
      this.loadStats()
      this.savePendingProfile()
    } catch (error) {
      if (error.message.includes("登录状态已失效") || error.message.includes("未登录")) {
        getApp().clearSession()
        wx.redirectTo({ url: "/pages/login/login" })
        return
      }
      wx.showToast({ title: error.message, icon: "none" })
    }
  },

  async loadAdsStatus() {
    const config = await getAdsConfig()
    if (
      !config ||
      !config.enabled ||
      !config.rewardedEnabled ||
      !config.rewardedAdUnitId
    ) {
      this.setData({ showRewardButton: false })
      return
    }
    const status = await request({ url: "/api/ads/status" }).catch(() => null)
    const remaining = status ? status.remaining || 0 : 0
    this.setData({
      rewardedAdUnitId: config.rewardedAdUnitId,
      rewardEmailQuota: config.rewardEmailQuota || 1,
      rewardRemaining: remaining,
      showRewardButton: remaining > 0
    })
  },

  async watchRewardedVideo() {
    if (this.data.rewarding) return
    this.setData({ rewarding: true })
    try {
      const ended = await showRewardedVideo(this.data.rewardedAdUnitId)
      if (!ended) {
        wx.showToast({ title: "完整观看视频后才能领取奖励", icon: "none" })
        return
      }
      await request({ url: "/api/ads/reward", method: "POST" })
      wx.showToast({ title: "奖励已到账", icon: "success" })
      this.loadAdsStatus()
    } catch (error) {
      wx.showToast({ title: error.message, icon: "none" })
    } finally {
      this.setData({ rewarding: false })
    }
  },

  async loadSubscribeStatus() {
    const res = await request({ url: "/api/wechat/subscribe" }).catch(() => null)
    if (res) {
      this.setData({
        subscribeEnabled: Boolean(res.enabled),
        subscribeTemplateId: res.templateId || "",
        showSubscribeSwitch: Boolean(res.templateId)
      })
    }
  },

  async loadStats() {
    const [emailsRes, sendRes] = await Promise.all([
      request({ url: "/api/emails" }).catch(() => null),
      request({ url: "/api/emails/send-permission" }).catch(() => null)
    ])
    this.setData({
      emailCount: emailsRes
        ? emailsRes.total || (emailsRes.emails ? emailsRes.emails.length : 0)
        : 0,
      sendRemaining:
        sendRes && typeof sendRes.remainingEmails === "number"
          ? sendRes.remainingEmails
          : null
    })
  },

  async savePendingProfile() {
    const pending = wx.getStorageSync("pendingProfile") || null
    if (!pending) return
    try {
      await request({
        url: "/api/user/profile",
        method: "PATCH",
        data: {
          name: pending.nickname || undefined,
          image: pending.avatarDataUrl || undefined
        }
      })
      wx.removeStorageSync("pendingProfile")
      this.loadUser()
    } catch (error) {
      console.warn("保存微信资料失败", error)
    }
  },

  async onSubscribeChange(event) {
    const enabled = Boolean(event.detail.value)
    if (enabled && !this.data.subscribeTemplateId) {
      wx.showToast({ title: "新邮件提醒尚未配置", icon: "none" })
      this.setData({ subscribeEnabled: false })
      return
    }

    this.setData({ subscribeLoading: true })
    try {
      if (enabled) {
        const result = await new Promise((resolve) => {
          wx.requestSubscribeMessage({
            tmplIds: [this.data.subscribeTemplateId],
            success: resolve,
            fail: () => resolve(null)
          })
        })
        if (!result || result[this.data.subscribeTemplateId] !== "accept") {
          this.setData({ subscribeEnabled: false, subscribeLoading: false })
          wx.showToast({ title: "未授权消息订阅", icon: "none" })
          return
        }
      }

      await request({
        url: "/api/wechat/subscribe",
        method: "POST",
        data: { enabled }
      })
      this.setData({ subscribeEnabled: enabled, subscribeLoading: false })
      wx.showToast({
        title: enabled ? "新邮件提醒已开启" : "新邮件提醒已关闭",
        icon: "success"
      })
    } catch (error) {
      this.setData({ subscribeEnabled: false, subscribeLoading: false })
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
      const res = await request({
        url: "/api/activation-codes/redeem",
        method: "POST",
        data: { code: this.data.codeText }
      })
      this.setData({ codeText: "", redeeming: false })
      if (res.redeemedRoleName) {
        wx.showModal({
          title: "兑换成功",
          content: `会员等级：${res.redeemedRoleName}${
            res.redeemedRoleDurationDays > 0
              ? `（${res.redeemedRoleDurationDays} 天）`
              : "（永久）"
          }`,
          showCancel: false
        })
      } else {
        wx.showToast({ title: "兑换成功", icon: "success" })
      }
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
