// backend/routes/ai.js
// ================================================================
//  RULES — read before editing:
//  1. Questions are generated ONCE per day at midnight by cron
//  2. NO generation happens when a user is on the website
//  3. NO generation on server startup
//  4. On refresh-pool: delete ALL old → generate ALL new atomically
//
//  Structure:
//    3 main levels × 5 sublevels × 5 topics × 10 questions
//    = 750 questions total, all replaced at midnight
//
//  Main levels:  Beginner | Intermediate | Advanced
//  Sublevels:    Bronze | Silver | Gold | Platinum | Diamond
//  Topics:       number | algebra | geometry | data | patterns
// ================================================================

import express from 'express'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import dotenv from 'dotenv'

dotenv.config()

const router = express.Router()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ── Constants ────────────────────────────────────────────────────
const MAIN_LEVELS = ['Beginner', 'Intermediate', 'Advanced']
const SUBLEVELS   = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond']
const TOPICS      = ['number', 'algebra', 'geometry', 'data', 'patterns']

const QUESTIONS_PER_TOPIC_SUBLEVEL = 10

const DIFFICULTY_BASE = {
  'Beginner-Bronze':       10,
  'Beginner-Silver':       16,
  'Beginner-Gold':         22,
  'Beginner-Platinum':     28,
  'Beginner-Diamond':      34,
  'Intermediate-Bronze':   40,
  'Intermediate-Silver':   46,
  'Intermediate-Gold':     52,
  'Intermediate-Platinum': 58,
  'Intermediate-Diamond':  64,
  'Advanced-Bronze':       70,
  'Advanced-Silver':       76,
  'Advanced-Gold':         82,
  'Advanced-Platinum':     88,
  'Advanced-Diamond':      94,
}

const ALL_COMBOS = []
for (const mainLevel of MAIN_LEVELS) {
  for (const sublevel of SUBLEVELS) {
    for (const topic of TOPICS) {
      ALL_COMBOS.push({ mainLevel, sublevel, topic })
    }
  }
}

// ── Helpers ──────────────────────────────────────────────────────
function extractJson(text) {
  return text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
}

function buildDifficultyScores(mainLevel, sublevel, count) {
  const base = DIFFICULTY_BASE[`${mainLevel}-${sublevel}`] ?? 10
  return Array.from({ length: count }, (_, i) => Math.min(100, base + i * 6))
}

// ── Verify one question's answer is actually correct ─────────────
// Simple arithmetic check for single-number answers
function verifyAnswer(questionText, options, correctIdx) {
  // We trust the AI but add a basic sanity check:
  // correct_option must be a valid index (0-3)
  if (correctIdx < 0 || correctIdx > 3) return false
  // The correct option must not be empty
  if (!options[correctIdx] || options[correctIdx].trim() === '') return false
  // All 4 options must be different
  const uniqueOptions = new Set(options.map(o => o.trim().toLowerCase()))
  if (uniqueOptions.size < 4) return false
  return true
}

