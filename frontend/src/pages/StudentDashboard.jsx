// src/pages/StudentDashboard.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../utils/supabaseClient'

const topics = [
  { id: 'number',   name: 'Number & Arithmetic',  desc: 'Fractions, decimals, percentages', icon: '🔢', color: '#7c3aed', pale: '#ede9fe', border: '#c4b5fd' },
  { id: 'algebra',  name: 'Algebra & Logic',       desc: 'Equations, word problems',         icon: '📐', color: '#0891b2', pale: '#e0f2fe', border: '#7dd3fc' },
  { id: 'geometry', name: 'Geometry & Measure',    desc: 'Area, volume, shapes',             icon: '📏', color: '#059669', pale: '#d1fae5', border: '#6ee7b7' },
  { id: 'data',     name: 'Data & Probability',    desc: 'Averages, ratios, charts',         icon: '📊', color: '#d97706', pale: '#fef3c7', border: '#fde68a' },
  { id: 'patterns', name: 'Pattern Recognition',   desc: 'Sequences and puzzles',            icon: '🧩', color: '#db2777', pale: '#fce7f3', border: '#f9a8d4' },
]

const SUBLEVEL_STYLE = {
  Bronze:   { color: '#cd7f32', bg: '#fdf3e7', border: '#e8a85a' },
  Silver:   { color: '#6b7280', bg: '#f3f4f6', border: '#9ca3af' },
  Gold:     { color: '#d97706', bg: '#fef3c7', border: '#fde68a' },
  Platinum: { color: '#6366f1', bg: '#eef2ff', border: '#a5b4fc' },
  Diamond:  { color: '#0ea5e9', bg: '#e0f2fe', border: '#7dd3fc' },
}

function fmtDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function StudentDashboard() {
  const { user, profile, logout } = useAuth()
  const navigate = useNavigate()

  const [progress,    setProgress]    = useState(null)
  const [results,     setResults]     = useState([])
  const [activeTab,   setActiveTab]   = useState('home')
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    if (user) { fetchAll() }
  }, [user])

  async function fetchAll() {
    setLoading(true)
    const [{ data: prog }, { data: res }] = await Promise.all([
      supabase.from('student_progress').select('*').eq('student_id', user.id).maybeSingle(),
      supabase.from('results').select('*').eq('student_id', user.id).order('completed_at', { ascending: false }).limit(30),
    ])
    setProgress(prog)
    setResults(res || [])
    setLoading(false)
  }

  async function handleLogout() { await logout(); navigate('/') }

  const firstName = profile?.display_name?.split(' ')[0] || profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Student'
  const level     = progress?.current_level || 'beginner'
  const points    = progress?.total_points  || 0
  const coins     = progress?.coins         || 0
  const streak    = progress?.streak_count  || 0

  // Derived stats
  const totalTests   = results.length
  const totalCorrect = results.reduce((a, r) => a + (r.score || 0), 0)
  const totalQ       = results.reduce((a, r) => a + (r.total_questions || 0), 0)
  const accuracy     = totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : 0

  // Per-topic accuracy
  const topicStats = topics.map(t => {
    const tr = results.filter(r => r.topic === t.id)
    const tc = tr.reduce((a, r) => a + (r.score || 0), 0)
    const tq = tr.reduce((a, r) => a + (r.total_questions || 0), 0)
    return { ...t, sessions: tr.length, correct: tc, total: tq, pct: tq > 0 ? Math.round((tc / tq) * 100) : null }
  })

  // Recent 7 results for mini chart
  const chartData = [...results].reverse().slice(-7)

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4ff', fontFamily: "'Nunito',sans-serif" }}>

      {/* Navbar */}
      <nav style={{ background: 'white', borderBottom: '3px solid #e8e0ff', padding: '0 20px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#7c3aed' }}>11+ Prep</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#fef3c7', border: '2px solid #fde68a', padding: '5px 11px', borderRadius: 999, fontSize: 13, fontWeight: 800, color: '#92400e' }}>★ {points}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#e0f2fe', border: '2px solid #7dd3fc', padding: '5px 11px', borderRadius: 999, fontSize: 13, fontWeight: 800, color: '#075985' }}>🪙 {coins}</div>
          {streak > 0 && <div style={{ background: '#fff7ed', border: '2px solid #fed7aa', padding: '5px 11px', borderRadius: 999, fontSize: 13, fontWeight: 800, color: '#c2410c' }}>🔥 {streak}</div>}
          <button onClick={() => navigate('/student/rewards')} style={{ background: '#fef3c7', border: '2px solid #fde68a', color: '#92400e', padding: '6px 13px', borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>🏆 Rewards</button>
          <button onClick={handleLogout} style={{ background: 'white', border: '2px solid #e5e7eb', color: '#9ca3af', padding: '6px 13px', borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>Logout</button>
        </div>
      </nav>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px 16px 80px' }}>

        {/* Tabs */}
        <div style={{ display: 'flex', background: 'white', border: '3px solid #e8e0ff', borderRadius: 16, padding: 4, marginBottom: 20, gap: 4, width: 'fit-content' }}>
          {[['home','🏠 Home'], ['progress','📈 My Progress'], ['history','📋 History']].map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '8px 18px', borderRadius: 12, border: 'none', fontSize: 13, fontWeight: 800,
              cursor: 'pointer', fontFamily: "'Nunito',sans-serif", transition: 'all .2s',
              background: activeTab === tab ? '#7c3aed' : 'transparent',
              color: activeTab === tab ? 'white' : '#9ca3af',
              boxShadow: activeTab === tab ? '0 3px 0 #5b21b6' : 'none',
            }}>{label}</button>
          ))}
        </div>

        {/* ── HOME TAB ── */}
        {activeTab === 'home' && (
          <>
            {/* Welcome */}
            <div style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', borderRadius: 24, padding: '22px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 6px 0 #5b21b6' }}>
              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'white', marginBottom: 4 }}>Good day, {firstName}! 👋</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
                  {streak > 0 ? `You're on a ${streak}-day streak — keep it up!` : 'Ready to practise today?'}
                </div>
              </div>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.2)', border: '3px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>🎓</div>
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
              {[
                { label: 'Points',   value: points,   bg: '#fef3c7', border: '#fde68a', color: '#92400e', icon: '★' },
                { label: 'Accuracy', value: `${accuracy}%`, bg: '#d1fae5', border: '#6ee7b7', color: '#065f46', icon: '🎯' },
                { label: 'Tests',    value: totalTests, bg: '#ede9fe', border: '#c4b5fd', color: '#5b21b6', icon: '📝' },
              ].map(s => (
                <div key={s.label} style={{ background: s.bg, border: `3px solid ${s.border}`, borderRadius: 18, padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{s.icon}</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: s.color, opacity: .7, textTransform: 'uppercase', letterSpacing: .5 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Topics */}
            <div style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: '#7c3aed', marginBottom: 12 }}>Choose a topic</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {topics.map(t => (
                <div key={t.id} onClick={() => navigate(`/student/topic/${t.id}`)}
                  style={{ background: 'white', border: `3px solid ${t.border}`, borderRadius: 20, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', transition: 'all .2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = t.pale; e.currentTarget.style.transform = 'translateX(5px)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.transform = 'translateX(0)' }}
                >
                  <div style={{ width: 46, height: 46, borderRadius: 14, background: t.pale, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>{t.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#1e1b4b' }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{t.desc}</div>
                  </div>
                  <div style={{ fontSize: 22, color: t.color, fontWeight: 900 }}>›</div>
                </div>
              ))}
            </div>

            {/* Recent results */}
            {results.length > 0 && (
              <>
                <div style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: '#7c3aed', marginBottom: 12 }}>Recent Activity</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {results.slice(0, 5).map((r, i) => {
                    const pct = r.total_questions > 0 ? Math.round((r.score / r.total_questions) * 100) : 0
                    const sl  = SUBLEVEL_STYLE[r.sublevel_reached] || SUBLEVEL_STYLE.Bronze
                    return (
                      <div key={i} style={{ background: 'white', border: '3px solid #e8e0ff', borderRadius: 16, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 12, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
                          {topics.find(t => t.id === r.topic)?.icon || '📝'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: '#1e1b4b', textTransform: 'capitalize' }}>{r.topic || 'All topics'}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                            <span style={{ background: sl.bg, color: sl.color, border: `1.5px solid ${sl.border}`, borderRadius: 999, padding: '1px 8px', fontSize: 10, fontWeight: 800 }}>{r.sublevel_reached}</span>
                            <span style={{ fontSize: 11, color: '#9ca3af' }}>{fmtDate(r.completed_at)}</span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 14, fontWeight: 900, color: pct >= 60 ? '#059669' : '#dc2626' }}>{r.score}/{r.total_questions}</div>
                          <div style={{ fontSize: 11, color: '#9ca3af' }}>{pct}%</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </>
        )}

        {/* ── PROGRESS TAB ── */}
        {activeTab === 'progress' && (
          <>
            <div style={{ background: 'white', border: '3px solid #e8e0ff', borderRadius: 22, padding: '22px', marginBottom: 20, boxShadow: '0 4px 0 #e8e0ff' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#1e1b4b', marginBottom: 16 }}>📊 Overall Performance</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'Tests Taken',  value: totalTests,    color: '#7c3aed', bg: '#ede9fe', border: '#c4b5fd' },
                  { label: 'Overall Accuracy', value: `${accuracy}%`, color: '#059669', bg: '#d1fae5', border: '#6ee7b7' },
                  { label: 'Total Correct', value: `${totalCorrect}/${totalQ}`, color: '#0891b2', bg: '#e0f2fe', border: '#7dd3fc' },
                ].map(s => (
                  <div key={s.label} style={{ background: s.bg, border: `2px solid ${s.border}`, borderRadius: 16, padding: '14px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: s.color, opacity: .7, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .4, marginTop: 3 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Mini bar chart of last 7 results */}
              {chartData.length > 0 && (
                <>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 10 }}>Last {chartData.length} results</div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
                    {chartData.map((r, i) => {
                      const pct = r.total_questions > 0 ? Math.round((r.score / r.total_questions) * 100) : 0
                      return (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: pct >= 60 ? '#059669' : '#dc2626' }}>{pct}%</div>
                          <div style={{ width: '100%', height: `${Math.max(pct * 0.55, 6)}px`, background: pct >= 60 ? '#10b981' : '#ef4444', borderRadius: '4px 4px 0 0', transition: 'height .5s ease' }} />
                          <div style={{ fontSize: 9, color: '#9ca3af', textTransform: 'capitalize', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{r.topic}</div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Per-topic breakdown */}
            <div style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: '#7c3aed', marginBottom: 12 }}>Topic Breakdown</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {topicStats.map(t => (
                <div key={t.id} style={{ background: 'white', border: `3px solid ${t.border}`, borderRadius: 18, padding: '16px 18px', boxShadow: `0 3px 0 ${t.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: '1.3rem' }}>{t.icon}</span>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#1e1b4b' }}>{t.name}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>{t.sessions} test{t.sessions !== 1 ? 's' : ''} taken</div>
                      </div>
                    </div>
                    {t.pct !== null ? (
                      <div style={{ fontSize: 20, fontWeight: 900, color: t.pct >= 70 ? '#059669' : t.pct >= 50 ? '#d97706' : '#dc2626' }}>{t.pct}%</div>
                    ) : (
                      <span style={{ fontSize: 12, color: '#d1d5db', fontStyle: 'italic' }}>Not attempted</span>
                    )}
                  </div>
                  {t.pct !== null && (
                    <>
                      <div style={{ height: 10, background: '#f3f4f6', borderRadius: 5, overflow: 'hidden', marginBottom: 8 }}>
                        <div style={{ height: '100%', width: `${t.pct}%`, background: t.pct >= 70 ? '#10b981' : t.pct >= 50 ? '#f59e0b' : '#ef4444', borderRadius: 5, transition: 'width .6s ease' }} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, color: '#9ca3af' }}>{t.correct}/{t.total} correct</span>
                        <span style={{ background: t.pct >= 70 ? '#d1fae5' : t.pct >= 50 ? '#fef3c7' : '#fee2e2', border: `2px solid ${t.pct >= 70 ? '#6ee7b7' : t.pct >= 50 ? '#fde68a' : '#fca5a5'}`, color: t.pct >= 70 ? '#059669' : t.pct >= 50 ? '#d97706' : '#dc2626', padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 800 }}>
                          {t.pct >= 70 ? '💪 Strong' : t.pct >= 50 ? '📈 Developing' : '📚 Needs Work'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── HISTORY TAB ── */}
        {activeTab === 'history' && (
          <div style={{ background: 'white', border: '3px solid #e8e0ff', borderRadius: 22, padding: '20px', boxShadow: '0 4px 0 #e8e0ff' }}>
            {results.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>📋</div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>No tests taken yet</div>
                <div style={{ fontSize: 13, marginTop: 6 }}>Start a test to see your history here!</div>
              </div>
            ) : results.map((r, i) => {
              const pct = r.total_questions > 0 ? Math.round((r.score / r.total_questions) * 100) : 0
              const sl  = SUBLEVEL_STYLE[r.sublevel_reached] || SUBLEVEL_STYLE.Bronze
              const t   = topics.find(tp => tp.id === r.topic)
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 0', borderBottom: i < results.length - 1 ? '2px solid #f0f4ff' : 'none' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 12, background: t?.pale || '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>{t?.icon || '📝'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#1e1b4b', textTransform: 'capitalize' }}>{r.topic || 'Mixed'} · {r.main_level || ''}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                      <span style={{ background: sl.bg, color: sl.color, border: `1.5px solid ${sl.border}`, borderRadius: 999, padding: '1px 8px', fontSize: 10, fontWeight: 800 }}>{r.sublevel_reached}</span>
                      <span style={{ fontSize: 11, color: '#9ca3af' }}>{fmtDate(r.completed_at)}</span>
                      <span style={{ fontSize: 11, color: '#9ca3af' }}>🪙 {r.coins_earned || 0} coins</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ height: 8, width: 80, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden', marginBottom: 4 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: pct >= 60 ? '#10b981' : '#ef4444', borderRadius: 4 }} />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: pct >= 60 ? '#059669' : '#dc2626', textAlign: 'right' }}>{r.score}/{r.total_questions} ({pct}%)</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}