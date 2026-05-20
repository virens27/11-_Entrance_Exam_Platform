// src/pages/ChallengePage.jsx
// ================================================================
//  Challenge Mode — 50 mixed questions from ALL sublevels
//  (Bronze, Silver, Gold, Platinum, Diamond across all levels)
//  60-minute timer. Same features as TestPage:
//  hint, correct answer, explanation.
//  Questions fetched from Supabase — no AI generation here.
// ================================================================

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../utils/supabaseClient'

const TOTAL_QUESTIONS = 50
const TOTAL_TIME      = 60 * 60  // 60 minutes in seconds

const SUBLEVELS    = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond']
const MAIN_LEVELS  = ['Beginner', 'Intermediate', 'Advanced']
const VALID_TOPICS = ['number', 'algebra', 'geometry', 'data', 'patterns']

const SUBLEVEL_STYLE = {
  Bronze:   { color: '#cd7f32', bg: '#fdf3e7', border: '#e8a85a' },
  Silver:   { color: '#6b7280', bg: '#f3f4f6', border: '#9ca3af' },
  Gold:     { color: '#d97706', bg: '#fef3c7', border: '#fde68a' },
  Platinum: { color: '#6366f1', bg: '#eef2ff', border: '#a5b4fc' },
  Diamond:  { color: '#0ea5e9', bg: '#e0f2fe', border: '#7dd3fc' },
}

