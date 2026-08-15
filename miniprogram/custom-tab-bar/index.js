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
      const app = getApp()
      const configured =
        (app.globalData && app.globalData.tabConfig) || []
      const source = configured.length ? configured : DEFAULT_TABS
      const tabs = source.filter((item) => item.enabled)
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

    switchTab(event) {
      const key = event.currentTarget.dataset.key
      const page = PAGE_MAP[key]
      if (page) {
        wx.switchTab({ url: `/${page}` })
      }
    }
  }
})
