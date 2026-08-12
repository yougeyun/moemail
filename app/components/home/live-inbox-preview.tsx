const previewMessages = [
  {
    id: "gh",
    initials: "GH",
    from: "GitHub",
    subject: "Your verification code is 482913",
    time: "09:41",
    tone: "from-cyan-400 to-fuchsia-400",
  },
  {
    id: "md",
    initials: "MD",
    from: "MoeDaily",
    subject: "欢迎加入萌系星球",
    time: "08:22",
    tone: "from-fuchsia-400 to-cyan-400",
  },
  {
    id: "nl",
    initials: "NL",
    from: "NeonList",
    subject: "今晚的霓虹电波已上线",
    time: "昨天",
    tone: "from-lime-400 to-cyan-400",
  },
] as const

export function LiveInboxPreview() {
  return (
    <div className="relative">
      <div className="absolute -inset-3 rounded-[28px] bg-gradient-to-br from-primary/25 via-secondary/20 to-lime-400/15 blur-2xl" />
      <div className="relative overflow-hidden rounded-3xl border border-primary/25 bg-background/85 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-primary/15 px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-lime-400 shadow-[0_0_10px_rgba(163,230,53,0.8)]" />
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Live Inbox
            </span>
          </div>
          <span className="rounded-full border border-secondary/35 bg-secondary/10 px-3 py-1 text-[11px] font-semibold text-secondary">
            3 New
          </span>
        </div>

        <div className="divide-y divide-primary/10">
          {previewMessages.map((message) => (
            <div
              key={message.id}
              className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-primary/5"
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${message.tone} text-xs font-extrabold text-background shadow-lg`}
              >
                {message.initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{message.from}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {message.subject}
                </div>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {message.time}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-primary/15 px-5 py-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">实时收信 · 隐私保护</span>
            <span className="font-mono text-xs text-primary">● ONLINE</span>
          </div>
        </div>
      </div>
    </div>
  )
}
