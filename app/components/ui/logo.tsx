"use client"

import Link from "next/link"
import { LogoMark } from "@/components/ui/logo-mark"

export function Logo() {
  return (
    <Link
      href="/"
      className="group flex items-center gap-2.5 transition-opacity hover:opacity-85"
      aria-label="MoeMail"
    >
      <LogoMark
        className="animate-stamp shrink-0 drop-shadow-[0_4px_10px_hsl(var(--primary)/0.3)] transition-transform duration-300 group-hover:-translate-y-0.5"
      />
      <span className="text-[17px] font-bold tracking-normal text-foreground">
        MoeMail
      </span>
    </Link>
  )
}
