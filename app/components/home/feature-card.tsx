interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-primary/20 bg-card/70 p-4 backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-[0_0_22px_hsl(var(--primary)/0.14)]">
      <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-primary/10 blur-2xl transition-opacity opacity-0 group-hover:opacity-100" />
      <div className="relative flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary shadow-[0_0_14px_hsl(var(--primary)/0.18)]">
          {icon}
        </div>
        <div className="min-w-0 text-left">
          <h3 className="truncate text-sm font-bold tracking-wide">{title}</h3>
          <p className="truncate text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  )
}
