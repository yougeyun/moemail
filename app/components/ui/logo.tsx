"use client"

import Link from "next/link"
import { useBranding } from "@/components/brand/brand-provider"

export function Logo() {
  const { siteName, logo } = useBranding()

  return (
    <Link
      href="/"
      className="group flex items-center gap-2.5 transition-opacity hover:opacity-85"
      aria-label={siteName}
    >
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo}
          alt=""
          className="h-9 w-9 shrink-0 rounded-lg object-contain shadow-sm"
        />
      ) : null}
      <span className="text-[17px] font-bold tracking-normal text-foreground">
        {siteName}
      </span>
    </Link>
  )
}
