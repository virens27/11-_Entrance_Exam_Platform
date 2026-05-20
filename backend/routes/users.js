import express from 'express'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const router = express.Router()

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

// ── GET /api/users/:studentId ─────────────────────────────────
// Get a student profile + progress (used by parent dashboard)
router.get('/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params

        // Get profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', studentId)
            .single()

        if (profileError) throw profileError

        // Get progress
        const { data: progress } = await supabase
            .from('student_progress')
            .select('*')
            .eq('student_id', studentId)
            .maybeSingle()

        res.json({ success: true, profile, progress })
    } catch (err) {
        res.status(404).json({ success: false, error: 'Student not found' })
    }
})

// ── GET /api/users/by-email/:email ────────────────────────────
// Find student by email (used by parent to look up child)
router.get('/by-email/:email', async (req, res) => {
    try {
        const email = decodeURIComponent(req.params.email).toLowerCase()

        const { data: profile, error } = await supabase
            .from('profiles')
            .select('id, email, full_name, role, created_at')
            .eq('email', email)
            .eq('role', 'student')
            .maybeSingle()

        if (error) throw error

        if (!profile) {
            return res.status(404).json({
                success: false,
                error: 'No student found with that email',
            })
        }

        res.json({ success: true, student: profile })
    } catch (err) {
        res.status(500).json({ success: false, error: err.message })
    }
})

// ── PUT /api/users/:studentId/progress ───────────────────────
// Update student progress (points, coins, level, streak)
router.put('/:studentId/progress', async (req, res) => {
    try {
        const { studentId } = req.params
        const { total_points, coins, current_level, streak_count, badges } = req.body

        const updates = {}
        if (total_points !== undefined) updates.total_points = total_points
        if (coins !== undefined) updates.coins = coins
        if (current_level !== undefined) updates.current_level = current_level
        if (streak_count !== undefined) updates.streak_count = streak_count
        if (badges !== undefined) updates.badges = badges
        updates.updated_at = new Date().toISOString()

        const { data, error } = await supabase
            .from('student_progress')
            .update(updates)
            .eq('student_id', studentId)
            .select()
            .single()

        if (error) throw error
        res.json({ success: true, progress: data })
    } catch (err) {
        res.status(500).json({ success: false, error: err.message })
    }
})

export default router