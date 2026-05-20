import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../utils/supabaseClient'

const allBadges = [
    { id: 'first_test', label: 'First Test', desc: 'Complete your first test', icon: '🎯', color: '#7c3aed', pale: '#ede9fe', border: '#c4b5fd' },
    { id: 'first_correct', label: 'First Correct', desc: 'Get your first correct answer', icon: '⭐', color: '#d97706', pale: '#fef3c7', border: '#fde68a' },
    { id: 'streak_3', label: 'On a Roll', desc: 'Get 3 correct answers in a row', icon: '🔥', color: '#ea580c', pale: '#fff7ed', border: '#fed7aa' },
    { id: 'streak_5', label: 'Unstoppable', desc: 'Get 5 correct answers in a row', icon: '⚡', color: '#d97706', pale: '#fef3c7', border: '#fde68a' },
    { id: 'level_medium', label: 'Level Up!', desc: 'Reach Intermediate level', icon: '⬆️', color: '#d97706', pale: '#fef3c7', border: '#fde68a' },
    { id: 'level_hard', label: 'Advanced Scholar', desc: 'Reach Advanced level', icon: '🏆', color: '#dc2626', pale: '#fee2e2', border: '#fca5a5' },
    { id: 'practice_5', label: 'Dedicated', desc: 'Complete 5 practice sessions', icon: '📚', color: '#0891b2', pale: '#e0f2fe', border: '#7dd3fc' },
    { id: 'perfect_score', label: 'Perfect Score', desc: 'Score 100% on any test', icon: '💯', color: '#059669', pale: '#d1fae5', border: '#6ee7b7' },
    { id: 'all_topics', label: 'Well Rounded', desc: 'Practice all 5 topics at least once', icon: '🌟', color: '#7c3aed', pale: '#ede9fe', border: '#c4b5fd' },
    { id: 'coins_50', label: 'Coin Collector', desc: 'Earn 50 coins', icon: '💰', color: '#d97706', pale: '#fef3c7', border: '#fde68a' },
    { id: 'full_exam', label: 'Exam Ready', desc: 'Complete the full 1-hour exam', icon: '📝', color: '#7c3aed', pale: '#ede9fe', border: '#c4b5fd' },
    { id: 'no_hints', label: 'Solo Solver', desc: 'Complete a test without hints', icon: '🧠', color: '#db2777', pale: '#fce7f3', border: '#f9a8d4' },
]

const levelColors = { beginner: '#059669', medium: '#d97706', hard: '#dc2626' }
const levelPale = { beginner: '#d1fae5', medium: '#fef3c7', hard: '#fee2e2' }
const levelBorder = { beginner: '#6ee7b7', medium: '#fde68a', hard: '#fca5a5' }
const levelEmoji = { beginner: '⭐', medium: '⚡', hard: '🔥' }

