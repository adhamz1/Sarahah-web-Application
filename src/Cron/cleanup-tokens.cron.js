// Periodic cleanup for expired blacklisted tokens
import { BlacklistedTokens } from "../DB/Models/index.js"

// Delete tokens whose expiredAt (JWT exp in seconds) is in the past
const cleanupExpiredTokens = async () => {
  try {
    const nowInSeconds = Math.floor(Date.now() / 1000)
    const { deletedCount } = await BlacklistedTokens.deleteMany({ expiredAt: { $lt: nowInSeconds } })
    if (deletedCount) {
      console.log(`[cron] Cleaned ${deletedCount} expired blacklisted tokens`)
    }
  } catch (err) {
    console.error("[cron] Failed to cleanup expired tokens:", err.message)
  }
}

// Run on startup and then every hour
cleanupExpiredTokens()
setInterval(cleanupExpiredTokens, 60 * 60 * 1000)
