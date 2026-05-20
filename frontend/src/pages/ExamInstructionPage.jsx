// src/pages/ExamInstructionPage.jsx
// ================================================================
//  Shown after student selects a level.
//  15-second countdown then auto-navigates to TestPage.
//  NO AI generation here — questions are already in the pool.
//  URL: /student/exam-instructions/:topicName/:difficulty
// ================================================================

import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const COUNTDOWN = 15

const rules = [
  { emoji: '✏️',  text: 'Have a pen, pencil and paper ready for working out.' },
  { emoji: '🚫',  text: 'Do NOT use a calculator — calculators are banned in the real 11+ exam.' },
  { emoji: '📵',  text: 'Put away all smart gadgets and phones during the test.' },
  { emoji: '🤫',  text: 'Sit in a quiet place with no distractions.' },
  { emoji: '⏱️',  text: 'You have 1 hour for the test — manage your time wisely.' },
  { emoji: '💡',  text: 'Hints are available but using one reduces your coin reward.' },
  { emoji: '🔄',  text: "If stuck, skip and come back — don't spend too long on one question." },
  { emoji: '✅',  text: 'Read every question carefully before selecting your answer.' },
  { emoji: '🥉',  text: 'You start at Bronze — get 5 correct in a row to climb to Silver, Gold, Platinum, Diamond!' },
]

// Sublevel colour badges
const SUBLEVEL_COLORS = {
  Bronze:   { color: '#cd7f32', bg: '#fdf3e7', border: '#e8a85a' },
  Silver:   { color: '#6b7280', bg: '#f3f4f6', border: '#9ca3af' },
  Gold:     { color: '#d97706', bg: '#fef3c7', border: '#fde68a' },
  Platinum: { color: '#6366f1', bg: '#eef2ff', border: '#a5b4fc' },
  Diamond:  { color: '#0ea5e9', bg: '#e0f2fe', border: '#7dd3fc' },
}

const SCHEME = {
  beginner:     { color: '#059669', colorLight: '#10b981', pale: '#d1fae5', border: '#6ee7b7' },
  intermediate: { color: '#d97706', colorLight: '#f59e0b', pale: '#fef3c7', border: '#fde68a' },
  advanced:     { color: '#dc2626', colorLight: '#ef4444', pale: '#fee2e2', border: '#fca5a5' },
  // legacy
  medium: { color: '#d97706', colorLight: '#f59e0b', pale: '#fef3c7', border: '#fde68a' },
  hard:   { color: '#dc2626', colorLight: '#ef4444', pale: '#fee2e2', border: '#fca5a5' },
}

export default function ExamInstructionPage() {
  const navigate = useNavigate()
  const { topicName, difficulty } = useParams()

  const [timeLeft, setTimeLeft] = useState(COUNTDOWN)
  const timerRef = useRef(null)

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          goToTest()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, []) // eslint-disable-line

  const goToTest = () => {
    navigate(`/student/test/${topicName}/${difficulty}`, { replace: true })
  }

  const scheme = SCHEME[difficulty] || SCHEME.beginner
  const pct = ((COUNTDOWN - timeLeft) / COUNTDOWN) * 100
  const urgent = timeLeft <= 5
  const timerColor = urgent ? '#dc2626' : scheme.color

  // Determine start sublevel display
  const startSublevel = 'Bronze'
  const sublevelStyle = SUBLEVEL_COLORS[startSublevel]

  return (
    <div style={{
      fontFamily: "'Nunito', sans-serif",
      minHeight: '100vh',
      background: '#f0f4ff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '30px 16px',
    }}>
      <div style={{ width: '100%', maxWidth: 680 }}>

        {/* Header card */}
        <div style={{
          background: 'white',
          border: `3px solid ${scheme.border}`,
          borderRadius: 28,
          padding: '32px 28px 24px',
          marginBottom: 18,
          boxShadow: `0 8px 0 ${scheme.border}`,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: 10 }}>📋</div>
          <h1 style={{ fontSize: 'clamp(1.5rem,4vw,2.2rem)', fontWeight: 900, color: '#1e1b4b', margin: '0 0 6px' }}>
            Before You Begin…
          </h1>
          <p style={{ fontSize: 14, color: '#6b7280', fontWeight: 600, margin: '0 0 4px' }}>
            Your test starts automatically in:
          </p>

          {/* Starting sublevel badge */}
          <div style={{ marginBottom: 12 }}>
            <span style={{
              display: 'inline-block',
              background: sublevelStyle.bg,
              color: sublevelStyle.color,
              border: `2px solid ${sublevelStyle.border}`,
              borderRadius: 999,
              padding: '4px 16px',
              fontSize: 13,
              fontWeight: 800,
            }}>
              Starting at: Bronze
            </span>
          </div>

          {/* Big countdown timer */}
          <div style={{
            margin: '16px auto 6px',
            width: 130,
            height: 130,
            borderRadius: '50%',
            background: urgent ? '#fee2e2' : scheme.pale,
            border: `6px solid ${timerColor}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: urgent
              ? `0 0 0 6px #fca5a580, 0 6px 0 ${timerColor}`
              : `0 6px 0 ${scheme.border}`,
            transition: 'all 0.4s ease',
            animation: urgent ? 'urgentPulse 0.6s ease-in-out infinite' : 'none',
          }}>
            <span style={{
              fontSize: '3.2rem',
              fontWeight: 900,
              color: timerColor,
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
              transition: 'color 0.3s',
            }}>
              {timeLeft}
            </span>
            <span style={{ fontSize: 11, fontWeight: 800, color: timerColor, textTransform: 'uppercase', letterSpacing: 1 }}>
              seconds
            </span>
          </div>

          {/* Progress bar */}
          <div style={{ width: '80%', maxWidth: 300, height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden', margin: '12px auto 0' }}>
            <div style={{
              height: '100%',
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${scheme.color}, ${scheme.colorLight})`,
              borderRadius: 4,
              transition: 'width 0.9s linear',
            }} />
          </div>

          <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 10, marginBottom: 0 }}>
            Questions are ready and waiting for you ✨
          </p>
        </div>

        {/* Rules card */}
        <div style={{
          background: 'white',
          border: '3px solid #e8e0ff',
          borderRadius: 24,
          padding: '24px 24px 20px',
          marginBottom: 18,
          boxShadow: '0 6px 0 #e8e0ff',
        }}>
          <div style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: '#7c3aed', marginBottom: 16 }}>
            📜 Exam Rules
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rules.map((rule, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '10px 14px',
                background: '#f8f7ff',
                borderRadius: 12,
                border: '2px solid #ede9fe',
              }}>
                <span style={{ fontSize: '1.2rem', flexShrink: 0, lineHeight: 1.4 }}>{rule.emoji}</span>
                <span style={{ fontSize: 13, color: '#374151', fontWeight: 600, lineHeight: 1.55 }}>{rule.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Start now button */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={goToTest}
            style={{
              padding: '14px 40px',
              borderRadius: 18,
              border: 'none',
              background: scheme.color,
              color: 'white',
              fontSize: 16,
              fontWeight: 900,
              cursor: 'pointer',
              fontFamily: "'Nunito', sans-serif",
              boxShadow: `0 5px 0 ${scheme.border}`,
              marginBottom: 10,
            }}
          >
            I'm Ready — Start Now!
          </button>
          <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>
            Or wait {timeLeft} second{timeLeft !== 1 ? 's' : ''} and it starts automatically
          </p>
        </div>
      </div>

      <style>{`
        @keyframes urgentPulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.05); }
        }
      `}</style>
    </div>
  )
}