const fmt = s => {
  const m   = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${String(sec).padStart(2, '0')}`
}

function mapQuestion(row) {
  if (!row) return null
  return {
    id:          row.id,
    topic:       row.topic,
    mainLevel:   row.main_level,
    sublevel:    row.sublevel,
    question:    row.question_text,
    options:     [row.option_a, row.option_b, row.option_c, row.option_d],
    correct:     ['a', 'b', 'c', 'd'].indexOf(row.correct_option),
    hint:        row.hint        || '',
    explanation: row.explanation || '',
    diffScore:   row.difficulty_score || 50,
  }
}

// ── Fetch 50 mixed questions from DB ─────────────────────────────
// We pick ~3-4 questions from each sublevel (5 sublevels × ~10 = 50)
// balanced across topics
async function fetchChallengeQuestions(topicName) {
  const topic = (topicName && topicName !== 'all' && VALID_TOPICS.includes(topicName.toLowerCase()))
    ? topicName.toLowerCase()
    : null

  // Fetch a larger pool then sample from it
  // Get ~10 per sublevel across all main levels → 50 total
  const allRows = []
  const usedIds = new Set()

  for (const sublevel of SUBLEVELS) {
    // Pick 10 questions per sublevel (2 from each main level roughly)
    for (const mainLevel of MAIN_LEVELS) {
      let query = supabase
        .from('questions')
        .select('id, topic, subtopic, main_level, sublevel, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, hint, difficulty_score')
        .eq('main_level', mainLevel)
        .eq('sublevel', sublevel)
        .order('difficulty_score', { ascending: true })

      if (topic) query = query.eq('topic', topic)

      const { data } = await query.limit(4)
      if (data) {
        for (const row of data) {
          if (!usedIds.has(row.id)) {
            usedIds.add(row.id)
            allRows.push(row)
          }
        }
      }
    }
  }

  // Shuffle and take exactly 50
  const shuffled = allRows.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, TOTAL_QUESTIONS)
}

function getOptionStyle(i, selected, answered, correct) {
  if (answered) {
    if (i === correct) {
      return { bg: '#d1fae5', border: '#059669', color: '#065f46', circleBg: '#059669', circleColor: 'white', circleLabel: '✓' }
    }
    if (i === selected && i !== correct) {
      return { bg: '#fee2e2', border: '#dc2626', color: '#7f1d1d', circleBg: '#dc2626', circleColor: 'white', circleLabel: '✗' }
    }
    return { bg: 'white', border: '#e5e7eb', color: '#1e1b4b', circleBg: '#f3f4f6', circleColor: '#6b7280', circleLabel: ['A','B','C','D'][i] }
  }
  if (i === selected) {
    return { bg: '#eff6ff', border: '#2563eb', color: '#1d4ed8', circleBg: '#2563eb', circleColor: 'white', circleLabel: ['A','B','C','D'][i] }
  }
  return { bg: 'white', border: '#e5e7eb', color: '#1e1b4b', circleBg: '#f3f4f6', circleColor: '#6b7280', circleLabel: ['A','B','C','D'][i] }
}

export default function ChallengePage() {
  const { topicName }      = useParams()
  const { user }           = useAuth()
  const navigate           = useNavigate()

  // Question pool
  const [questions,    setQuestions]    = useState([])
  const [qIndex,       setQIndex]       = useState(0)
  const [loadingPool,  setLoadingPool]  = useState(true)
  const [poolError,    setPoolError]    = useState('')

  // Per-question UI state
  const [selected,   setSelected]   = useState(null)
  const [answered,   setAnswered]   = useState(false)
  const [showHint,   setShowHint]   = useState(false)
  const [coins,      setCoins]      = useState(0)
  const [answers,    setAnswers]    = useState([])   // history for report
  const [saving,     setSaving]     = useState(false)
  const [saved,      setSaved]      = useState(false)

  // Timer
  const [timeLeft,  setTimeLeft]  = useState(TOTAL_TIME)
  const [finished,  setFinished]  = useState(false)
  const timerRef    = useRef(null)
  const finishedRef  = useRef(false)
  const saveCalledRef = useRef(false)   // prevent double-save

  // ── Load question pool on mount ─────────────────────────────
  useEffect(() => {
    async function load() {
      setLoadingPool(true)
      setPoolError('')
      try {
        const qs = await fetchChallengeQuestions(topicName)
        if (!qs || qs.length === 0) {
          setPoolError('No questions found. Please ensure the question pool has been generated.')
        } else {
          setQuestions(qs)
        }
      } catch (e) {
        setPoolError('Failed to load questions. Please refresh the page.')
      }
      setLoadingPool(false)
    }
    load()
  }, [topicName])

  // ── Timer ───────────────────────────────────────────────────
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  useEffect(() => {
    if (timeLeft === 0 && !finishedRef.current) {
      finishedRef.current = true
      setFinished(true)
    }
  }, [timeLeft])

  // ── Reset UI on new question ────────────────────────────────
  useEffect(() => {
    setSelected(null)
    setAnswered(false)
    setShowHint(false)
  }, [qIndex])

  const q = mapQuestion(questions[qIndex] ?? null)

  const handleSelect = (i) => { if (!answered) setSelected(i) }

  const handleSubmit = () => {
    if (selected === null || answered || !q) return
    setAnswered(true)
    const isCorrect = selected === q.correct
    const coinDelta = isCorrect ? (showHint ? 5 : 10) : 0
    setCoins(c => c + coinDelta)
    setAnswers(prev => [...prev, { question: q.question, selected, correct: q.correct, isCorrect, sublevel: q.sublevel, mainLevel: q.mainLevel, topic: q.topic }])
  }

  const handleNext = () => {
    if (qIndex + 1 >= questions.length) {
      // Last question — trigger save THEN set finished
      if (!finishedRef.current) {
        finishedRef.current = true
        setFinished(true)
      }
    } else {
      setQIndex(i => i + 1)
    }
  }

  // ── Save result + update student_progress ────────────────────
  // Called directly from the report screen on first render (not via useEffect)
  // so we always have the final answers/coins values.
  async function saveResultAndUpdateProgress(finalAnswers, finalCoins, timeTaken) {
    if (!user || saveCalledRef.current) return
    saveCalledRef.current = true
    setSaving(true)

    const totalQ      = finalAnswers.length
    const correct     = finalAnswers.filter(a => a.isCorrect).length
    const sublevelOrder = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond']
    const sublevelsHit  = [...new Set(finalAnswers.map(a => a.sublevel).filter(Boolean))]
    const bestSublevel  = sublevelsHit.sort(
      (a, b) => sublevelOrder.indexOf(b) - sublevelOrder.indexOf(a)
    )[0] || 'Diamond'

    try {
      // 1. Insert into results
      const { error: insertError } = await supabase.from('results').insert({
        student_id:       user.id,
        topic:            topicName || null,
        main_level:       'Challenge',
        sublevel_reached: bestSublevel,
        score:            correct,
        total_questions:  totalQ,
        time_taken_secs:  timeTaken,
        coins_earned:     finalCoins,
        completed_at:     new Date().toISOString(),
      })
      if (insertError) console.error('[Challenge] results insert error:', insertError)

      // 2. Upsert student_progress
      const { data: prog } = await supabase
        .from('student_progress')
        .select('*')
        .eq('student_id', user.id)
        .maybeSingle()

      const starsEarned = correct
      if (prog) {
        const diffDays  = prog.last_active
          ? Math.floor((Date.now() - new Date(prog.last_active)) / (1000 * 60 * 60 * 24))
          : 999
        const newStreak = diffDays === 1 ? (prog.streak_count || 0) + 1
                        : diffDays === 0 ? (prog.streak_count || 0) : 1
        await supabase.from('student_progress').update({
          total_points: (prog.total_points || 0) + correct,
          coins:        (prog.coins        || 0) + finalCoins,
          stars:        (prog.stars        || 0) + starsEarned,
          streak_count: newStreak,
          last_active:  new Date().toISOString(),
        }).eq('student_id', user.id)
      } else {
        await supabase.from('student_progress').insert({
          student_id:   user.id,
          total_points: correct,
          coins:        finalCoins,
          stars:        starsEarned,
          streak_count: 1,
          last_active:  new Date().toISOString(),
        })
      }
      setSaved(true)
    } catch (err) {
      console.error('[ChallengePage] Failed to save result:', err)
    } finally {
      setSaving(false)
    }
  }

  // ── Report screen ───────────────────────────────────────────
  if (finished || (answered && qIndex + 1 >= questions.length && questions.length > 0)) {
    const total    = answers.length
    const correct  = answers.filter(a => a.isCorrect).length
    const pct      = total > 0 ? Math.round((correct / total) * 100) : 0
    const timeTaken = TOTAL_TIME - timeLeft

    // Trigger save on first render of report screen (synchronous-safe)
    if (!saveCalledRef.current && user && total > 0) {
      saveResultAndUpdateProgress(answers, coins, timeTaken)
    }

    // Breakdown by sublevel
    const byLevel = {}
    for (const a of answers) {
      const key = a.sublevel
      if (!byLevel[key]) byLevel[key] = { correct: 0, total: 0 }
      byLevel[key].total++
      if (a.isCorrect) byLevel[key].correct++
    }

    return (
      <div style={{ fontFamily: "'Nunito',sans-serif", minHeight: '100vh', background: '#f0f4ff', padding: '30px 16px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>

          {/* Trophy header */}
          <div style={{
            background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
            borderRadius: 28, padding: '32px', textAlign: 'center',
            marginBottom: 20, boxShadow: '0 8px 0 #5b21b6', color: 'white',
          }}>
            <div style={{ fontSize: '4rem', marginBottom: 10 }}>
              {pct >= 80 ? '🏆' : pct >= 60 ? '🥇' : pct >= 40 ? '🥈' : '🥉'}
            </div>
            <h2 style={{ fontWeight: 900, fontSize: 26, marginBottom: 6, color: 'white' }}>Challenge Complete!</h2>
            <p style={{ opacity: .85, fontSize: 14 }}>You answered {total} questions in {Math.floor(timeTaken / 60)}m {timeTaken % 60}s</p>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Score',    value: `${correct}/${total}`,  emoji: '✅' },
              { label: 'Accuracy', value: `${pct}%`,              emoji: '🎯' },
              { label: 'Coins',    value: `${coins}`,             emoji: '🪙' },
            ].map(s => (
              <div key={s.label} style={{
                background: 'white', border: '3px solid #e8e0ff',
                borderRadius: 18, padding: '16px 12px', textAlign: 'center',
                boxShadow: '0 4px 0 #e8e0ff',
              }}>
                <div style={{ fontSize: '1.6rem', marginBottom: 4 }}>{s.emoji}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#7c3aed' }}>{s.value}</div>
                <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Breakdown by sublevel */}
          <div style={{ background: 'white', border: '3px solid #e8e0ff', borderRadius: 22, padding: '20px', marginBottom: 20, boxShadow: '0 4px 0 #e8e0ff' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
              Performance by Sublevel
            </div>
            {SUBLEVELS.map(sl => {
              const stat = byLevel[sl]
              if (!stat) return null
              const slPct = Math.round((stat.correct / stat.total) * 100)
              const style = SUBLEVEL_STYLE[sl]
              return (
                <div key={sl} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{
                    minWidth: 80, background: style.bg, color: style.color,
                    border: `2px solid ${style.border}`, borderRadius: 999,
                    padding: '3px 10px', fontSize: 12, fontWeight: 800, textAlign: 'center',
                  }}>{sl}</span>
                  <div style={{ flex: 1, height: 10, background: '#f3f4f6', borderRadius: 5, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${slPct}%`,
                      background: slPct >= 70 ? '#059669' : slPct >= 40 ? '#d97706' : '#dc2626',
                      borderRadius: 5, transition: 'width .6s ease',
                    }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', minWidth: 60, textAlign: 'right' }}>
                    {stat.correct}/{stat.total} ({slPct}%)
                  </span>
                </div>
              )
            })}
          </div>

          {/* Save status */}
          {saving && (
            <div style={{ textAlign: 'center', marginBottom: 14, fontSize: 13, color: '#7c3aed', fontWeight: 700 }}>
              💾 Saving your results…
            </div>
          )}
          {saved && (
            <div style={{ textAlign: 'center', marginBottom: 14, fontSize: 13, color: '#059669', fontWeight: 700 }}>
              ✅ Results saved! Your dashboard has been updated.
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => navigate('/student')}
              style={{
                flex: 1, padding: '14px', borderRadius: 16, border: 'none',
                background: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
                color: 'white', fontSize: 15, fontWeight: 900,
                cursor: 'pointer', fontFamily: "'Nunito',sans-serif",
                boxShadow: '0 5px 0 #5b21b6',
              }}
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                flex: 1, padding: '14px', borderRadius: 16,
                border: '3px solid #e8e0ff', background: 'white',
                color: '#7c3aed', fontSize: 15, fontWeight: 900,
                cursor: 'pointer', fontFamily: "'Nunito',sans-serif",
              }}
            >
              Try Again 🔄
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Loading ─────────────────────────────────────────────────
  if (loadingPool) {
    return (
      <div style={centerStyle}>
        <div style={{ fontSize: '2rem', marginBottom: 8 }}>⚡</div>
        <p style={{ fontWeight: 700, color: '#7c3aed' }}>Loading 50 challenge questions…</p>
      </div>
    )
  }

  if (poolError) {
    return (
      <div style={centerStyle}>
        <div style={{
          background: 'white', border: '3px solid #fde68a', borderRadius: 24,
          padding: '32px', maxWidth: 420, textAlign: 'center',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>⚠️</div>
          <p style={{ color: '#92400e', fontWeight: 700 }}>{poolError}</p>
          <button onClick={() => navigate('/student')} style={backBtnStyle}>
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (!q) return null

  const slStyle = SUBLEVEL_STYLE[q.sublevel] || SUBLEVEL_STYLE.Bronze
  const progress = Math.round(((qIndex) / TOTAL_QUESTIONS) * 100)

  // ── Main challenge UI ───────────────────────────────────────
  return (
    <div style={{ fontFamily: "'Nunito',sans-serif", minHeight: '100vh', background: '#f0f4ff', padding: '20px 16px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>

          {/* Challenge badge */}
          <div style={{
            background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
            color: 'white', borderRadius: 999,
            padding: '6px 16px', fontSize: 13, fontWeight: 800,
          }}>
            ⚡ Challenge Mode
          </div>

          {/* Timer */}
          <div style={{
            background: timeLeft < 300 ? '#fee2e2' : 'white',
            border: `2px solid ${timeLeft < 300 ? '#fca5a5' : '#e5e7eb'}`,
            borderRadius: 999, padding: '6px 16px', fontSize: 14, fontWeight: 900,
            color: timeLeft < 300 ? '#dc2626' : '#1e1b4b',
          }}>
            ⏱️ {fmt(timeLeft)}
          </div>

          {/* Score + coins */}
          <div style={{ background: 'white', border: '2px solid #e5e7eb', borderRadius: 999, padding: '6px 16px', fontSize: 13, fontWeight: 700, color: '#374151' }}>
            ✅ {answers.filter(a => a.isCorrect).length} · 🪙 {coins}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ background: 'white', border: '2px solid #e8e0ff', borderRadius: 12, padding: '10px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#7c3aed', whiteSpace: 'nowrap' }}>
            Q {qIndex + 1} / {questions.length}
          </span>
          <div style={{ flex: 1, height: 8, background: '#ede9fe', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${progress}%`,
              background: 'linear-gradient(90deg,#7c3aed,#a855f7)',
              borderRadius: 4, transition: 'width .3s ease',
            }} />
          </div>
          <span style={{
            background: slStyle.bg, color: slStyle.color,
            border: `2px solid ${slStyle.border}`, borderRadius: 999,
            padding: '2px 10px', fontSize: 11, fontWeight: 800,
          }}>
            {q.sublevel}
          </span>
        </div>

        {/* Question card */}
        <div style={{
          background: 'white', border: '3px solid #7c3aed', borderRadius: 24,
          padding: '28px 24px', marginBottom: 16, boxShadow: '0 6px 0 #7c3aed40',
        }}>

          {/* Topic + difficulty */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <span style={{ background: '#ede9fe', color: '#7c3aed', border: '2px solid #c4b5fd', borderRadius: 999, padding: '3px 12px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: .5 }}>
              {q.topic}
            </span>
            <span style={{ background: '#f3f4f6', color: '#6b7280', borderRadius: 999, padding: '3px 12px', fontSize: 11, fontWeight: 700 }}>
              {q.mainLevel} · Difficulty: {q.diffScore}/100
            </span>
          </div>

          {/* Question text */}
          <p style={{ fontSize: 'clamp(15px,2.5vw,18px)', fontWeight: 700, color: '#1e1b4b', lineHeight: 1.65, marginBottom: 20 }}>
            {q.question}
          </p>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {q.options.map((opt, i) => {
              const s = getOptionStyle(i, selected, answered, q.correct)
              return (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: s.bg, border: `2.5px solid ${s.border}`, borderRadius: 14,
                    padding: '13px 16px', cursor: answered ? 'default' : 'pointer',
                    transition: 'all .15s', fontFamily: "'Nunito',sans-serif",
                    textAlign: 'left', width: '100%',
                  }}
                >
                  <span style={{
                    width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                    background: s.circleBg, color: s.circleColor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 900, fontSize: 13,
                  }}>{s.circleLabel}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: s.color }}>{opt}</span>
                </button>
              )
            })}
          </div>

          {/* Hint (before answering) */}
          {q.hint && !answered && (
            <div style={{ marginBottom: 14 }}>
              {showHint ? (
                <div style={{ background: '#fef3c7', border: '2px solid #fde68a', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#92400e', fontWeight: 600, lineHeight: 1.6 }}>
                  💡 <strong>Hint:</strong> {q.hint}
                  <span style={{ fontSize: 11, color: '#d97706', marginLeft: 8 }}>(-5 coins)</span>
                </div>
              ) : (
                <button
                  onClick={() => setShowHint(true)}
                  style={{ background: '#fef3c7', border: '2px solid #fde68a', borderRadius: 12, padding: '9px 18px', fontSize: 13, fontWeight: 700, color: '#92400e', cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}
                >
                  💡 Show Hint (-5 coins)
                </button>
              )}
            </div>
          )}

          {/* After submit: Correct Answer + Explanation */}
          {answered && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>

              {/* Correct Answer */}
              <div style={{ background: '#d1fae5', border: '2px solid #059669', borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>✅</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#065f46', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4 }}>Correct Answer</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#065f46' }}>
                    {['A', 'B', 'C', 'D'][q.correct]}. {q.options[q.correct]}
                  </div>
                  {selected !== q.correct && (
                    <div style={{ fontSize: 12, color: '#dc2626', fontWeight: 600, marginTop: 4 }}>
                      You selected: {['A', 'B', 'C', 'D'][selected]}. {q.options[selected]}
                    </div>
                  )}
                </div>
              </div>

              {/* Explanation */}
              {q.explanation && (
                <div style={{ background: '#f5f3ff', border: '2px solid #c4b5fd', borderRadius: 14, padding: '16px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: '1.3rem' }}>📖</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#5b21b6', textTransform: 'uppercase', letterSpacing: .5 }}>Explanation</span>
                  </div>
                  <div style={{ fontSize: 14, color: '#3b1f6e', fontWeight: 600, lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                    {q.explanation}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submit / Next */}
          {!answered ? (
            <button
              onClick={handleSubmit}
              disabled={selected === null}
              style={{
                width: '100%', padding: '14px', borderRadius: 16, border: 'none',
                background: selected !== null ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : '#e5e7eb',
                color: selected !== null ? 'white' : '#9ca3af',
                fontSize: 15, fontWeight: 900,
                cursor: selected !== null ? 'pointer' : 'not-allowed',
                fontFamily: "'Nunito',sans-serif",
                boxShadow: selected !== null ? '0 4px 0 #1e40af' : 'none',
              }}
            >
              Submit Answer
            </button>
          ) : (
            <button
              onClick={handleNext}
              style={{
                width: '100%', padding: '14px', borderRadius: 16, border: 'none',
                background: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
                color: 'white', fontSize: 15, fontWeight: 900,
                cursor: 'pointer', fontFamily: "'Nunito',sans-serif",
                boxShadow: '0 4px 0 #5b21b6',
              }}
            >
              {qIndex + 1 >= questions.length ? 'See Results 🏆' : 'Next Question →'}
            </button>
          )}
        </div>

        {/* Quit */}
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <button
            onClick={() => { if (window.confirm('Quit challenge? Your progress will be lost.')) navigate('/student') }}
            style={{ background: '#fee2e2', border: '2px solid #fca5a5', borderRadius: 12, color: '#dc2626', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito',sans-serif", padding: '8px 20px' }}
          >
            🚪 Quit Challenge
          </button>
        </div>

      </div>
    </div>
  )
}

const centerStyle = {
  fontFamily: "'Nunito',sans-serif",
  minHeight: '100vh', background: '#f0f4ff',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexDirection: 'column', gap: 16, padding: 24,
}
const backBtnStyle = {
  marginTop: 16, padding: '12px 28px', borderRadius: 14, border: 'none',
  background: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
  color: 'white', fontSize: 14, fontWeight: 900,
  cursor: 'pointer', fontFamily: "'Nunito',sans-serif",
}