import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const IconMail = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
const IconLock = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
const IconUser = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 1 0-16 0" /></svg>
const IconEye = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
const IconEyeOff = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></svg>

export default function LoginPage() {
    const [mode, setMode] = useState('login')
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPw, setShowPw] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const { login, register } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(''); setSuccess(''); setLoading(true)
        try {
            if (mode === 'login') {
                const { error } = await login(email, password)
                if (error) throw error
                navigate('/role')
            } else {
                if (!fullName.trim()) throw new Error('Please enter your full name.')
                if (password.length < 6) throw new Error('Password must be at least 6 characters.')
                const { error } = await register(email, password, fullName)
                if (error) throw error
                setSuccess('Account created! Check your email to confirm, then log in.')
                setMode('login')
            }
        } catch (err) {
            setError(err.message || 'Something went wrong. Please try again.')
        } finally { setLoading(false) }
    }

    const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3
    const strColors = ['', '#ef4444', '#f59e0b', '#10b981']
    const strLabels = ['', 'Weak', 'Good', 'Strong']

    return (
        <div style={{ minHeight: '100vh', background: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: "'Nunito',sans-serif" }}>

            {/* Back */}
            <button onClick={() => navigate('/')} style={{ position: 'fixed', top: 20, left: 20, display: 'flex', alignItems: 'center', gap: 6, background: 'white', border: '3px solid #e8e0ff', color: '#7c3aed', padding: '7px 16px', borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>
                ← Back
            </button>

            <div style={{ width: '100%', maxWidth: 460, background: 'white', borderRadius: 28, border: '3px solid #e8e0ff', padding: '40px 36px', boxShadow: '0 8px 0 #e8e0ff' }}>

                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <div style={{ fontSize: '2.8rem', fontWeight: 900, color: '#7c3aed', letterSpacing: -2, lineHeight: 1 }}>11+</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 4 }}>Exam Preparation</div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', background: '#f5f3ff', borderRadius: 14, padding: 4, marginBottom: 28, border: '2px solid #e8e0ff' }}>
                    {['login', 'register'].map(m => (
                        <button key={m} onClick={() => { setMode(m); setError(''); setSuccess('') }}
                            style={{
                                flex: 1, padding: '10px', borderRadius: 11, border: 'none', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: "'Nunito',sans-serif", transition: 'all .2s',
                                background: mode === m ? '#7c3aed' : 'transparent',
                                color: mode === m ? 'white' : '#9ca3af',
                                boxShadow: mode === m ? '0 3px 0 #5b21b6' : 'none',
                            }}>
                            {m === 'login' ? 'Login' : 'Register'}
                        </button>
                    ))}
                </div>

                <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1e1b4b', marginBottom: 6 }}>
                    {mode === 'login' ? 'Welcome back!' : 'Create account'}
                </h3>
                <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 24, lineHeight: 1.6 }}>
                    {mode === 'login' ? 'Sign in to continue your preparation.' : 'Join students preparing for the 11+ exam.'}
                </p>

                {error && <div className="alert-error" style={{ marginBottom: 16 }}>{error}</div>}
                {success && <div className="alert-success" style={{ marginBottom: 16 }}>{success}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {mode === 'register' && (
                        <div>
                            <label style={{ fontSize: 13, fontWeight: 700, color: '#4b5563', display: 'block', marginBottom: 6 }}>Full Name</label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}><IconUser /></span>
                                <input className="form-input" type="text" placeholder="Your full name" value={fullName} onChange={e => setFullName(e.target.value)} required autoFocus />
                            </div>
                        </div>
                    )}

                    <div>
                        <label style={{ fontSize: 13, fontWeight: 700, color: '#4b5563', display: 'block', marginBottom: 6 }}>Email Address</label>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}><IconMail /></span>
                            <input className="form-input" type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus={mode === 'login'} />
                        </div>
                    </div>

                    <div>
                        <label style={{ fontSize: 13, fontWeight: 700, color: '#4b5563', display: 'block', marginBottom: 6 }}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}><IconLock /></span>
                            <input className="form-input" type={showPw ? 'text' : 'password'} placeholder={mode === 'register' ? 'Min 6 characters' : 'Enter your password'} value={password} onChange={e => setPassword(e.target.value)} required style={{ paddingRight: 44 }} />
                            <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                                {showPw ? <IconEyeOff /> : <IconEye />}
                            </button>
                        </div>
                        {mode === 'register' && password.length > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                                <div style={{ display: 'flex', gap: 4, flex: 1 }}>
                                    {[1, 2, 3].map(i => <div key={i} style={{ flex: 1, height: 6, borderRadius: 3, background: strength >= i ? strColors[strength] : '#e5e7eb', transition: 'background .3s' }} />)}
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 700, color: strColors[strength] }}>{strLabels[strength]}</span>
                            </div>
                        )}
                    </div>

                    <button type="submit" className="btn btn-primary btn-full btn-lg" style={{ marginTop: 4 }} disabled={loading}>
                        {loading ? <span className="spinner" style={{ width: 22, height: 22, borderWidth: 3, margin: 0 }} /> : mode === 'login' ? 'Sign In' : 'Create Account'}
                    </button>
                </form>

                <p style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: '#9ca3af' }}>
                    {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                    <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccess('') }}
                        style={{ background: 'none', border: 'none', color: '#7c3aed', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>
                        {mode === 'login' ? 'Register here' : 'Sign in here'}
                    </button>
                </p>
            </div>
        </div>
    )
}