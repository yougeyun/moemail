interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-lg border border-border/80 bg-card/85 p-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-md sm:rounded-xl sm:p-4">
      <div className="absolute -right-10 -top-10 hidden h-24 w-24 rounded-full bg-primary/10 blur-2xl transition-opacity opacity-0 group-hover:opacity-100 sm:block" />
      <div className="relative">
        <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary transition-colors group-hover:bg-primary/15 sm:mb-3 sm:h-9 sm:w-9">
          {icon}
        </div>
        <h3 className="text-[13px] font-semibold leading-snug text-foreground sm:text-sm">
          {title}
        </h3>
        <p className="mt-1 text-[13px] leading-snug text-muted-foreground sm:text-sm">
          {description}
        </p>
      </div>
    </div>
  )
}
