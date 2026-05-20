// src/pages/LevelPage.jsx
// ================================================================
//  Student picks Beginner / Intermediate / Advanced.
//  On "Start" → saves progress → navigates directly to
//  ExamInstructionPage. No AI call, no waiting, no sessionId.
//  Questions are already in the pool from the 30-min cron.
// ================================================================

import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../utils/supabaseClient'

const levels = [
  {
    id: 'beginner', emoji: '⭐', label: 'Beginner', sub: 'Just starting out',
    color: '#059669', pale: '#d1fae5', border: '#6ee7b7', shadow: '#6ee7b7',
    gradient: 'linear-gradient(135deg,#10b981,#059669)', badge: 'Recommended for starters',
    desc: 'Perfect if you are new to 11+ maths. Straightforward questions with full hints available.',
    features: [
      'Starts at Bronze sublevel',
      'Full hints always available',
      'Extra coins per correct answer',
      'Progress: Bronze → Silver → Gold → Platinum → Diamond',
    ],
    startSublevel: 'Bronze',
  },
  {
    id: 'intermediate', emoji: '⚡', label: 'Intermediate', sub: 'Some experience',
    color: '#d97706', pale: '#fef3c7', border: '#fde68a', shadow: '#fde68a',
    gradient: 'linear-gradient(135deg,#f59e0b,#d97706)', badge: 'Most popular',
    desc: 'For students who know the basics and want harder, multi-step problems.',
    features: [
      'Starts at Bronze sublevel (Intermediate tier)',
      'Hints available after attempt',
      'Higher coins per answer',
      'Difficulty adapts as you improve',
    ],
    startSublevel: 'Bronze',
  },
  {
    id: 'advanced', emoji: '🔥', label: 'Advanced', sub: 'Ready for the real thing',
    color: '#dc2626', pale: '#fee2e2', border: '#fca5a5', shadow: '#fca5a5',
    gradient: 'linear-gradient(135deg,#ef4444,#dc2626)', badge: 'Scholarship level',
    desc: 'Exam-standard scholarship questions for students aiming for top 11+ scores.',
    features: [
      'Starts at Bronze sublevel (Advanced tier)',
      'Scholarship-level questions',
      'Maximum coins and bonuses',
      'Full exam simulation',
    ],
    startSublevel: 'Bronze',
  },
]

