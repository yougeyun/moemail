const previewMessages = [
  {
    id: "gh",
    initials: "GH",
    from: "GitHub",
    subject: "您的验证码是 482913",
    time: "09:41",
    tone: "from-rose-500 to-amber-500",
  },
  {
    id: "md",
    initials: "MD",
    from: "MoeDaily",
    subject: "欢迎加入萌系星球",
    time: "08:22",
    tone: "from-emerald-500 to-teal-500",
  },
  {
    id: "nl",
    initials: "云笺",
    from: "云笺周刊",
    subject: "今晚的精选内容已上线",
    time: "昨天",
    tone: "from-amber-500 to-rose-500",
  },
] as const

export function LiveInboxPreview() {
  return (
    <div className="relative mx-auto max-w-md">
      <div className="absolute -inset-3 -z-10 rounded-2xl bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 blur-2xl" />
      <div className="panel relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/80 bg-card/70 px-4 py-2.5 sm:px-5 sm:py-3">
          <div className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-secondary shadow-[0_0_8px_hsl(var(--secondary)/0.55)]" />
            <span className="text-xs font-semibold tracking-normal text-foreground">
              实时收件箱
            </span>
          </div>
          <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
            3 封新邮件
          </span>
        </div>

        <div className="divide-y divide-border/70">
          {previewMessages.map((message) => (
            <div
              key={message.id}
              className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-accent/50 sm:px-5 sm:py-3"
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${message.tone} text-xs font-bold text-white shadow-sm sm:h-9 sm:w-9`}
              >
                {message.initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-foreground">{message.from}</div>
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

        <div className="border-t border-border/80 bg-card/60 px-4 py-2.5 sm:px-5 sm:py-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">实时监听中 · 到期自动失效</span>
            <span className="flex items-center gap-1.5 text-xs font-medium text-secondary">
              <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
              在线
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
