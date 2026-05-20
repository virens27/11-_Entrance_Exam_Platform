// src/pages/TestPage.jsx
// ================================================================
//  FIXED: Now saves results to Supabase after test completion
//  and updates student_progress (coins, points, stars, streak).
//
//  Changes from original:
//  1. Import supabase client
//  2. Added saveResultAndUpdateProgress() — called when test ends
//     (either by sessionComplete or timer running out)
//  3. useEffect for `finished` triggers the save (only once)
//  4. UI finish screen now shows a "Saving…" state
// ================================================================

import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useQuestionSession } from '../hooks/useQuestionSession.js'
import { supabase } from '../utils/supabaseClient'   // ← NEW

const TOTAL_TIME = 60 * 60

const SUBLEVEL_STYLE = {
  Bronze:   { color: '#cd7f32', bg: '#fdf3e7', border: '#e8a85a' },
  Silver:   { color: '#6b7280', bg: '#f3f4f6', border: '#9ca3af' },
  Gold:     { color: '#d97706', bg: '#fef3c7', border: '#fde68a' },
  Platinum: { color: '#6366f1', bg: '#eef2ff', border: '#a5b4fc' },
  Diamond:  { color: '#0ea5e9', bg: '#e0f2fe', border: '#7dd3fc' },
}

const LEVEL_COLOR = {
  beginner:     '#059669',
  intermediate: '#d97706',
  advanced:     '#dc2626',
  medium:       '#d97706',
  hard:         '#dc2626',
}