export default function LevelPage() {
  const [selected, setSelected] = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const { user, fetchProfile }  = useAuth()
  const navigate = useNavigate()
  const { topicName } = useParams()

  const handleContinue = async () => {
    if (!selected || !user) return
    setLoading(true)
    setError('')

    try {
      // Save student's chosen level to Supabase
      await supabase.from('profiles').upsert({
        id:    user.id,
        email: user.email,
        role:  'student',
      })

      await supabase.from('student_progress').upsert(
        {
          student_id:    user.id,
          current_level: selected,
          total_points:  0,
          coins:         0,
          streak_count:  0,
          badges:        [],
        },
        { onConflict: 'student_id' }
      )

      if (fetchProfile) await fetchProfile(user.id)

      // Navigate directly to ExamInstructionPage — NO AI call, NO waiting
      // Questions are already pre-generated in the DB by the 30-min cron
      navigate(`/student/exam-instructions/${topicName}/${selected}`)

    } catch (err) {
      setError('Something went wrong. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const sel = levels.find(l => l.id === selected)

  return (
    <div style={{
      fontFamily: "'Nunito',sans-serif",
      minHeight: '100vh',
      background: '#f0f4ff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
    }}>
      <div style={{ width: '100%', maxWidth: 900 }}>

        {/* Back button */}
        <div style={{ marginBottom: 5, marginLeft: -160 }}>
          <button
            onClick={() => navigate(`/student/topic/${topicName}`)}
            style={{
              background: '#ede9fe', border: '2px solid #c4b5fd', borderRadius: 999,
              padding: '10px 22px', fontSize: 14, fontWeight: 800, color: '#7c3aed',
              cursor: 'pointer', fontFamily: "'Nunito',sans-serif",
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}
          >
            ← Back
          </button>
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            display: 'inline-block', background: 'white', border: '3px solid #e8e0ff',
            color: '#7c3aed', padding: '5px 18px', borderRadius: 999, fontSize: 12,
            fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14,
          }}>
            Step 2 of 2
          </div>
          <div style={{ fontSize: 'clamp(2rem,5vw,2.8rem)', fontWeight: 900, color: '#1e1b4b', marginBottom: 10 }}>
            Choose your starting level
          </div>
          <div style={{ fontSize: 14, color: '#9ca3af', fontWeight: 600, maxWidth: 500, margin: '0 auto' }}>
            You will start at <strong>Bronze</strong> and climb through{' '}
            <strong>Silver → Gold → Platinum → Diamond</strong> as you improve!
          </div>
        </div>

        {/* Level cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 28 }}>
          {levels.map(level => (
            <div
              key={level.id}
              onClick={() => setSelected(level.id)}
              style={{
                background: 'white',
                border: `3px solid ${selected === level.id ? level.color : level.border}`,
                borderRadius: 24, padding: '24px 20px', cursor: 'pointer', transition: 'all .25s',
                position: 'relative',
                boxShadow: selected === level.id
                  ? `0 8px 0 ${level.shadow}, 0 0 0 3px ${level.color}`
                  : `0 5px 0 ${level.shadow}`,
                transform: selected === level.id ? 'translateY(-6px)' : 'translateY(0)',
              }}
              onMouseEnter={e => { if (selected !== level.id) e.currentTarget.style.transform = 'translateY(-3px)' }}
              onMouseLeave={e => { if (selected !== level.id) e.currentTarget.style.transform = 'translateY(0)' }}
            >
              {selected === level.id && (
                <div style={{
                  position: 'absolute', top: 14, right: 14, width: 28, height: 28,
                  borderRadius: '50%', background: level.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: 14, fontWeight: 900,
                }}>✓</div>
              )}

              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{
                  width: 60, height: 60, borderRadius: 16, background: level.gradient,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.8rem', boxShadow: `0 4px 0 ${level.shadow}`,
                }}>
                  {level.emoji}
                </div>
                <span style={{
                  background: level.pale, color: level.color,
                  border: `2px solid ${level.border}`, padding: '3px 10px',
                  borderRadius: 999, fontSize: 10, fontWeight: 800,
                  textTransform: 'uppercase', letterSpacing: .5, marginTop: 4,
                }}>
                  {level.badge}
                </span>
              </div>

              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#1e1b4b', marginBottom: 3 }}>{level.label}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: level.color, textTransform: 'uppercase', letterSpacing: .8, marginBottom: 10 }}>{level.sub}</div>
              <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.65, marginBottom: 14 }}>{level.desc}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {level.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#4b5563', fontWeight: 600 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: level.color, flexShrink: 0 }} />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Sublevel visual guide */}
        <div style={{
          background: 'white', border: '2px solid #e8e0ff', borderRadius: 16,
          padding: '16px 20px', marginBottom: 20, textAlign: 'center',
        }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#7c3aed', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
            Your progress path within each level
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
            {[
              { name: 'Bronze',   color: '#cd7f32', bg: '#fdf3e7' },
              { name: 'Silver',   color: '#6b7280', bg: '#f3f4f6' },
              { name: 'Gold',     color: '#d97706', bg: '#fef3c7' },
              { name: 'Platinum', color: '#6366f1', bg: '#eef2ff' },
              { name: 'Diamond',  color: '#0ea5e9', bg: '#e0f2fe' },
            ].map((s, i) => (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  background: s.bg, color: s.color, border: `2px solid ${s.color}`,
                  borderRadius: 999, padding: '4px 14px', fontSize: 12, fontWeight: 800,
                }}>
                  {s.name}
                </div>
                {i < 4 && <span style={{ color: '#9ca3af', fontSize: 14, fontWeight: 700 }}>→</span>}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 8 }}>
            6% difficulty increase between each sublevel · 5 correct in a row = advance!
          </div>
        </div>

        {error && (
          <div style={{
            background: '#fee2e2', border: '2px solid #fca5a5', color: '#7f1d1d',
            padding: '10px 14px', borderRadius: 12, fontSize: 13, marginBottom: 16, textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        {/* Continue button */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <button
            onClick={handleContinue}
            disabled={!selected || loading}
            style={{
              width: '100%', maxWidth: 400, padding: '17px', borderRadius: 18, border: 'none',
              background: selected ? sel?.gradient : '#e5e7eb',
              color: selected ? 'white' : '#9ca3af',
              fontSize: 16, fontWeight: 900,
              cursor: selected && !loading ? 'pointer' : 'not-allowed',
              fontFamily: "'Nunito',sans-serif",
              boxShadow: selected ? `0 6px 0 ${sel?.shadow}` : 'none',
              transition: 'all .2s',
            }}
          >
            {loading
              ? 'Setting up…'
              : selected
                ? `Start as ${sel?.label} →`
                : 'Select a level to continue'}
          </button>

          <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', maxWidth: 380 }}>
            Get 5 correct in a row to advance to the next sublevel!
          </p>
        </div>
      </div>
    </div>
  )
}