"use client"

import Link from "next/link"

export function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 group hover:opacity-85 transition-opacity"
      aria-label="MoeMail"
    >
      <svg
        width="34"
        height="34"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-[0_0_10px_hsl(var(--primary)/0.35)] group-hover:drop-shadow-[0_0_16px_hsl(var(--primary)/0.55)] transition-all duration-300"
      >
        <rect
          x="8"
          y="16"
          width="48"
          height="36"
          rx="6"
          fill="hsl(var(--card))"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
        />
        <path
          d="M8 16l24 16 24-16"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
        />
        <path
          d="M24 27h4v12h-4zM30 27h4v12h-4zM36 27h4v12h-4z"
          fill="hsl(var(--primary))"
        />
        <path
          d="M27 33h4v4h-4zM33 33h4v4h-4zM39 33h4v4h-4z"
          fill="hsl(var(--secondary))"
        />
      </svg>
      <span className="text-lg font-bold tracking-wider text-gradient-brand">
        MoeMail
      </span>
    </Link>
  )
}
