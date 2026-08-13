import {
  BadgeCheck,
  Crown,
  Gem,
  Heart,
  Medal,
  Rocket,
  Shield,
  Sparkles,
  Star,
  Sword,
  User2,
  Zap,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export const ROLE_ICON_MAP: Record<string, LucideIcon> = {
  Crown,
  Gem,
  Sword,
  User2,
  Star,
  Shield,
  Zap,
  Rocket,
  Medal,
  Heart,
  Sparkles,
  BadgeCheck,
}

export const ROLE_ICON_OPTIONS = Object.keys(ROLE_ICON_MAP)
