// backend/server.js
// ================================================================
//  HOW THIS WORKS — read carefully:
//
//  1. Server starts → checks if question pool is empty
//  2. If pool is empty (first deploy, or after DB wipe) →
//     automatically generates all 750 questions right away
//  3. Every day at 12:00 AM midnight → automatically deletes
//     old questions and generates fresh 750 new ones
//  4. NOTHING needs to be done manually by any human ever.
//  5. No question generation happens during user activity —
//     only on startup (if empty) and at midnight.
// ================================================================

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import cron from 'node-cron'

dotenv.config()

import questionsRouter from './routes/questions.js'
import usersRouter from './routes/users.js'
import resultsRouter from './routes/results.js'
import aiRouter from './routes/ai.js'

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
}))
app.use(express.json())

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: '11+ Exam Backend running!',
    version: '4.0.0',
    info: 'Questions auto-generate on startup if empty, then refresh every midnight',
  })
})

app.use('/api/questions', questionsRouter)
app.use('/api/users', usersRouter)
app.use('/api/results', resultsRouter)
app.use('/api/ai', aiRouter)

app.use((req, res) => res.status(404).json({ error: 'Route not found' }))
app.use((err, req, res, next) => {
  console.error('Server error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

// ── The single function that triggers question generation ─────────
// Called by: (1) startup if pool empty, (2) midnight cron
// Never called by user activity or frontend requests
async function triggerPoolRefresh(reason) {
  console.log(`🤖 Triggering question generation... (reason: ${reason})`)
  try {
    const res = await fetch(`http://localhost:${PORT}/api/ai/refresh-pool`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': process.env.CRON_SECRET,
      },
    })
    const data = await res.json()
    if (data.success) {
      console.log(`✅ Generation complete. Total questions in DB: ${data.totalInserted}. Errors: ${data.combosError}`)
    } else {
      console.error('❌ Generation failed:', data.error)
    }
  } catch (err) {
    console.error('❌ Generation error:', err.message)
  }
}

// ── Midnight cron — runs every day at 12:00 AM automatically ─────
// '0 0 * * *' = minute 0, hour 0, every day
// No human action needed. Ever.
cron.schedule('0 0 * * *', () => {
  triggerPoolRefresh('midnight-cron')
}, {
  timezone: 'Europe/London',
})

console.log('🕛 Midnight cron scheduled — questions will auto-refresh every day at 12:00 AM')

// ── On startup: auto-generate if pool is empty ───────────────────
// This handles:
//   - First ever deploy (DB is empty)
//   - After a DB wipe or migration
//   - After server was down for a long time
// Takes ~8-12 minutes to generate all 750 questions.
// The server is still available to handle other requests during this time.
async function autoSeedIfEmpty() {
  console.log('🔍 Startup check: checking question pool...')
  try {
    const res = await fetch(`http://localhost:${PORT}/api/ai/pool-status`)
    const data = await res.json()

    if (!data.success) {
      console.warn('⚠️  Could not read pool status — will retry in 1 minute')
      setTimeout(autoSeedIfEmpty, 60 * 1000)
      return
    }

    if (data.total < 100) {
      // Pool is empty or very thin — generate everything now automatically
      console.log(`📭 Pool has only ${data.total} questions. Auto-generating all 750 now...`)
      console.log('⏳ This takes about 8-12 minutes. Server remains usable during generation.')
      await triggerPoolRefresh('startup-empty-pool')
    } else {
      // Pool is healthy
      console.log(`✅ Pool has ${data.total} questions. All good — no generation needed.`)
      console.log(`🕛 Next auto-refresh: tonight at midnight.`)
    }
  } catch (err) {
    console.error('Startup check failed:', err.message)
    console.log('Retrying in 1 minute...')
    setTimeout(autoSeedIfEmpty, 60 * 1000)
  }
}

app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`)
  console.log(`🚫 No manual commands needed — everything is automatic`)
  // Wait 3 seconds for the server to fully initialise before checking pool
  setTimeout(autoSeedIfEmpty, 3000)
})