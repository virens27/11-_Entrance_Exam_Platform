import express from 'express'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const router = express.Router()

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

// ── GET /api/questions ────────────────────────────────────────
// Get questions filtered by topic and/or difficulty
// Query params: ?topic=number&difficulty=beginner&limit=20
router.get('/', async (req, res) => {
    try {
        const { topic, difficulty, limit = 20 } = req.query

        let query = supabase
            .from('questions')
            .select('*')

        if (topic && topic !== 'all') query = query.eq('topic', topic)
        if (difficulty) query = query.eq('difficulty', difficulty)

        // Randomise and limit
        const { data, error } = await query.limit(parseInt(limit))

        if (error) throw error

        // Shuffle questions
        const shuffled = data.sort(() => Math.random() - 0.5)

        res.json({ success: true, questions: shuffled, count: shuffled.length })
    } catch (err) {
        console.error('Error fetching questions:', err)
        res.status(500).json({ success: false, error: err.message })
    }
})

// ── GET /api/questions/:id ────────────────────────────────────
// Get a single question by ID
router.get('/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('questions')
            .select('*')
            .eq('id', req.params.id)
            .single()

        if (error) throw error
        res.json({ success: true, question: data })
    } catch (err) {
        res.status(404).json({ success: false, error: 'Question not found' })
    }
})

// ── POST /api/questions ───────────────────────────────────────
// Add a new question (used by AI route to save generated questions)
router.post('/', async (req, res) => {
    try {
        const {
            topic, subtopic, difficulty,
            question_text, option_a, option_b, option_c, option_d,
            correct_option, explanation, hint, is_ai_generated
        } = req.body

        if (!topic || !difficulty || !question_text) {
            return res.status(400).json({ success: false, error: 'Missing required fields' })
        }

        const { data, error } = await supabase
            .from('questions')
            .insert({
                topic, subtopic, difficulty,
                question_text, option_a, option_b, option_c, option_d,
                correct_option, explanation, hint,
                is_ai_generated: is_ai_generated || false,
            })
            .select()
            .single()

        if (error) throw error
        res.json({ success: true, question: data })
    } catch (err) {
        console.error('Error adding question:', err)
        res.status(500).json({ success: false, error: err.message })
    }
})

// ── GET /api/questions/count/by-topic ────────────────────────
// Get question counts per topic (useful for dashboard stats)
router.get('/count/by-topic', async (req, res) => {
    try {
        const topics = ['number', 'algebra', 'geometry', 'data', 'patterns']
        const counts = {}

        for (const topic of topics) {
            const { count } = await supabase
                .from('questions')
                .select('*', { count: 'exact', head: true })
                .eq('topic', topic)
            counts[topic] = count || 0
        }

        res.json({ success: true, counts })
    } catch (err) {
        res.status(500).json({ success: false, error: err.message })
    }
})

export default router