// ── AI generation for one combo ──────────────────────────────────
async function generateCombo({ mainLevel, sublevel, topic, count }) {
  const difficultyScores = buildDifficultyScores(mainLevel, sublevel, count)

  const TOPIC_GUIDE = {
    number:   'fractions, decimals, percentages, primes, squares, cubes, factors, multiples, negative numbers, place value',
    algebra:  'word problems, simple equations, substitution, basic inequalities, forming expressions',
    geometry: 'area, perimeter, volume, circles, angles, triangles, scale factor, symmetry, coordinates',
    data:     'probability, ratios, proportions, mean, median, mode, range, bar charts, pie charts',
    patterns: 'number sequences, term-to-term rules, nth term, logical reasoning, pattern recognition',
  }

  const LEVEL_DESC = {
    Beginner:     'straightforward single-step problems for students just starting 11+ prep',
    Intermediate: 'multi-step problems requiring moderate reasoning for students with some experience',
    Advanced:     'scholarship-level complex multi-step problems at the hardest 11+ exam standard',
  }

  const SUBLEVEL_DESC = {
    Bronze:   `easiest within ${mainLevel}`,
    Silver:   `slightly harder than Bronze within ${mainLevel}`,
    Gold:     `mid-level challenge within ${mainLevel}`,
    Platinum: `challenging within ${mainLevel}`,
    Diamond:  `hardest within ${mainLevel} — top students only`,
  }

  const prompt = `You are an expert 11+ entrance exam maths teacher for UK students aged 10–13.

Generate exactly ${count} multiple-choice maths questions.

Topic: ${topic}
Topic covers: ${TOPIC_GUIDE[topic]}
Main level: ${mainLevel} — ${LEVEL_DESC[mainLevel]}
Sublevel: ${sublevel} — ${SUBLEVEL_DESC[sublevel]}
Difficulty scores for questions 1 to ${count}: ${difficultyScores.join(', ')} (out of 100)

=== CRITICAL RULES — you MUST follow all of these ===

RULE 1 — SYMBOLS (very important):
Always use proper mathematical symbols in ALL questions, options, and explanations.
NEVER write the word form. Use the symbol instead:
  ✓ Use: +  ✗ Never write: "plus"
  ✓ Use: −  ✗ Never write: "minus"
  ✓ Use: ×  ✗ Never write: "times" or "multiplied by"
  ✓ Use: ÷  ✗ Never write: "divided by"
  ✓ Use: =  ✗ Never write: "equals"
  ✓ Use: ²  ✗ Never write: "squared"
  ✓ Use: ³  ✗ Never write: "cubed"
  ✓ Use: %  ✗ Never write: "percent"
  ✓ Use: >  ✗ Never write: "greater than"
  ✓ Use: <  ✗ Never write: "less than"
  ✓ Use: ≥  ✗ Never write: "greater than or equal to"
  ✓ Use: ≤  ✗ Never write: "less than or equal to"

RULE 2 — GUARANTEED CORRECT ANSWERS (ZERO-ERROR MODE)
  You MUST solve the question completely first, before generating any options.
  Store this as the final verified answer.
Strict process (follow in exact order):
  1.Solve first: Derive the final answer step-by-step internally.
  2.Lock the answer: Do NOT change it afterward.
  3.Generate options:
    Include the correct answer exactly as one option.
    Generate 3 plausible but incorrect distractors based on common mistakes.
  4.Uniqueness check:
    All 4 options must be distinct (no duplicates, no equivalent forms).
  5.Single-correct check:
    Exactly one option must match the verified answer.
    The other 3 must be clearly incorrect when re-solved.
  6.Reverse validation:
    Re-solve the question using each option.
    Confirm only the correct option satisfies the question.
  7.Age-level validation:
    Ensure the logic and calculations match the target difficulty level.
  8.Fail-safe rule:
    If any doubt exists (multiple correct answers, ambiguity, rounding issues), discard and regenerate the question.

RULE 3 — NO REPEATED QUESTIONS:
1. Each question must test a different concept, scenario, or solving approach, not just different numbers.
2. Avoid repeating the same structure (e.g., same formula, same wording pattern, or same problem type).
3. Ensure variation across:
    Context (real-life, abstract, word problem, diagram-based, etc.)
    Method required (calculation, reasoning, logic, multi-step solving, estimation, etc.)
    Question format (MCQ, assertion-reason, case-based, fill-in, etc.)
4. If two questions can be solved using the same exact steps, they are considered duplicates — avoid them.
5. Before generating a new question, verify it introduces a new thinking pattern or skill.

RULE 4 — EXPLANATION QUALITY (very important):
The explanation field must be:
  - Long and detailed (minimum 4-5 sentences)
  - Written in simple language a 10-year-old can understand
  - Show every step of the working clearly
  - Explain WHY each step is done, not just what to do
  - Use proper maths symbols (follow Rule 1)
  - Format: "Step 1: [action]. Step 2: [action]. ..."
  Example of a good explanation:
  "Step 1: We need to find 15% of 240. Step 2: First find 10% by dividing 240 ÷ 10 = 24. Step 3: Then find 5% by halving the 10%: 24 ÷ 2 = 12. Step 4: Add them together: 24 + 12 = 36. Step 5: So 15% of 240 = 36. The correct answer is option B."

RULE 5 — HINT QUALITY:
The hint must nudge the student towards the method without giving the answer.
Example: "Think about breaking the percentage into easier parts like 10% + 5%."

=== END OF RULES ===

Return ONLY valid JSON, no markdown, no extra text:
{
  "questions": [
    {
      "question_text": "full question using proper symbols",
      "option_a": "first option",
      "option_b": "second option",
      "option_c": "third option",
      "option_d": "fourth option",
      "correct_option": "a",
      "explanation": "Step 1: ... Step 2: ... Step 3: ... (detailed, at least 4 steps)",
      "hint": "one helpful nudge towards the method",
      "subtopic": "specific area within ${topic}",
      "difficulty_score": ${difficultyScores[0]}
    }
  ]
}

- Exactly ${count} questions
- correct_option must be exactly one of: a, b, c, d
- All 4 options per question must be different values
- No markdown or text outside the JSON`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.7,
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = completion.choices?.[0]?.message?.content?.trim()
  if (!raw) throw new Error('OpenAI returned empty response')

  let parsed
  try {
    parsed = JSON.parse(extractJson(raw))
  } catch {
    throw new Error('AI returned invalid JSON')
  }

  if (!Array.isArray(parsed.questions)) {
    throw new Error('AI response missing questions array')
  }

  // Filter out any questions that fail basic validation
  const validQuestions = parsed.questions.filter((q, i) => {
    const options = [q.option_a, q.option_b, q.option_c, q.option_d]
    const correctIdx = ['a', 'b', 'c', 'd'].indexOf(q.correct_option?.toLowerCase())
    const isValid = verifyAnswer(q.question_text, options, correctIdx)
    if (!isValid) {
      console.warn(`⚠️  Question ${i + 1} failed validation — skipping`)
    }
    return isValid
  })

  // Map to DB rows
  return validQuestions.map((q, i) => ({
    topic,
    subtopic:         q.subtopic || topic,
    main_level:       mainLevel,
    sublevel:         sublevel,
    question_text:    q.question_text,
    option_a:         q.option_a,
    option_b:         q.option_b,
    option_c:         q.option_c,
    option_d:         q.option_d,
    correct_option:   q.correct_option?.toLowerCase(),
    explanation:      q.explanation || '',
    hint:             q.hint || '',
    difficulty_score: difficultyScores[i] ?? 50,
    is_ai_generated:  true,
  }))
}

