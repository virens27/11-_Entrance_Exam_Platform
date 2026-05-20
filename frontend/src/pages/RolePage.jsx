import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../utils/supabaseClient'

export default function RolePage() {
    const [selected, setSelected] = useState(null)
    const [studentEmail, setStudentEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const { user, fetchProfile } = useAuth()
    const navigate = useNavigate()

    const handleStudentContinue = async () => {
        setLoading(true); setError('')
        try {
            await supabase.from('profiles').upsert({ id: user.id, email: user.email, role: 'student' })
            await fetchProfile(user.id)
            navigate('/student')
        } catch { setError('Something went wrong. Please try again.') }
        finally { setLoading(false) }
    }

    const handleParentView = async () => {
        if (!studentEmail.trim()) { setError("Please enter your child's email."); return }
        setLoading(true); setError('')
        try {
            const { data: student } = await supabase.from('profiles').select('*').eq('email', studentEmail.trim().toLowerCase()).eq('role', 'student').maybeSingle()
            if (!student) { setError('No student found with that email. Make sure your child has registered first.'); setLoading(false); return }
            navigate(`/parent/${student.id}`)
        } catch { setError('Something went wrong. Please try again.') }
        finally { setLoading(false) }
    }

    return (
        <div style={{ fontFamily: "'Nunito',sans-serif", minHeight: '100vh', background: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
            <div style={{ width: '100%', maxWidth: 720 }}>

                {/* ── Back to Login button ── */}
                <div
                    style={{
                        marginBottom: 5,
                        marginLeft: -250, // adjust this value (try -16, -24, -32)
                    }}
                >
                    <button
                        onClick={() => navigate('/login')}
                        style={{
                            background: '#ede9fe',
                            border: '2px solid #c4b5fd',
                            borderRadius: 999,
                            padding: '10px 22px',
                            fontSize: 14,
                            fontWeight: 800,
                            color: '#7c3aed',
                            cursor: 'pointer',
                            fontFamily: "'Nunito',sans-serif",
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            transition: 'all .15s',
                            boxShadow: 'none',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#ddd6fe'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#ede9fe'; e.currentTarget.style.transform = 'translateY(0)' }}
                    >
                        ← Back
                    </button>
                </div>

                <div style={{ textAlign: 'center', marginBottom: 36 }}>
                    <div style={{ fontSize: '2.6rem', fontWeight: 900, color: '#1e1b4b', marginBottom: 8 }}>Who are you? 👋</div>
                    <div style={{ fontSize: 15, color: '#9ca3af', fontWeight: 600 }}>Choose your role to get the right experience</div>
                </div>

                {!selected && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        {[
                            { id: 'student', emoji: '🎓', title: 'I am a Student', sub: 'Age 8 - 11', color: '#7c3aed', pale: '#ede9fe', border: '#c4b5fd', shadow: '#c4b5fd', features: ['Topic-by-topic practice', 'Full 1-hour adaptive exam', 'Earn points & badges', 'Instant explanations'] },
                            { id: 'parent', emoji: '👨‍👩‍👧', title: 'I am a Parent', sub: 'No login needed', color: '#0891b2', pale: '#e0f2fe', border: '#7dd3fc', shadow: '#7dd3fc', features: ['Full progress reports', 'Time spent per topic', 'Level reached', 'Session history'] },
                        ].map(r => (
                            <div key={r.id} onClick={() => setSelected(r.id)}
                                style={{ background: 'white', border: `3px solid ${r.border}`, borderRadius: 28, padding: '28px 24px', cursor: 'pointer', transition: 'all .2s', boxShadow: `0 6px 0 ${r.shadow}` }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 10px 0 ${r.shadow}` }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 6px 0 ${r.shadow}` }}>
                                <div style={{ width: 70, height: 70, borderRadius: 20, background: r.pale, border: `3px solid ${r.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', marginBottom: 14 }}>{r.emoji}</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1e1b4b', marginBottom: 3 }}>{r.title}</div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: r.color, textTransform: 'uppercase', letterSpacing: .8, marginBottom: 12 }}>{r.sub}</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                                    {r.features.map(f => (
                                        <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#4b5563', fontWeight: 600 }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, flexShrink: 0 }} />{f}
                                        </div>
                                    ))}
                                </div>
                                {r.id === 'parent' && (
                                    <div style={{ marginTop: 14, background: '#e0f2fe', border: '2px solid #7dd3fc', color: '#075985', padding: '5px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700, display: 'inline-block' }}>
                                        Just enter child's email!
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {selected === 'student' && (
                    <div style={{ background: 'white', border: '3px solid #c4b5fd', borderRadius: 28, padding: '40px', maxWidth: 440, margin: '0 auto', textAlign: 'center', boxShadow: '0 6px 0 #c4b5fd' }}>
                        <button onClick={() => { setSelected(null); setError('') }} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito',sans-serif", display: 'block', marginBottom: 20 }}>← Back</button>
                        <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎓</div>
                        <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#1e1b4b', marginBottom: 8 }}>Welcome, Student!</h2>
                        <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 24, lineHeight: 1.7 }}>Next you will choose your starting level.</p>
                        {error && <div style={{ background: '#fee2e2', border: '2px solid #fca5a5', color: '#7f1d1d', padding: '10px 14px', borderRadius: 12, fontSize: 13, marginBottom: 16, textAlign: 'left' }}>{error}</div>}
                        <button onClick={handleStudentContinue} disabled={loading}
                            style={{ width: '100%', padding: '16px', borderRadius: 16, border: 'none', background: '#7c3aed', color: 'white', fontSize: 16, fontWeight: 900, cursor: 'pointer', fontFamily: "'Nunito',sans-serif", boxShadow: '0 5px 0 #5b21b6' }}>
                            {loading ? '...' : 'Continue to Level Selection →'}
                        </button>
                    </div>
                )}

                {selected === 'parent' && (
                    <div style={{ background: 'white', border: '3px solid #7dd3fc', borderRadius: 28, padding: '40px', maxWidth: 440, margin: '0 auto', textAlign: 'center', boxShadow: '0 6px 0 #7dd3fc' }}>
                        <button onClick={() => { setSelected(null); setError(''); setStudentEmail('') }} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito',sans-serif", display: 'block', marginBottom: 20 }}>← Back</button>
                        <div style={{ fontSize: '3rem', marginBottom: 12 }}>👨‍👩‍👧</div>
                        <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#1e1b4b', marginBottom: 8 }}>View Child's Report</h2>
                        <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 24, lineHeight: 1.7 }}>Enter the email your child used to register.</p>
                        <div style={{ textAlign: 'left', marginBottom: 16 }}>
                            <label style={{ fontSize: 13, fontWeight: 700, color: '#4b5563', display: 'block', marginBottom: 6 }}>Child's email address</label>
                            <input type="email" placeholder="child@example.com" value={studentEmail} onChange={e => { setStudentEmail(e.target.value); setError('') }} onKeyDown={e => e.key === 'Enter' && handleParentView()} autoFocus
                                style={{ width: '100%', padding: '13px 16px', borderRadius: 14, border: '3px solid #7dd3fc', background: '#f0f9ff', fontSize: 15, fontWeight: 600, color: '#1e1b4b', fontFamily: "'Nunito',sans-serif", outline: 'none' }} />
                        </div>
                        {error && <div style={{ background: '#fee2e2', border: '2px solid #fca5a5', color: '#7f1d1d', padding: '10px 14px', borderRadius: 12, fontSize: 13, marginBottom: 16, textAlign: 'left' }}>{error}</div>}
                        <button onClick={handleParentView} disabled={loading || !studentEmail.trim()}
                            style={{ width: '100%', padding: '16px', borderRadius: 16, border: 'none', background: !studentEmail.trim() ? '#e5e7eb' : '#0891b2', color: !studentEmail.trim() ? '#9ca3af' : 'white', fontSize: 16, fontWeight: 900, cursor: !studentEmail.trim() ? 'not-allowed' : 'pointer', fontFamily: "'Nunito',sans-serif", boxShadow: studentEmail.trim() ? '0 5px 0 #0369a1' : 'none' }}>
                            {loading ? '...' : 'View Report →'}
                        </button>
                    </div>
                )}

            </div>
        </div>
    )
}