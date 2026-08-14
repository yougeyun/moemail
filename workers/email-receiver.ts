import { Env } from '../types'
import { drizzle } from 'drizzle-orm/d1'
import { messages, emails, webhooks, wechatSubscriptions } from '../app/lib/schema'
import { eq, sql } from 'drizzle-orm'
import PostalMime from 'postal-mime'
import { WEBHOOK_CONFIG } from '../app/config/webhook'
import { EmailMessage } from '../app/lib/webhook'

const handleEmail = async (message: ForwardableEmailMessage, env: Env) => {
  const db = drizzle(env.DB, {
    schema: { messages, emails, webhooks, wechatSubscriptions },
  })

  const parsedMessage = await PostalMime.parse(message.raw)

  console.log("parsedMessage:", parsedMessage)

  try {
    const targetEmail = await db.query.emails.findFirst({
      where: eq(sql`LOWER(${emails.address})`, message.to.toLowerCase())
    })

    if (!targetEmail) {
      console.error(`Email not found: ${message.to}`)
      return
    }

    const savedMessage = await db.insert(messages).values({
      emailId: targetEmail.id,
      fromAddress: message.from,
      subject: parsedMessage.subject || '(无主题)',
      content: parsedMessage.text || '',
      html: parsedMessage.html || '',
      type: 'received',
    }).returning().get()

    const webhook = await db.query.webhooks.findFirst({
      where: eq(webhooks.userId, targetEmail!.userId!)
    })

    if (webhook?.enabled) {
      try {
        await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Event': WEBHOOK_CONFIG.EVENTS.NEW_MESSAGE
          },
          body: JSON.stringify({
            emailId: targetEmail.id,
            messageId: savedMessage.id,
            fromAddress: savedMessage.fromAddress,
            subject: savedMessage.subject,
            content: savedMessage.content,
            html: savedMessage.html,
            receivedAt: savedMessage.receivedAt.toISOString(),
            toAddress: targetEmail.address
          } as EmailMessage)
        })
      } catch (error) {
        console.error('Failed to send webhook:', error)
      }
    }

    if (targetEmail.userId) {
      try {
        const subscriptions = await db.query.wechatSubscriptions.findMany({
          where: eq(wechatSubscriptions.userId, targetEmail.userId)
        })
        const activeSubscriptions = subscriptions.filter((item) => item.enabled)
        if (activeSubscriptions.length > 0) {
          await sendSubscribeMessage({
            env,
            subscriptions: activeSubscriptions,
            subject: savedMessage.subject,
            from: savedMessage.fromAddress || '',
          })
        }
      } catch (error) {
        console.error('Failed to send subscribe message:', error)
      }
    }

    console.log(`Email processed: ${parsedMessage.subject}`)
  } catch (error) {
    console.error('Failed to process email:', error)
  }
}

async function sendSubscribeMessage(input: {
  env: Env
  subscriptions: Array<{
    openid: string
    templateId: string
  }>
  subject: string
  from: string
}) {
  const templateId = await input.env.SITE_CONFIG.get(
    'WECHAT_SUBSCRIBE_TEMPLATE_ID'
  )
  if (!templateId) return

  const accessToken = await getWechatAccessToken(input.env)
  const subject = truncateText(input.subject || '新邮件', 20)
  const from = truncateText(input.from || '未知发件人', 20)
  const time = formatWechatTime(new Date())

  for (const subscription of input.subscriptions) {
    await fetch(
      `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          touser: subscription.openid,
          template_id: templateId,
          page: 'pages/inbox/inbox',
          miniprogram_state: 'formal',
          lang: 'zh_CN',
          data: {
            thing1: { value: subject },
            thing2: { value: from },
            time3: { value: time },
          },
        }),
      }
    )
  }
}

async function getWechatAccessToken(env: Env): Promise<string> {
  const [appId, appSecret] = await Promise.all([
    env.SITE_CONFIG.get('WECHAT_APP_ID'),
    env.SITE_CONFIG.get('WECHAT_APP_SECRET'),
  ])
  if (!appId || !appSecret) {
    throw new Error('微信配置缺失')
  }

  const cached = await env.SITE_CONFIG.get('WECHAT_ACCESS_TOKEN_CACHE')
  if (cached) {
    try {
      const parsed = JSON.parse(cached) as {
        token?: string
        expiresAt?: number
      }
      if (parsed.token && parsed.expiresAt && parsed.expiresAt > Date.now()) {
        return parsed.token
      }
    } catch {
      // Refresh below.
    }
  }

  const params = new URLSearchParams({
    grant_type: 'client_credential',
    appid: appId,
    secret: appSecret,
  })
  const response = await fetch(
    `https://api.weixin.qq.com/cgi-bin/token?${params.toString()}`
  )
  const data = (await response.json()) as {
    access_token?: string
    expires_in?: number
    errmsg?: string
  }
  if (!data.access_token) {
    throw new Error(data.errmsg || '获取微信访问令牌失败')
  }

  const expiresIn = Math.max(60, Number(data.expires_in) - 300)
  await env.SITE_CONFIG.put(
    'WECHAT_ACCESS_TOKEN_CACHE',
    JSON.stringify({
      token: data.access_token,
      expiresAt: Date.now() + expiresIn * 1000,
    }),
    { expirationTtl: expiresIn }
  )
  return data.access_token
}

function truncateText(value: string, max: number) {
  return value.length > max ? value.slice(0, max) : value
}

function formatWechatTime(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}年${pad(date.getMonth() + 1)}月${pad(
    date.getDate()
  )}日 ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const worker = {
  async email(message: ForwardableEmailMessage, env: Env): Promise<void> {
    await handleEmail(message, env)
  }
}

export default worker