export default function RewardsPage() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [progress, setProgress] = useState(null)
    const [sessions, setSessions] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => { if (user) fetchData() }, [user])

    async function fetchData() {
        const [{ data: prog }, { data: sess }] = await Promise.all([
            supabase.from('student_progress').select('*').eq('student_id', user.id).maybeSingle(),
            supabase.from('test_sessions').select('*').eq('student_id', user.id),
        ])
        setProgress(prog); setSessions(sess || []); setLoading(false)
    }

    const level = progress?.current_level || 'beginner'
    const points = progress?.total_points || 0
    const coins = progress?.coins || 0
    const streak = progress?.streak_count || 0
    const earned = progress?.badges || []

    const totalTests = sessions.length
    const totalCorrect = sessions.reduce((a, s) => a + (s.score || 0), 0)
    const totalQ = sessions.reduce((a, s) => a + (s.total_questions || 0), 0)
    const accuracy = totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : 0

    const levelThresholds = { beginner: 100, medium: 300, hard: 600 }
    const threshold = levelThresholds[level]
    const levelPct = Math.min(100, Math.round((points / threshold) * 100))
    const nextLevel = level === 'beginner' ? 'Intermediate' : level === 'medium' ? 'Advanced' : 'Max!'

    if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: "'Nunito',sans-serif", color: '#7c3aed', fontSize: 18 }}>Loading rewards...</div>

    return (
        <div style={{ fontFamily: "'Nunito',sans-serif", minHeight: '100vh', background: '#f0f4ff', padding: '20px 16px 60px' }}>

            <button onClick={() => navigate('/student')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'white', border: '3px solid #e8e0ff', color: '#7c3aed', padding: '8px 18px', borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito',sans-serif", marginBottom: 24 }}>
                ← Back to Dashboard
            </button>

            <div style={{ maxWidth: 720, margin: '0 auto' }}>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#1e1b4b', marginBottom: 6 }}>Your Rewards 🏆</div>
                    <div style={{ fontSize: 14, color: '#9ca3af', fontWeight: 600 }}>Track your progress, coins, badges and achievements</div>
                </div>

                {/* Top stat cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
                    {[
                        { label: 'Points', value: points, emoji: '★', bg: '#fef3c7', border: '#fde68a', color: '#92400e' },
                        { label: 'Coins', value: coins, emoji: '💰', bg: '#e0f2fe', border: '#7dd3fc', color: '#075985' },
                        { label: 'Streak', value: streak, emoji: '🔥', bg: '#fff7ed', border: '#fed7aa', color: '#c2410c' },
                        { label: 'Badges', value: earned.length, emoji: '🏅', bg: '#ede9fe', border: '#c4b5fd', color: '#7c3aed' },
                    ].map(s => (
                        <div key={s.label} style={{ background: s.bg, border: `3px solid ${s.border}`, borderRadius: 20, padding: '18px 14px', textAlign: 'center', boxShadow: `0 4px 0 ${s.border}` }}>
                            <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{s.emoji}</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: s.color, opacity: .7, textTransform: 'uppercase', letterSpacing: .5, marginTop: 4 }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Level card */}
                <div style={{ background: 'white', border: `3px solid ${levelBorder[level]}`, borderRadius: 22, padding: '22px 24px', marginBottom: 20, boxShadow: `0 5px 0 ${levelBorder[level]}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: '#9ca3af', marginBottom: 4 }}>Current Level</div>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: levelPale[level], border: `2px solid ${levelBorder[level]}`, color: levelColors[level], padding: '5px 14px', borderRadius: 999, fontSize: 14, fontWeight: 900 }}>
                                {levelEmoji[level]} {level.charAt(0).toUpperCase() + level.slice(1)}
                            </div>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#9ca3af' }}>
                            {level !== 'hard' ? `${points}/${threshold} points to ${nextLevel}` : '🎉 Max level reached!'}
                        </div>
                    </div>

                    {/* Level steps */}
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: level !== 'hard' ? 16 : 0 }}>
                        {['beginner', 'medium', 'hard'].map((l, i) => {
                            const done = ['beginner', 'medium', 'hard'].indexOf(level) > i
                            const current = level === l
                            return (
                                <div key={l} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 'none' }}>
                                        <div style={{ width: 40, height: 40, borderRadius: '50%', border: `3px solid ${current || done ? levelColors[l] : '#e5e7eb'}`, background: current || done ? levelColors[l] : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: current || done ? 'white' : '#9ca3af', fontWeight: 900, boxShadow: current ? `0 0 0 4px ${levelPale[l]}` : 'none' }}>
                                            {done ? '✓' : levelEmoji[l]}
                                        </div>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: current ? levelColors[l] : '#9ca3af', whiteSpace: 'nowrap' }}>
                                            {l === 'beginner' ? 'Beginner' : l === 'medium' ? 'Intermediate' : 'Advanced'}
                                        </span>
                                    </div>
                                    {i < 2 && <div style={{ flex: 1, height: 3, background: done ? levelColors[l] : '#e5e7eb', margin: '0 4px 18px' }} />}
                                </div>
                            )
                        })}
                    </div>

                    {/* Progress bar to next level */}
                    {level !== 'hard' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ flex: 1, height: 12, background: '#e5e7eb', borderRadius: 6, overflow: 'hidden', border: '2px solid #e5e7eb' }}>
                                <div style={{ height: '100%', width: `${levelPct}%`, background: `linear-gradient(90deg,${levelColors[level]},${levelColors[level]}aa)`, borderRadius: 6, transition: 'width .8s ease' }} />
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 800, color: levelColors[level] }}>{levelPct}%</span>
                        </div>
                    )}
                </div>

                {/* Stats */}
                <div style={{ background: 'white', border: '3px solid #e8e0ff', borderRadius: 22, padding: '20px 22px', marginBottom: 20 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: '#7c3aed', marginBottom: 16 }}>Performance Stats</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                        {[
                            { label: 'Tests Taken', value: totalTests },
                            { label: 'Accuracy', value: `${accuracy}%` },
                            { label: 'Correct Answers', value: totalCorrect },
                        ].map(s => (
                            <div key={s.label} style={{ background: '#f0f4ff', border: '2px solid #e8e0ff', borderRadius: 14, padding: '14px 12px', textAlign: 'center' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1e1b4b' }}>{s.value}</div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: .4, marginTop: 4 }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Badges */}
                <div style={{ background: 'white', border: '3px solid #e8e0ff', borderRadius: 22, padding: '20px 22px', marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: '#7c3aed' }}>Badges</div>
                        <span style={{ background: '#ede9fe', border: '2px solid #c4b5fd', color: '#7c3aed', padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 800 }}>{earned.length}/{allBadges.length}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 10 }}>
                        {allBadges.map(badge => {
                            const isEarned = earned.includes(badge.id)
                            return (
                                <div key={badge.id} style={{ background: isEarned ? badge.pale : '#f9fafb', border: `3px solid ${isEarned ? badge.border : '#e5e7eb'}`, borderRadius: 18, padding: '16px 12px', textAlign: 'center', opacity: isEarned ? 1 : .5, transition: 'all .2s', boxShadow: isEarned ? `0 4px 0 ${badge.border}` : 'none' }}>
                                    <div style={{ fontSize: '2rem', marginBottom: 8 }}>{isEarned ? badge.icon : '🔒'}</div>
                                    <div style={{ fontSize: 13, fontWeight: 800, color: isEarned ? '#1e1b4b' : '#9ca3af', marginBottom: 4 }}>{isEarned ? badge.label : '???'}</div>
                                    <div style={{ fontSize: 11, color: isEarned ? '#6b7280' : '#d1d5db', lineHeight: 1.5 }}>{isEarned ? badge.desc : 'Keep playing!'}</div>
                                    {isEarned && <div style={{ background: badge.pale, border: `2px solid ${badge.border}`, color: badge.color, padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 800, marginTop: 8, display: 'inline-block' }}>Earned!</div>}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Coins guide */}
                <div style={{ background: 'white', border: '3px solid #fde68a', borderRadius: 22, padding: '20px 22px', boxShadow: '0 4px 0 #fde68a' }}>
                    <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: '#d97706', marginBottom: 14 }}>How to Earn Coins 💰</div>
                    {[
                        { action: 'Correct answer (no hints)', coins: '+15 coins', color: '#059669', bg: '#d1fae5', border: '#6ee7b7' },
                        { action: 'Correct answer (with hint)', coins: '+5 coins', color: '#d97706', bg: '#fef3c7', border: '#fde68a' },
                        { action: '5 correct in a row (streak)', coins: '+20 bonus', color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
                        { action: 'Complete a full test', coins: '+30 bonus', color: '#7c3aed', bg: '#ede9fe', border: '#c4b5fd' },
                    ].map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0', borderBottom: i < 3 ? '2px solid #f0f4ff' : 'none' }}>
                            <span style={{ fontSize: 14, fontWeight: 600, color: '#4b5563' }}>{item.action}</span>
                            <span style={{ background: item.bg, border: `2px solid ${item.border}`, color: item.color, padding: '4px 12px', borderRadius: 999, fontSize: 13, fontWeight: 800 }}>{item.coins}</span>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    )
}