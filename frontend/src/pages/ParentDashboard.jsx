// src/pages/ParentDashboard.jsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../utils/supabaseClient'

const topics = [
  { id: 'number',   label: 'Number',   icon: '🔢', color: '#7c3aed', pale: '#ede9fe', border: '#c4b5fd' },
  { id: 'algebra',  label: 'Algebra',  icon: '📐', color: '#0891b2', pale: '#e0f2fe', border: '#7dd3fc' },
  { id: 'geometry', label: 'Geometry', icon: '📏', color: '#059669', pale: '#d1fae5', border: '#6ee7b7' },
  { id: 'data',     label: 'Data',     icon: '📊', color: '#d97706', pale: '#fef3c7', border: '#fde68a' },
  { id: 'patterns', label: 'Patterns', icon: '🧩', color: '#db2777', pale: '#fce7f3', border: '#f9a8d4' },
]

const SUBLEVELS = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond']

const SUBLEVEL_STYLE = {
  Bronze:   { color: '#cd7f32', bg: '#fdf3e7', border: '#e8a85a' },
  Silver:   { color: '#6b7280', bg: '#f3f4f6', border: '#9ca3af' },
  Gold:     { color: '#d97706', bg: '#fef3c7', border: '#fde68a' },
  Platinum: { color: '#6366f1', bg: '#eef2ff', border: '#a5b4fc' },
  Diamond:  { color: '#0ea5e9', bg: '#e0f2fe', border: '#7dd3fc' },
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtTime(s) {
  if (!s) return '0m'
  const m = Math.floor(s / 60), sec = s % 60
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`
}

export default function ParentDashboard() {
  const { studentId } = useParams()
  const navigate      = useNavigate()

  const [student,    setStudent]    = useState(null)
  const [progress,   setProgress]   = useState(null)
  const [results,    setResults]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab,  setActiveTab]  = useState('overview')
  const [error,      setError]      = useState('')

  useEffect(() => { if (studentId) fetchAll() }, [studentId])

  async function fetchAll() {
    setRefreshing(true); setError('')
    try {
      const [{ data: s }, { data: prog }, { data: res }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', studentId).eq('role', 'student').maybeSingle(),
        supabase.from('student_progress').select('*').eq('student_id', studentId).maybeSingle(),
        supabase.from('results').select('*').eq('student_id', studentId).order('completed_at', { ascending: false }).limit(50),
      ])
      if (!s) { setError('Student not found.'); setLoading(false); setRefreshing(false); return }
      setStudent(s); setProgress(prog); setResults(res || [])
    } catch { setError('Failed to load data.') }
    finally { setLoading(false); setRefreshing(false) }
  }

  const level      = progress?.current_level || 'beginner'
  const points     = progress?.total_points  || 0
  const coins      = progress?.coins         || 0
  const totalTests = results.length
  const totalCorrect = results.reduce((a, r) => a + (r.score || 0), 0)
  const totalQ     = results.reduce((a, r) => a + (r.total_questions || 0), 0)
  const accuracy   = totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : 0
  const totalTime  = results.reduce((a, r) => a + (r.time_taken_secs || 0), 0)

  // Per-topic stats
  const topicStats = topics.map(t => {
    const tr = results.filter(r => r.topic === t.id)
    const tc = tr.reduce((a, r) => a + (r.score || 0), 0)
    const tq = tr.reduce((a, r) => a + (r.total_questions || 0), 0)
    return { ...t, sessions: tr.length, correct: tc, total: tq, pct: tq > 0 ? Math.round((tc / tq) * 100) : null }
  })

  // Sublevel breakdown
  const sublevelStats = SUBLEVELS.map(sl => {
    const sr = results.filter(r => r.sublevel_reached === sl)
    const sc = sr.reduce((a, r) => a + (r.score || 0), 0)
    const sq = sr.reduce((a, r) => a + (r.total_questions || 0), 0)
    return { sublevel: sl, sessions: sr.length, correct: sc, total: sq, pct: sq > 0 ? Math.round((sc / sq) * 100) : null }
  })

  // Last 7 for chart
  const chartData = [...results].reverse().slice(-7)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: "'Nunito',sans-serif", flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: '2rem' }}>📊</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#7c3aed' }}>Loading report...</div>
    </div>
  )

  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: "'Nunito',sans-serif", flexDirection: 'column', gap: 16, padding: 20, textAlign: 'center' }}>
      <div style={{ fontSize: '3rem' }}>😕</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: '#1e1b4b' }}>{error}</div>
      <button onClick={() => navigate('/role')} style={{ padding: '12px 28px', borderRadius: 14, border: 'none', background: '#7c3aed', color: 'white', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: "'Nunito',sans-serif", boxShadow: '0 4px 0 #5b21b6' }}>← Go Back</button>
    </div>
  )

  return (
    <div style={{ fontFamily: "'Nunito',sans-serif", minHeight: '100vh', background: '#f0f4ff' }}>

      {/* Navbar */}
      <nav style={{ background: 'white', borderBottom: '3px solid #e8e0ff', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#7c3aed' }}>
          11+ Prep <span style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', background: '#f0f4ff', border: '2px solid #e8e0ff', padding: '2px 10px', borderRadius: 999, marginLeft: 6 }}>Parent View</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={fetchAll} disabled={refreshing} style={{ background: '#f0f4ff', border: '2px solid #e8e0ff', color: '#7c3aed', padding: '7px 14px', borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>
            {refreshing ? '...' : '↻ Refresh'}
          </button>
          <button onClick={() => navigate('/role')} style={{ background: 'white', border: '2px solid #e5e7eb', color: '#9ca3af', padding: '7px 14px', borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>← Back</button>
        </div>
      </nav>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px 60px' }}>

        {/* Student card */}
        <div style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', borderRadius: 24, padding: '22px 24px', marginBottom: 20, boxShadow: '0 6px 0 #5b21b6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.2)', border: '3px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', fontWeight: 900, color: 'white' }}>
              {(student?.display_name || student?.email)?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'white' }}>{student?.display_name || student?.email?.split('@')[0]}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{student?.email}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.3)', color: 'white', padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 800 }}>
              🎓 {level.charAt(0).toUpperCase() + level.slice(1)} Level
            </div>
            <div style={{ background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.3)', color: 'white', padding: '6px 12px', borderRadius: 999, fontSize: 13, fontWeight: 800 }}>★ {points} pts</div>
            <div style={{ background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.3)', color: 'white', padding: '6px 12px', borderRadius: 999, fontSize: 13, fontWeight: 800 }}>🪙 {coins}</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', background: 'white', border: '3px solid #e8e0ff', borderRadius: 16, padding: 4, marginBottom: 20, gap: 4, width: 'fit-content' }}>
          {[['overview','📊 Overview'], ['growth','📈 Growth'], ['topics','🎯 Topics'], ['history','📋 History']].map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '8px 18px', borderRadius: 12, border: 'none', fontSize: 13, fontWeight: 800,
              cursor: 'pointer', fontFamily: "'Nunito',sans-serif", transition: 'all .2s',
              background: activeTab === tab ? '#7c3aed' : 'transparent',
              color: activeTab === tab ? 'white' : '#9ca3af',
              boxShadow: activeTab === tab ? '0 3px 0 #5b21b6' : 'none',
            }}>{label}</button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Tests Taken',    value: totalTests,             emoji: '📝', bg: '#ede9fe', border: '#c4b5fd', color: '#7c3aed' },
                { label: 'Overall Score',  value: `${accuracy}%`,        emoji: '🎯', bg: '#d1fae5', border: '#6ee7b7', color: '#059669' },
                { label: 'Total Points',   value: points,                 emoji: '★',  bg: '#fef3c7', border: '#fde68a', color: '#d97706' },
                { label: 'Time Practised', value: `${Math.round(totalTime / 60)}m`, emoji: '⏱', bg: '#e0f2fe', border: '#7dd3fc', color: '#0891b2' },
              ].map(s => (
                <div key={s.label} style={{ background: s.bg, border: `3px solid ${s.border}`, borderRadius: 18, padding: '16px 12px', textAlign: 'center', boxShadow: `0 4px 0 ${s.border}` }}>
                  <div style={{ fontSize: '1.4rem', marginBottom: 4 }}>{s.emoji}</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: s.color, opacity: .7, textTransform: 'uppercase', letterSpacing: .4, marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Sublevel breakdown */}
            <div style={{ background: 'white', border: '3px solid #e8e0ff', borderRadius: 22, padding: '20px 22px', marginBottom: 20, boxShadow: '0 4px 0 #e8e0ff' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>Sublevel Performance</div>
              {sublevelStats.map(sl => {
                const style = SUBLEVEL_STYLE[sl.sublevel]
                if (sl.sessions === 0) return null
                return (
                  <div key={sl.sublevel} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <span style={{ minWidth: 82, background: style.bg, color: style.color, border: `2px solid ${style.border}`, borderRadius: 999, padding: '3px 10px', fontSize: 12, fontWeight: 800, textAlign: 'center' }}>{sl.sublevel}</span>
                    <div style={{ flex: 1, height: 10, background: '#f3f4f6', borderRadius: 5, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${sl.pct}%`, background: sl.pct >= 70 ? '#10b981' : sl.pct >= 40 ? '#f59e0b' : '#ef4444', borderRadius: 5, transition: 'width .6s ease' }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', minWidth: 80, textAlign: 'right' }}>{sl.correct}/{sl.total} ({sl.pct}%)</span>
                  </div>
                )
              })}
              {sublevelStats.every(s => s.sessions === 0) && (
                <div style={{ textAlign: 'center', color: '#9ca3af', padding: '20px 0', fontSize: 14 }}>No tests taken yet in any sublevel.</div>
              )}
            </div>

            {/* Recent 5 */}
            {results.length > 0 && (
              <div style={{ background: 'white', border: '3px solid #e8e0ff', borderRadius: 22, padding: '20px 22px', boxShadow: '0 4px 0 #e8e0ff' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>Recent Tests</div>
                {results.slice(0, 5).map((r, i) => {
                  const pct = r.total_questions > 0 ? Math.round((r.score / r.total_questions) * 100) : 0
                  const t   = topics.find(tp => tp.id === r.topic)
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: i < 4 ? '2px solid #f0f4ff' : 'none' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: t?.pale || '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.95rem', flexShrink: 0 }}>{t?.icon || '📝'}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#1e1b4b', textTransform: 'capitalize' }}>{r.topic || 'Mixed'} · {r.main_level || ''}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>{fmtDate(r.completed_at)}</div>
                      </div>
                      <div style={{ flex: 1, marginRight: 10 }}>
                        <div style={{ height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: pct >= 60 ? '#10b981' : '#ef4444', borderRadius: 4 }} />
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', minWidth: 60 }}>
                        <div style={{ fontSize: 14, fontWeight: 900, color: pct >= 60 ? '#059669' : '#dc2626' }}>{r.score}/{r.total_questions}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>{pct}%</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ── GROWTH ── */}
        {activeTab === 'growth' && (
          <>
            <div style={{ background: 'white', border: '3px solid #e8e0ff', borderRadius: 22, padding: '22px', marginBottom: 20, boxShadow: '0 4px 0 #e8e0ff' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#1e1b4b', marginBottom: 16 }}>📈 Score Trend (last {chartData.length} tests)</div>
              {chartData.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#9ca3af', padding: '30px' }}>No results yet to show growth.</div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120, marginBottom: 8 }}>
                    {chartData.map((r, i) => {
                      const pct = r.total_questions > 0 ? Math.round((r.score / r.total_questions) * 100) : 0
                      return (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: pct >= 60 ? '#059669' : '#dc2626' }}>{pct}%</div>
                          <div style={{ width: '100%', height: `${Math.max(pct, 6)}px`, background: pct >= 60 ? '#10b981' : '#ef4444', borderRadius: '6px 6px 0 0', transition: 'height .5s ease', maxHeight: 90 }} />
                          <div style={{ fontSize: 9, color: '#9ca3af', textTransform: 'capitalize', textAlign: 'center' }}>{r.topic || 'mix'}</div>
                          <div style={{ fontSize: 9, color: '#d1d5db' }}>{fmtDate(r.completed_at)}</div>
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9ca3af' }}>
                    <span>Oldest</span>
                    <span>Most recent</span>
                  </div>
                </>
              )}
            </div>

            {/* Sublevel progress */}
            <div style={{ background: 'white', border: '3px solid #e8e0ff', borderRadius: 22, padding: '22px', boxShadow: '0 4px 0 #e8e0ff' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#1e1b4b', marginBottom: 16 }}>🏅 Sublevel Mastery</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
                {SUBLEVELS.map(sl => {
                  const stat  = sublevelStats.find(s => s.sublevel === sl)
                  const style = SUBLEVEL_STYLE[sl]
                  const pct   = stat?.pct ?? null
                  return (
                    <div key={sl} style={{ background: style.bg, border: `3px solid ${style.border}`, borderRadius: 16, padding: '16px 10px', textAlign: 'center', boxShadow: `0 4px 0 ${style.border}` }}>
                      <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>
                        {pct !== null ? (pct >= 70 ? '🏆' : pct >= 50 ? '⭐' : '📚') : '🔒'}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 900, color: style.color, marginBottom: 4 }}>{sl}</div>
                      {pct !== null ? (
                        <>
                          <div style={{ fontSize: 18, fontWeight: 900, color: '#1e1b4b' }}>{pct}%</div>
                          <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>{stat.sessions} test{stat.sessions !== 1 ? 's' : ''}</div>
                        </>
                      ) : (
                        <div style={{ fontSize: 11, color: '#d1d5db', fontStyle: 'italic' }}>Not yet</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* ── TOPICS ── */}
        {activeTab === 'topics' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 14 }}>
            {topicStats.map(t => (
              <div key={t.id} style={{ background: 'white', border: `3px solid ${t.border}`, borderRadius: 20, padding: '20px 18px', boxShadow: `0 4px 0 ${t.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: '1.4rem' }}>{t.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af' }}>{t.sessions} tests</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: t.color, marginBottom: 10 }}>{t.label}</div>
                {t.pct !== null ? (
                  <>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#1e1b4b', marginBottom: 8 }}>{t.pct}%</div>
                    <div style={{ height: 10, background: '#e5e7eb', borderRadius: 5, overflow: 'hidden', marginBottom: 8 }}>
                      <div style={{ height: '100%', width: `${t.pct}%`, background: t.pct >= 70 ? '#10b981' : t.pct >= 50 ? '#f59e0b' : '#ef4444', borderRadius: 5 }} />
                    </div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>{t.correct}/{t.total} correct</div>
                    <div style={{ background: t.pct >= 70 ? '#d1fae5' : t.pct >= 50 ? '#fef3c7' : '#fee2e2', border: `2px solid ${t.pct >= 70 ? '#6ee7b7' : t.pct >= 50 ? '#fde68a' : '#fca5a5'}`, color: t.pct >= 70 ? '#059669' : t.pct >= 50 ? '#d97706' : '#dc2626', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 800, display: 'inline-block' }}>
                      {t.pct >= 70 ? '💪 Strong' : t.pct >= 50 ? '📈 Developing' : '📚 Needs Practice'}
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 13, color: '#d1d5db', fontStyle: 'italic' }}>Not attempted yet</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── HISTORY ── */}
        {activeTab === 'history' && (
          <div style={{ background: 'white', border: '3px solid #e8e0ff', borderRadius: 22, padding: '20px', boxShadow: '0 4px 0 #e8e0ff' }}>
            {results.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>📋</div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>No tests taken yet</div>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.8fr 0.8fr 0.8fr 0.7fr', gap: 8, padding: '6px 10px', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: .5, color: '#9ca3af', borderBottom: '2px solid #f0f4ff', marginBottom: 6 }}>
                  {['Date', 'Topic', 'Score', 'Accuracy', 'Sublevel', 'Time'].map(h => <span key={h}>{h}</span>)}
                </div>
                {results.map((r, i) => {
                  const pct = r.total_questions > 0 ? Math.round((r.score / r.total_questions) * 100) : 0
                  const sl  = SUBLEVEL_STYLE[r.sublevel_reached]
                  const t   = topics.find(tp => tp.id === r.topic)
                  return (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.8fr 0.8fr 0.8fr 0.7fr', gap: 8, padding: '10px 10px', background: i % 2 === 0 ? 'white' : '#fafafa', borderRadius: 10, alignItems: 'center', fontSize: 12 }}>
                      <span style={{ color: '#6b7280' }}>{fmtDate(r.completed_at)}</span>
                      <span style={{ fontWeight: 700, color: t?.color || '#7c3aed', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: 4 }}>{t?.icon} {r.topic || 'Mix'}</span>
                      <span style={{ fontWeight: 800, color: pct >= 60 ? '#059669' : '#dc2626' }}>{r.score}/{r.total_questions}</span>
                      <span style={{ fontWeight: 700, color: pct >= 60 ? '#059669' : '#dc2626' }}>{pct}%</span>
                      <span>
                        {sl ? (
                          <span style={{ background: sl.bg, color: sl.color, border: `1.5px solid ${sl.border}`, borderRadius: 999, padding: '2px 8px', fontSize: 10, fontWeight: 800 }}>{r.sublevel_reached}</span>
                        ) : '—'}
                      </span>
                      <span style={{ color: '#9ca3af' }}>{fmtTime(r.time_taken_secs)}</span>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        )}

      </div>
    </div>
  )
}