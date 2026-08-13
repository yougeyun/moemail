import { and, eq, gt, isNull } from "drizzle-orm"
import { nanoid } from "nanoid"
import { createDb } from "@/lib/db"
import { emailVerifications } from "@/lib/schema"
import { getSystemMailConfig, sendSystemMail } from "@/lib/system-mail"

export type VerificationPurpose = "register" | "bind"

function randomCode() {
  const buffer = new Uint32Array(1)
  crypto.getRandomValues(buffer)
  return String(100000 + (buffer[0] % 900000))
}

function verificationMailHtml(input: {
  code?: string
  link?: string
  mode: "code" | "link"
}) {
  if (input.mode === "code") {
    return `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <h2 style="color:#0f9d7c">邮箱验证码</h2>
        <p>你的验证码是：</p>
        <p style="font-size:30px;font-weight:800;letter-spacing:6px;color:#17202a">${input.code}</p>
        <p style="color:#6b7280">验证码 10 分钟内有效，请勿泄露给他人。</p>
      </div>
    `
  }

  return `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
      <h2 style="color:#0f9d7c">邮箱激活</h2>
      <p>请点击下方按钮完成邮箱验证：</p>
      <p>
        <a href="${input.link}" style="display:inline-block;padding:10px 22px;border-radius:8px;background:#0f9d7c;color:#fff;text-decoration:none">立即验证</a>
      </p>
      <p style="color:#6b7280">链接 30 分钟内有效。如果不是你本人操作，请忽略此邮件。</p>
    </div>
  `
}

export async function createEmailVerification(input: {
  email: string
  purpose: VerificationPurpose
  userId?: string
  meta?: string
  baseUrl?: string
}) {
  const db = createDb()
  const config = await getSystemMailConfig()
  const now = new Date()

  const existing = await db.query.emailVerifications.findFirst({
    where: and(
      eq(emailVerifications.email, input.email.toLowerCase()),
      eq(emailVerifications.purpose, input.purpose),
      isNull(emailVerifications.usedAt),
      gt(emailVerifications.expiresAt, now)
    ),
    orderBy: (rows, { desc }) => [desc(rows.createdAt)],
  })
  if (
    existing &&
    now.getTime() - existing.createdAt.getTime() < 60_000
  ) {
    throw new Error("发送过于频繁，请稍后再试")
  }

  const mode = config.mode
  const code = mode === "code" ? randomCode() : null
  const token = mode === "link" ? nanoid(32) : null
  const expiresAt =
    mode === "link"
      ? new Date(now.getTime() + 30 * 60_000)
      : new Date(now.getTime() + 10 * 60_000)

  await db.insert(emailVerifications).values({
    email: input.email.toLowerCase(),
    code,
    token,
    purpose: input.purpose,
    userId: input.userId,
    meta: input.meta,
    expiresAt,
    createdAt: now,
  })

  const subject =
    mode === "code" ? "邮箱验证码" : "请激活你的邮箱"
  const html = verificationMailHtml({
    mode,
    code: code || undefined,
    link: token
      ? `${input.baseUrl || "https://mail.59pk.net"}/api/auth/verification/activate?token=${token}`
      : undefined,
  })

  await sendSystemMail({
    to: input.email,
    subject,
    html,
  })

  return { mode, sent: true }
}

export async function verifyEmailCode(input: {
  email: string
  code: string
  purpose: VerificationPurpose
}) {
  const db = createDb()
  const now = new Date()
  const record = await db.query.emailVerifications.findFirst({
    where: and(
      eq(emailVerifications.email, input.email.toLowerCase()),
      eq(emailVerifications.code, input.code),
      eq(emailVerifications.purpose, input.purpose),
      isNull(emailVerifications.usedAt),
      gt(emailVerifications.expiresAt, now)
    ),
    orderBy: (rows, { desc }) => [desc(rows.createdAt)],
  })

  if (!record) {
    throw new Error("验证码错误或已过期")
  }

  if (record.attempts >= 5) {
    throw new Error("验证次数过多，请重新发送")
  }

  await db
    .update(emailVerifications)
    .set({
      attempts: record.attempts + 1,
      usedAt: now,
    })
    .where(eq(emailVerifications.id, record.id))

  return record
}

export async function verifyEmailToken(token: string) {
  const db = createDb()
  const now = new Date()
  const record = await db.query.emailVerifications.findFirst({
    where: and(
      eq(emailVerifications.token, token),
      isNull(emailVerifications.usedAt),
      gt(emailVerifications.expiresAt, now)
    ),
  })

  if (!record) {
    throw new Error("激活链接无效或已过期")
  }

  await db
    .update(emailVerifications)
    .set({ usedAt: now })
    .where(eq(emailVerifications.id, record.id))

  return record
}

export async function hasValidVerification(input: {
  email: string
  purpose: VerificationPurpose
}) {
  const db = createDb()
  const record = await db.query.emailVerifications.findFirst({
    where: and(
      eq(emailVerifications.email, input.email.toLowerCase()),
      eq(emailVerifications.purpose, input.purpose),
      isNull(emailVerifications.usedAt),
      gt(emailVerifications.expiresAt, new Date())
    ),
  })
  return Boolean(record)
}
