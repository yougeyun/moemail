interface Env {
  DB: D1Database
}

const CLEANUP_CONFIG = {
  // Whether to delete expired emails
  DELETE_EXPIRED_EMAILS: true,
  
  // Batch processing size
  BATCH_SIZE: 100,
} as const 

const main = {
  async scheduled(_: ScheduledEvent, env: Env) {
    const now = Date.now()

    try {
      if (!CLEANUP_CONFIG.DELETE_EXPIRED_EMAILS) {
        console.log('Expired email deletion is disabled')
        return
      }

      const result = await env.DB
        .prepare(`
          DELETE FROM email 
          WHERE expires_at < ?
          LIMIT ?
        `)
        .bind(now, CLEANUP_CONFIG.BATCH_SIZE)
        .run()

      if (result.success) {
        console.log(`Deleted ${result?.meta?.changes ?? 0} expired emails and their associated messages`)
      } else {
        console.error('Failed to delete expired emails')
      }

      const slotResult = await env.DB
        .prepare(`
          DELETE FROM email_slot
          WHERE expires_at < ?
          LIMIT ?
        `)
        .bind(now, CLEANUP_CONFIG.BATCH_SIZE)
        .run()

      if (slotResult.success) {
        console.log(`Released ${slotResult?.meta?.changes ?? 0} expired email slots`)
      } else {
        console.error('Failed to release expired email slots')
      }

      const quotaResult = await env.DB
        .prepare(`
          UPDATE user_email_quota
          SET quota = 0
          WHERE quota > 0
            AND source_code_id IS NOT NULL
            AND source_code_id IN (
              SELECT id FROM activation_code
              WHERE expires_at IS NOT NULL AND expires_at < ?
            )
        `)
        .bind(now)
        .run()

      if (quotaResult.success) {
        console.log(`Zeroed ${quotaResult?.meta?.changes ?? 0} expired activation code quotas`)
      } else {
        console.error('Failed to zero expired activation code quotas')
      }
    } catch (error) {
      console.error('Failed to cleanup:', error)
      throw error
    }
  }
}

export default main