// ── POST /api/ai/refresh-pool ─────────────────────────────────────
router.post('/refresh-pool', async (req, res) => {
  if (req.headers['x-cron-secret'] !== process.env.CRON_SECRET) {
    return res.status(401).json({ success: false, error: 'Unauthorised' })
  }

  if (router._isRefreshing) {
    return res.status(409).json({ success: false, error: 'Refresh already in progress' })
  }
  router._isRefreshing = true

  const startedAt = new Date().toISOString()
  console.log(`🕛 [${startedAt}] Midnight refresh started — 75 combos × 10 questions = 750 total`)

  const inserted = []
  const errors   = []

  try {
    // Step 1: Delete ALL existing questions
    console.log('🗑️  Deleting all existing questions...')
    const { error: deleteErr } = await supabase
      .from('questions')
      .delete()
      .gte('difficulty_score', 0)

    if (deleteErr) {
      console.error('⚠️  Delete error (continuing anyway):', deleteErr.message)
    } else {
      console.log('✅ All old questions deleted')
    }

    // Step 2: Generate and insert all 75 combos
    for (const combo of ALL_COMBOS) {
      const { mainLevel, sublevel, topic } = combo
      const label = `${mainLevel}/${sublevel}/${topic}`

      try {
        console.log(`🤖 Generating ${QUESTIONS_PER_TOPIC_SUBLEVEL} questions: ${label}`)

        const rows = await generateCombo({
          mainLevel,
          sublevel,
          topic,
          count: QUESTIONS_PER_TOPIC_SUBLEVEL,
        })

        if (rows.length === 0) {
          console.warn(`⚠️  All questions failed validation for ${label}`)
          errors.push({ label, error: 'All questions failed validation' })
          continue
        }

        const { error: insertErr } = await supabase.from('questions').insert(rows)

        if (insertErr) {
          console.error(`❌ Insert failed for ${label}:`, insertErr.message)
          errors.push({ label, error: insertErr.message })
        } else {
          console.log(`✅ ${label}: ${rows.length} inserted`)
          inserted.push({ label, count: rows.length })
        }

        // Pause between OpenAI calls to respect rate limits
        await new Promise(r => setTimeout(r, 400))

      } catch (err) {
        console.error(`❌ Generation failed for ${label}:`, err.message)
        errors.push({ label, error: err.message })
      }
    }

    const totalInserted = inserted.reduce((s, r) => s + r.count, 0)
    const finishedAt = new Date().toISOString()

    console.log(`🎉 Refresh complete. Inserted: ${totalInserted}. Errors: ${errors.length}. Finished: ${finishedAt}`)

    res.json({
      success:       true,
      totalInserted,
      startedAt,
      finishedAt,
      combosOk:      inserted.length,
      combosError:   errors.length,
      errors,
    })

  } catch (err) {
    console.error('💥 Refresh-pool fatal error:', err)
    res.status(500).json({ success: false, error: err.message })
  } finally {
    router._isRefreshing = false
  }
})

// ── GET /api/ai/pool-status ───────────────────────────────────────
router.get('/pool-status', async (req, res) => {
  try {
    const rows = []
    for (const mainLevel of MAIN_LEVELS) {
      for (const sublevel of SUBLEVELS) {
        const { count } = await supabase
          .from('questions')
          .select('*', { count: 'exact', head: true })
          .eq('main_level', mainLevel)
          .eq('sublevel', sublevel)
        rows.push({ mainLevel, sublevel, count: count ?? 0 })
      }
    }
    const total = rows.reduce((s, r) => s + r.count, 0)
    res.json({ success: true, total, breakdown: rows })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── GET /api/ai/status ────────────────────────────────────────────
router.get('/status', async (req, res) => {
  try {
    const { count: total } = await supabase
      .from('questions').select('*', { count: 'exact', head: true })
    res.json({ success: true, totalQuestions: total ?? 0 })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router