const LEVEL_PALE = {
  beginner:     '#d1fae5',
  intermediate: '#fef3c7',
  advanced:     '#fee2e2',
  medium:       '#fef3c7',
  hard:         '#fee2e2',
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

const fmt = s => {
  const h   = Math.floor(s / 3600)
  const m   = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    : `${m}:${String(sec).padStart(2, '0')}`
}

function getOptionStyle(i, selected, answered, correct) {
  if (answered) {
    if (i === correct)
      return { bg: '#d1fae5', border: '#059669', color: '#065f46', circleBg: '#059669', circleColor: 'white', circleLabel: '✓' }
    if (i === selected && i !== correct)
      return { bg: '#fee2e2', border: '#dc2626', color: '#7f1d1d', circleBg: '#dc2626', circleColor: 'white', circleLabel: '✗' }
    return { bg: 'white', border: '#e5e7eb', color: '#1e1b4b', circleBg: '#f3f4f6', circleColor: '#6b7280', circleLabel: ['A','B','C','D'][i] }
  }
  if (i === selected)
    return { bg: '#eff6ff', border: '#2563eb', color: '#1d4ed8', circleBg: '#2563eb', circleColor: 'white', circleLabel: ['A','B','C','D'][i] }
  return { bg: 'white', border: '#e5e7eb', color: '#1e1b4b', circleBg: '#f3f4f6', circleColor: '#6b7280', circleLabel: ['A','B','C','D'][i] }
}

export default function TestPage() {
  const { topicName, difficulty } = useParams()
  const { user }    = useAuth()
  const navigate    = useNavigate()

  const {
    question: rawQuestion,
    loadingQuestion,
    poolEmpty,
    sessionComplete,
    levelUpInfo,
    sessionStats,
    markAnswered,
    fetchNextQuestion,
  } = useQuestionSession(difficulty, topicName, user)

  const q = mapQuestion(rawQuestion)

  const [selected,       setSelected]       = useState(null)
  const [answered,       setAnswered]       = useState(false)
  const [showHint,       setShowHint]       = useState(false)
  const [coins,          setCoins]          = useState(0)
  const [timeLeft,       setTimeLeft]       = useState(TOTAL_TIME)
  const [finished,       setFinished]       = useState(false)
  const [answers,        setAnswers]        = useState([])
  const [readyForNext,   setReadyForNext]   = useState(false)
  // ── NEW: track save status for UI feedback ─────────────────────
  const [saving,         setSaving]         = useState(false)
  const [saved,          setSaved]          = useState(false)

  const timerRef    = useRef(null)
  const finishedRef = useRef(false)
  const coinsRef    = useRef(0)          // ← NEW: mirror coins in a ref so save can read it
  const answersRef  = useRef([])         // ← NEW: mirror answers in a ref

  // Keep refs in sync with state
  useEffect(() => { coinsRef.current  = coins  }, [coins])
  useEffect(() => { answersRef.current = answers }, [answers])

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

  useEffect(() => {
    if (sessionComplete && !finishedRef.current) {
      finishedRef.current = true
      setFinished(true)
    }
  }, [sessionComplete])

  // ── NEW: save to DB whenever finished flips to true ────────────
  useEffect(() => {
    if (finished && user) {
      saveResultAndUpdateProgress()
    }
  }, [finished]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset UI when a brand new question loads
  useEffect(() => {
    if (rawQuestion) {
      setSelected(null)
      setAnswered(false)
      setShowHint(false)
      setReadyForNext(false)
    }
  }, [rawQuestion?.id])

  // ─────────────────────────────────────────────────────────────
  //  NEW: Save result row + upsert student_progress
  // ─────────────────────────────────────────────────────────────
  async function saveResultAndUpdateProgress() {
    if (!user) return
    setSaving(true)

    const finalAnswers = answersRef.current
    const finalCoins   = coinsRef.current
    const totalQ       = finalAnswers.length
    const correct      = finalAnswers.filter(a => a.isCorrect).length
    const timeTaken    = TOTAL_TIME - timeLeft  // seconds actually spent

    const sublevelReached = sessionStats?.sublevel || 'Bronze'
    const mainLevel       = sessionStats?.mainLevel || difficulty || 'Beginner'

    try {
      // 1. Insert into results table
      await supabase.from('results').insert({
        student_id:       user.id,
        topic:            topicName || null,
        main_level:       mainLevel,
        sublevel_reached: sublevelReached,
        score:            correct,
        total_questions:  totalQ,
        time_taken_secs:  timeTaken,
        coins_earned:     finalCoins,
        completed_at:     new Date().toISOString(),
      })

      // 2. Read existing student_progress
      const { data: prog } = await supabase
        .from('student_progress')
        .select('*')
        .eq('student_id', user.id)
        .maybeSingle()

      // Stars: 1 star per correct answer (can tune this)
      const starsEarned = correct

      if (prog) {
        // Update existing row
        await supabase.from('student_progress').update({
          total_points:  (prog.total_points  || 0) + correct,
          coins:         (prog.coins         || 0) + finalCoins,
          stars:         (prog.stars         || 0) + starsEarned,
          current_level: difficulty || prog.current_level || 'beginner',
          last_active:   new Date().toISOString(),
          // Streak: increment if last_active was yesterday, else reset to 1
          streak_count:  calcStreak(prog.last_active, prog.streak_count || 0),
        }).eq('student_id', user.id)
      } else {
        // Create new row
        await supabase.from('student_progress').insert({
          student_id:    user.id,
          total_points:  correct,
          coins:         finalCoins,
          stars:         starsEarned,
          current_level: difficulty || 'beginner',
          streak_count:  1,
          last_active:   new Date().toISOString(),
        })
      }

      setSaved(true)
    } catch (err) {
      console.error('[TestPage] Failed to save result:', err)
      // Don't block the UI — just log
    } finally {
      setSaving(false)
    }
  }

  // Returns new streak count based on last active date
  function calcStreak(lastActiveISO, currentStreak) {
    if (!lastActiveISO) return 1
    const last    = new Date(lastActiveISO)
    const now     = new Date()
    const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24))
    if (diffDays === 1) return currentStreak + 1  // consecutive day
    if (diffDays === 0) return currentStreak       // same day — no change
    return 1                                        // gap — reset
  }

  const handleSelect = (i) => { if (!answered) setSelected(i) }

  const handleSubmit = async () => {
    if (selected === null || answered || !q) return
    setAnswered(true)

    const isCorrect = selected === q.correct
    const coinDelta = isCorrect ? (showHint ? 5 : 10) : 0
    setCoins(c => c + coinDelta)
    setAnswers(prev => [...prev, {
      question: q.question, selected, correct: q.correct, isCorrect, sublevel: q.sublevel,
    }])

    await markAnswered(isCorrect)
    setReadyForNext(true)
  }

  const handleNext = () => {
    if (!readyForNext) return
    fetchNextQuestion()
  }

  // ── Finished screen ───────────────────────────────────────────
  if (finished) {
    const total   = answers.length
    const correct = answers.filter(a => a.isCorrect).length
    const pct     = total > 0 ? Math.round((correct / total) * 100) : 0

    return (
      <div style={centerStyle}>
        <div style={{
          background: 'white', border: '3px solid #e8e0ff', borderRadius: 28,
          padding: '40px 32px', maxWidth: 480, width: '100%', textAlign: 'center',
          boxShadow: '0 8px 0 #e8e0ff',
        }}>
          <div style={{ fontSize: '4rem', marginBottom: 10 }}>
            {pct >= 80 ? '🏆' : pct >= 50 ? '⭐' : '💪'}
          </div>
          <h2 style={{ fontWeight: 900, color: '#1e1b4b', fontSize: 24, marginBottom: 6 }}>Test Complete!</h2>
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 20 }}>
            Sublevel reached:{' '}
            <strong style={{ color: SUBLEVEL_STYLE[sessionStats?.sublevel]?.color }}>
              {sessionStats?.mainLevel} — {sessionStats?.sublevel}
            </strong>
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 24 }}>
            {[
              { label: 'Score',    value: `${correct} / ${total}` },
              { label: 'Accuracy', value: `${pct}%` },
              { label: 'Coins',    value: `🪙 ${coins}` },
            ].map(s => (
              <div key={s.label} style={{
                background: '#f8f7ff', border: '2px solid #e8e0ff', borderRadius: 14,
                padding: '12px 18px', textAlign: 'center', minWidth: 90,
              }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#7c3aed' }}>{s.value}</div>
                <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* ── NEW: Save status indicator ── */}
          {saving && (
            <div style={{ marginBottom: 16, fontSize: 13, color: '#7c3aed', fontWeight: 700 }}>
              💾 Saving your results…
            </div>
          )}
          {saved && (
            <div style={{ marginBottom: 16, fontSize: 13, color: '#059669', fontWeight: 700 }}>
              ✅ Results saved! Your dashboard has been updated.
            </div>
          )}

          <button
            onClick={() => navigate('/student')}
            style={{
              padding: '14px 32px', borderRadius: 16, border: 'none',
              background: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
              color: 'white', fontSize: 15, fontWeight: 900,
              cursor: 'pointer', fontFamily: "'Nunito',sans-serif",
              boxShadow: '0 5px 0 #5b21b6',
            }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const lc = LEVEL_COLOR[difficulty] || '#7c3aed'
  const lp = LEVEL_PALE[difficulty]  || '#ede9fe'
  const sublevelStyle = SUBLEVEL_STYLE[sessionStats?.sublevel] || SUBLEVEL_STYLE.Bronze

  if (poolEmpty) {
    return (
      <div style={centerStyle}>
        <div style={{
          background: 'white', border: '3px solid #fde68a', borderRadius: 24,
          padding: '32px', maxWidth: 420, textAlign: 'center', boxShadow: '0 6px 0 #fde68a',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>⏳</div>
          <h3 style={{ fontWeight: 900, color: '#1e1b4b', marginBottom: 8 }}>Fetching questions…</h3>
          <p style={{ color: '#6b7280', fontSize: 14 }}>
            The question pool is being refreshed. Please wait a moment and refresh the page.
          </p>
        </div>
      </div>
    )
  }

  if (loadingQuestion && !q) {
    return (
      <div style={centerStyle}>
        <div style={{ fontSize: '2rem', marginBottom: 8 }}>⚡</div>
        <p style={{ fontWeight: 700, color: '#7c3aed' }}>Loading your first question…</p>
      </div>
    )
  }

  return (
    <div style={{
      fontFamily: "'Nunito',sans-serif",
      minHeight: '100vh',
      background: '#f0f4ff',
      padding: '20px 16px',
    }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* Top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 16, flexWrap: 'wrap', gap: 8,
        }}>
          <div style={{
            background: sublevelStyle.bg, color: sublevelStyle.color,
            border: `2px solid ${sublevelStyle.border}`, borderRadius: 999,
            padding: '6px 16px', fontSize: 13, fontWeight: 800,
          }}>
            {sessionStats?.mainLevel} — {sessionStats?.sublevel}
          </div>

          <div style={{
            background: timeLeft < 300 ? '#fee2e2' : 'white',
            border: `2px solid ${timeLeft < 300 ? '#fca5a5' : '#e5e7eb'}`,
            borderRadius: 999, padding: '6px 16px', fontSize: 14, fontWeight: 900,
            color: timeLeft < 300 ? '#dc2626' : '#1e1b4b',
          }}>
            ⏱️ {fmt(timeLeft)}
          </div>

          <div style={{
            background: 'white', border: '2px solid #e5e7eb',
            borderRadius: 999, padding: '6px 16px', fontSize: 13, fontWeight: 700, color: '#374151',
          }}>
            ✅ {sessionStats?.score} · 🪙 {coins}
          </div>
        </div>

        {/* Streak bar */}
        {sessionStats?.levelStreak > 0 && (
          <div style={{
            background: 'white', border: '2px solid #fde68a', borderRadius: 12,
            padding: '8px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#d97706' }}>
              🔥 Streak: {sessionStats.levelStreak} / 5 correct in a row to advance!
            </span>
            <div style={{ flex: 1, height: 6, background: '#fef3c7', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${(sessionStats.levelStreak / 5) * 100}%`,
                background: '#f59e0b', borderRadius: 3, transition: 'width .4s ease',
              }} />
            </div>
          </div>
        )}

        {/* Level up notification */}
        {levelUpInfo?.active && (
          <div style={{
            background: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
            borderRadius: 16, padding: '16px 20px', marginBottom: 16,
            textAlign: 'center', color: 'white',
            boxShadow: '0 6px 0 #5b21b6',
            animation: 'fadeIn .3s ease',
          }}>
            <div style={{ fontSize: '1.8rem', marginBottom: 4 }}>🎉</div>
            <div style={{ fontSize: 16, fontWeight: 900 }}>
              Level Up! You reached{' '}
              <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 10px', borderRadius: 999 }}>
                {levelUpInfo.newMainLevel} — {levelUpInfo.newSublevel}
              </span>
            </div>
            <div style={{ fontSize: 12, opacity: .85, marginTop: 4 }}>
              {levelUpInfo.reason === 'streak' ? '5 correct answers in a row — amazing!' : 'Sublevel complete — keep going!'}
            </div>
          </div>
        )}

        {/* Question card */}
        {q && (
          <div style={{
            background: 'white', border: `3px solid ${lc}`, borderRadius: 24,
            padding: '28px 24px', marginBottom: 16, boxShadow: `0 6px 0 ${lc}40`,
          }}>

            {/* Topic + difficulty */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <span style={{
                background: lp, color: lc, border: `2px solid ${lc}40`,
                borderRadius: 999, padding: '3px 12px', fontSize: 11, fontWeight: 800,
                textTransform: 'uppercase', letterSpacing: .5,
              }}>
                {q.topic}
              </span>
              <span style={{
                background: '#f3f4f6', color: '#6b7280',
                borderRadius: 999, padding: '3px 12px', fontSize: 11, fontWeight: 700,
              }}>
                Difficulty: {q.diffScore}/100
              </span>
            </div>

            {/* Question text */}
            <p style={{
              fontSize: 'clamp(15px,2.5vw,18px)', fontWeight: 700,
              color: '#1e1b4b', lineHeight: 1.65, marginBottom: 20,
            }}>
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
                    }}>
                      {s.circleLabel}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: s.color }}>{opt}</span>
                  </button>
                )
              })}
            </div>

            {/* Hint — only before answering */}
            {q.hint && !answered && (
              <div style={{ marginBottom: 14 }}>
                {showHint ? (
                  <div style={{
                    background: '#fef3c7', border: '2px solid #fde68a',
                    borderRadius: 12, padding: '12px 16px',
                    fontSize: 13, color: '#92400e', fontWeight: 600, lineHeight: 1.6,
                  }}>
                    💡 <strong>Hint:</strong> {q.hint}
                    <span style={{ fontSize: 11, color: '#d97706', marginLeft: 8 }}>(-5 coins)</span>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowHint(true)}
                    style={{
                      background: '#fef3c7', border: '2px solid #fde68a', borderRadius: 12,
                      padding: '9px 18px', fontSize: 13, fontWeight: 700, color: '#92400e',
                      cursor: 'pointer', fontFamily: "'Nunito',sans-serif",
                    }}
                  >
                    💡 Show Hint (-5 coins)
                  </button>
                )}
              </div>
            )}

            {/* After submit: Correct Answer + Explanation */}
            {answered && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>

                {/* Correct Answer */}
                <div style={{
                  background: '#d1fae5', border: '2px solid #059669',
                  borderRadius: 14, padding: '14px 18px',
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                }}>
                  <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>✅</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#065f46', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4 }}>
                      Correct Answer
                    </div>
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
                  <div style={{
                    background: '#f5f3ff', border: '2px solid #c4b5fd',
                    borderRadius: 14, padding: '16px 18px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span style={{ fontSize: '1.3rem' }}>📖</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#5b21b6', textTransform: 'uppercase', letterSpacing: .5 }}>
                        Explanation
                      </span>
                    </div>
                    <div style={{
                      fontSize: 14, color: '#3b1f6e', fontWeight: 600,
                      lineHeight: 1.9, whiteSpace: 'pre-line',
                    }}>
                      {q.explanation}
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* Buttons */}
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
                  transition: 'all .2s',
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
                  marginTop: 4,
                }}
              >
                Next Question →
              </button>
            )}
          </div>
        )}

        {/* Quit button */}
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <button
            onClick={() => {
              if (window.confirm('Quit test? Your progress will be lost.')) navigate('/student')
            }}
            style={{
              background: '#fee2e2', border: '2px solid #fca5a5', borderRadius: 12,
              color: '#dc2626', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', fontFamily: "'Nunito',sans-serif", padding: '8px 20px',
            }}
          >
            🚪 Quit Test
          </button>
        </div>

      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

const centerStyle = {
  fontFamily: "'Nunito',sans-serif",
  minHeight: '100vh', background: '#f0f4ff',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexDirection: 'column', gap: 16, padding: 24,
}