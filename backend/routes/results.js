import express from 'express'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const router = express.Router()

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

// ── POST /api/results ─────────────────────────────────────────
// Save a completed test session + all answers
router.post('/', async (req, res) => {
    try {
        const {
            student_id, test_type, topic,
            score, total_questions, time_taken_seconds,
            difficulty_reached, answers = []
        } = req.body

        if (!student_id || !test_type) {
            return res.status(400).json({ success: false, error: 'Missing required fields' })
        }

        // Save test session
        const { data: session, error: sessionError } = await supabase
            .from('test_sessions')
            .insert({
                student_id, test_type, topic,
                score, total_questions,
                time_taken_seconds, difficulty_reached,
            })
            .select()
            .single()

        if (sessionError) throw sessionError

        // Save individual answers
        if (answers.length > 0) {
            const answerRows = answers.map(a => ({
                session_id: session.id,
                question_id: a.question_id,
                selected_option: a.selected_option,
                is_correct: a.is_correct,
                used_hint: a.used_hint || false,
                used_answer: a.used_answer || false,
            }))

            const { error: answersError } = await supabase
                .from('test_answers')
                .insert(answerRows)

            if (answersError) console.error('Error saving answers:', answersError)
        }

        // Award points and coins
        const coinsEarned = answers.filter(a => a.is_correct && !a.used_answer).length * 10
        const pointsEarned = score * 15

        // Update student progress
        const { data: currentProgress } = await supabase
            .from('student_progress')
            .select('total_points, coins')
            .eq('student_id', student_id)
            .maybeSingle()

        if (currentProgress) {
            await supabase
                .from('student_progress')
                .update({
                    total_points: (currentProgress.total_points || 0) + pointsEarned,
                    coins: (currentProgress.coins || 0) + coinsEarned,
                    updated_at: new Date().toISOString(),
                })
                .eq('student_id', student_id)
        }

        res.json({
            success: true,
            session,
            coinsEarned,
            pointsEarned,
        })
    } catch (err) {
        console.error('Error saving result:', err)
        res.status(500).json({ success: false, error: err.message })
    }
})

// ── GET /api/results/:studentId ───────────────────────────────
// Get all test sessions for a student
router.get('/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params
        const { limit = 20, topic } = req.query

        let query = supabase
            .from('test_sessions')
            .select('*')
            .eq('student_id', studentId)
            .order('completed_at', { ascending: false })
            .limit(parseInt(limit))

        if (topic) query = query.eq('topic', topic)

        const { data, error } = await query
        if (error) throw error

        res.json({ success: true, sessions: data, count: data.length })
    } catch (err) {
        res.status(500).json({ success: false, error: err.message })
    }
})

// ── GET /api/results/:studentId/summary ──────────────────────
// Get summary stats for a student
router.get('/:studentId/summary', async (req, res) => {
    try {
        const { studentId } = req.params

        const { data: sessions, error } = await supabase
            .from('test_sessions')
            .select('*')
            .eq('student_id', studentId)

        if (error) throw error

        const totalTests = sessions.length
        const totalScore = sessions.reduce((a, s) => a + (s.score || 0), 0)
        const totalQ = sessions.reduce((a, s) => a + (s.total_questions || 0), 0)
        const accuracy = totalQ > 0 ? Math.round((totalScore / totalQ) * 100) : 0
        const totalTime = sessions.reduce((a, s) => a + (s.time_taken_seconds || 0), 0)
        const practiceCount = sessions.filter(s => s.test_type === 'practice').length
        const fullTestCount = sessions.filter(s => s.test_type === 'full_test').length

        // Topic breakdown
        const topics = ['number', 'algebra', 'geometry', 'data', 'patterns']
        const topicStats = {}
        topics.forEach(t => {
            const tSessions = sessions.filter(s => s.topic === t)
            const tScore = tSessions.reduce((a, s) => a + (s.score || 0), 0)
            const tTotal = tSessions.reduce((a, s) => a + (s.total_questions || 0), 0)
            topicStats[t] = {
                sessions: tSessions.length,
                score: tScore,
                total: tTotal,
                pct: tTotal > 0 ? Math.round((tScore / tTotal) * 100) : null,
            }
        })

        res.json({
            success: true,
            summary: {
                totalTests, totalScore, totalQ,
                accuracy, totalTime,
                practiceCount, fullTestCount,
                topicStats,
            },
        })
    } catch (err) {
        res.status(500).json({ success: false, error: err.message })
    }
})

export default router