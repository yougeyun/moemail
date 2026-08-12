interface LogoMarkProps {
  size?: number
  className?: string
}

export function LogoMark({ size = 38, className }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect
        x="4"
        y="4"
        width="56"
        height="56"
        rx="16"
        fill="hsl(var(--primary))"
      />
      <rect
        x="7"
        y="7"
        width="50"
        height="50"
        rx="13"
        stroke="hsl(var(--primary-foreground) / 0.2)"
        strokeWidth="1.5"
        fill="none"
      />
      <circle cx="49" cy="15" r="3.2" fill="var(--brand-gold)" />

      <rect
        x="16"
        y="21"
        width="32"
        height="26"
        rx="6"
        fill="hsl(var(--primary-foreground))"
      />
      <path
        d="M16 25.5 32 36 48 25.5"
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <g fill="hsl(var(--secondary))">
        <rect x="25" y="30" width="4" height="10" rx="1" />
        <rect x="29" y="30" width="4" height="4" rx="1" />
        <rect x="29" y="35" width="4" height="5" rx="1" />
        <rect x="33" y="30" width="4" height="4" rx="1" />
        <rect x="33" y="35" width="4" height="5" rx="1" />
        <rect x="37" y="30" width="4" height="10" rx="1" />
      </g>
    </svg>
  )
}
