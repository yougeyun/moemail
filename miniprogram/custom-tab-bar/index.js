const { request } = require("../utils/request")

const DEFAULT_TABS = [
  { key: "mailbox", label: "邮箱", enabled: true },
  { key: "inbox", label: "收件箱", enabled: true },
  { key: "send", label: "发件", enabled: true },
  { key: "profile", label: "我的", enabled: true }
]

const PAGE_MAP = {
  mailbox: "pages/index/index",
  inbox: "pages/inbox/inbox",
  send: "pages/send/send",
  profile: "pages/profile/profile"
}

Component({
  data: {
    tabs: []
  },

  lifetimes: {
    attached() {
      this.refresh()
    }
  },

  pageLifetimes: {
    show() {
      this.refresh()
    }
  },

  methods: {
    refresh() {
      this.applyGlobal()
      const now = Date.now()
      if (this.lastFetchedAt && now - this.lastFetchedAt < 10000) return
      this.lastFetchedAt = now
      this.fetchConfig()
    },

    applyGlobal() {
      const app = getApp()
      const configured =
        (app.globalData && app.globalData.tabConfig) || []
      if (configured.length) {
        this.applyTabs(configured)
      } else {
        this.applyTabs(DEFAULT_TABS)
      }
    },

    applyTabs(source) {
      const tabs = (source || []).filter((item) => item.enabled)
      const pages = getCurrentPages()
      const current = pages[pages.length - 1]
      const route = current ? current.route : ""
      this.setData({
        tabs: tabs.map((item) => ({
          key: item.key,
          label: item.label,
          active: PAGE_MAP[item.key] === route
        }))
      })
    },

    async fetchConfig() {
      try {
        const res = await request({ url: "/api/config/tabs" })
        const tabs = (res && res.tabs) || []
        if (!tabs.length) return
        const app = getApp()
        if (app && app.globalData) {
          app.globalData.tabConfig = tabs
        }
        this.applyTabs(tabs)
      } catch (error) {
        // Keep the current/default tab configuration.
      }
    },

    switchTab(event) {
      const key = event.currentTarget.dataset.key
      const page = PAGE_MAP[key]
      if (page) {
        wx.switchTab({ url: `/${page}` })
      }
    }
  }
})
