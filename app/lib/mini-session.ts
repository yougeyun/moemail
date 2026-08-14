import { and, eq, gt } from "drizzle-orm"
import { nanoid } from "nanoid"
import { createDb, Db } from "@/lib/db"
import { accounts, miniSessions, users } from "@/lib/schema"

const SESSION_TTL = 30 * 24 * 60 * 60 * 1000
const ANONYMOUS_TTL = 7 * 24 * 60 * 60 * 1000

async function hashToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token)
  const digest = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("")
}

export async function createMiniSession(input: {
  openid: string
  userId?: string
  ttl?: number
}): Promise<string> {
  const db = createDb()
  const token = nanoid(48)
  const now = new Date()
  const expiresAt = new Date(
    now.getTime() + (input.ttl || (input.userId ? SESSION_TTL : ANONYMOUS_TTL))
  )

  await db.insert(miniSessions).values({
    tokenHash: await hashToken(token),
    userId: input.userId || null,
    openid: input.openid,
    expiresAt,
    lastUsedAt: now,
    createdAt: now,
  })

  return token
}

export async function getMiniSession(token: string) {
  const db = createDb()
  const tokenHash = await hashToken(token)
  const session = await db.query.miniSessions.findFirst({
    where: and(
      eq(miniSessions.tokenHash, tokenHash),
      gt(miniSessions.expiresAt, new Date())
    ),
  })

  if (!session) return null

  return {
    id: session.id,
    userId: session.userId,
    openid: session.openid,
  }
}

export async function resolveMiniSessionUser(token: string): Promise<string | null> {
  const session = await getMiniSession(token)
  return session?.userId || null
}

export async function findUserByOpenid(openid: string) {
  const db = createDb()
  const account = await db.query.accounts.findFirst({
    where: and(
      eq(accounts.provider, "wechat"),
      eq(accounts.providerAccountId, openid)
    ),
    with: {
      user: true,
    },
  })

  return account?.user || null
}

export async function bindWechatOpenid(input: {
  db: Db
  userId: string
  openid: string
}) {
  const existing = await input.db.query.accounts.findFirst({
    where: and(
      eq(accounts.provider, "wechat"),
      eq(accounts.providerAccountId, input.openid)
    ),
  })

  if (existing) {
    if (existing.userId !== input.userId) {
      throw new Error("该微信已绑定其他账号")
    }
    return
  }

  await input.db.insert(accounts).values({
    userId: input.userId,
    type: "oauth",
    provider: "wechat",
    providerAccountId: input.openid,
  })
}

export async function getUserById(db: Db, userId: string) {
  return db.query.users.findFirst({
    where: eq(users.id, userId),
  })
}

export async function attachMiniSessionUser(token: string, userId: string) {
  const db = createDb()
  const tokenHash = await hashToken(token)
  const now = new Date()

  const result = await db
    .update(miniSessions)
    .set({
      userId,
      expiresAt: new Date(now.getTime() + SESSION_TTL),
      lastUsedAt: now,
    })
    .where(
      and(
        eq(miniSessions.tokenHash, tokenHash),
        gt(miniSessions.expiresAt, now)
      )
    )

  return result.meta.changes > 0
}

export function toPublicUser(user: {
  id: string
  name: string | null
  username: string | null
  email: string | null
  emailVerified: Date | null
  image: string | null
}) {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    emailVerified: user.emailVerified,
    image: user.image,
  }
}
