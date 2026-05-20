import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

// ── Page-specific messages ──────────────────────────────────────────────────
const PAGE_GUIDES = {
    '/': [
        "👋 Hi! I'm Nova, your 11+ guide! I'll help you every step of the way on this website!",
        "📚 The 11+ exam tests Maths, English and Reasoning skills for students aged 10–13.",
        "🎯 This platform covers 5 key Maths topics: Number, Algebra, Geometry, Data and Patterns.",
        "✨ You can practise topic-by-topic or take a full 1-hour timed exam — just like the real thing!",
        "🚀 Click 'Get Started Free' or 'Login' to begin your journey. I'll guide you from here!",
    ],
    '/login': [
        "🔐 Welcome to the Login page! First time here? Click 'Register' to create a free account.",
        "📝 To register, just enter your full name, email and a password (at least 6 characters).",
        "✅ After registering, check your email to confirm your account — then log in!",
        "💡 Already have an account? Just enter your email and password and click 'Sign In'.",
    ],
    '/role': [
        "👋 Now choose who you are — a Student or a Parent!",
        "🎓 Students: click 'I am a Student' to start practising maths topics and earning rewards.",
        "👨‍👩‍👧 Parents: click 'I am a Parent' — you just need your child's registered email to see their full progress report!",
        "💡 No parent account needed — parents can view reports without signing up!",
    ],
    '/level': [
        "⭐ Now pick your starting level — don't worry, the AI will adjust it automatically as you improve!",
        "🌱 Beginner: Perfect if you're just starting. Questions are straightforward with full hints.",
        "⚡ Intermediate: For students who know the basics and want harder multi-step problems.",
        "🔥 Advanced: Scholarship-level questions for students aiming for top 11+ scores.",
        "🤖 Remember: if you get 5 correct in a row, your difficulty level goes UP automatically!",
    ],
    '/student': [
        "🏠 Welcome to your Student Dashboard! This is your home base.",
        "📚 Choose any of the 5 topic cards below to start practising that subject.",
        "📝 Or scroll down to the dark banner and click 'Start Exam' for a full 1-hour timed test.",
        "🏆 Check the top bar for your Points ★, Coins 💰 and Streak 🔥 — they update as you practise!",
        "🎁 Click the 'Rewards' button in the top bar to see your badges and achievements!",
    ],
    '/parent': [
        "👨‍👩‍👧 Welcome to the Parent Dashboard! Here you can track your child's full progress.",
        "📊 The Overview tab shows total tests taken, overall accuracy, points and time practised.",
        "📋 The Sessions tab lists every individual test your child has completed with scores and dates.",
        "🗂️ The Topics tab shows how well your child is performing in each of the 5 maths areas.",
        "💡 Tip: click 'Refresh' in the top right to load the very latest data!",
    ],
}

const TOPIC_GUIDE = [
    "📖 You've opened a topic page! Here you can choose how you want to practise.",
    "📚 'Practice Mode' lets you read the full lesson first, then take a 30-minute test with instant feedback.",
    "✏️ 'Test Mode' jumps straight into a timed MCQ test — questions adapt to your level automatically.",
    "💡 We recommend reading Practice Mode first if you're new to this topic!",
]

const PRACTICE_GUIDE = [
    "📚 Practice Mode — read the lesson carefully before answering!",
    "🔢 Use the section tabs at the top to switch between different parts of the lesson.",
    "📐 Each section has a 'Key Formulas' box and a 'Worked Example' — study both carefully!",
    "➡️ When you've read all sections, click 'Start Practice Test' at the bottom to test yourself.",
]

const PRACTICETEST_GUIDE = [
    "⏱️ Practice Test started! You have 30 minutes — the timer is in the top right.",
    "💡 Stuck? Click the yellow 'Hint' button for a clue (costs some coins though!).",
    "👁️ Really stuck? 'Show Answer' reveals the correct option — but resets your streak.",
    "📖 After each answer, an explanation appears — read it even if you got it right!",
    "🔥 Get 5 correct in a row for a streak bonus! Keep going!",
]

const TEST_GUIDE = [
    "📝 Test Mode — this is the real challenge! Answer as many as you can.",
    "⭐ Start at Beginner level. Get 5 correct in a row to level up to Intermediate, then Advanced!",
    "💰 Every correct answer earns coins. No hints = more coins. Hints = fewer coins.",
    "⏱️ Watch the timer! For a full exam you have 1 hour. Topic tests are 30 minutes.",
    "🏆 When you finish, you'll see a full breakdown of your score by topic. Good luck!",
]

const REWARDS_GUIDE = [
    "🏆 This is your Rewards page — see all your progress in one place!",
    "💰 Coins are earned by answering correctly. The more you answer without hints, the more you earn!",
    "🏅 Badges are unlocked by hitting milestones — try to collect them all!",
    "📈 The level progress bar shows how close you are to reaching the next level.",
    "🌟 Aim for the 'Perfect Score', 'Solo Solver' and 'Well Rounded' badges — they're rare!",
]

function getGuide(pathname) {
    if (PAGE_GUIDES[pathname]) return PAGE_GUIDES[pathname]
    if (pathname.startsWith('/student/practice-test')) return PRACTICETEST_GUIDE
    if (pathname.startsWith('/student/practice')) return PRACTICE_GUIDE
    if (pathname.startsWith('/student/test')) return TEST_GUIDE
    if (pathname.startsWith('/student/topic')) return TOPIC_GUIDE
    if (pathname.startsWith('/student/rewards')) return REWARDS_GUIDE
    if (pathname.startsWith('/parent')) return PAGE_GUIDES['/parent']
    return ["👋 I'm Pip! I'm here to help you navigate. Explore the page and I'll guide you!"]
}

function stripEmoji(text) {
    return text
        .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '')
        .replace(/\s+/g, ' ')
        .trim()
}

function pickVoice() {
    const voices = window.speechSynthesis.getVoices()
    if (!voices.length) return null
    const preferred = ['Samantha', 'Karen', 'Moira', 'Tessa', 'Fiona', 'Victoria', 'Allison', 'Ava']
    for (const name of preferred) {
        const v = voices.find(v => v.name.includes(name) && v.lang.startsWith('en'))
        if (v) return v
    }
    const female = voices.find(v => v.lang.startsWith('en-GB') && /female/i.test(v.name))
    if (female) return female
    return voices.find(v => v.lang.startsWith('en')) || voices[0]
}

// ── Pip Face (star-shaped) ────────────────────────────────────────────────
// Star body replaces the circle head. All face features (eyes, brows, cheeks,
// mouth / lip-sync) are identical — only the outline shape changes.
//
// Star maths: 5-point star centred at (40, 44), outer r=36, inner r=16
// Points generated at angles -90°, -18°, 54°, 126°, 198° (outer)
// and offset by 36° for inner notches.
function starPath(cx, cy, outerR, innerR, points = 5) {
    const angle = (Math.PI * 2) / points
    const offset = -Math.PI / 2          // start at top
    let d = ''
    for (let i = 0; i < points; i++) {
        const outerX = cx + outerR * Math.cos(offset + i * angle)
        const outerY = cy + outerR * Math.sin(offset + i * angle)
        const innerX = cx + innerR * Math.cos(offset + i * angle + angle / 2)
        const innerY = cy + innerR * Math.sin(offset + i * angle + angle / 2)
        d += i === 0 ? `M ${outerX} ${outerY}` : `L ${outerX} ${outerY}`
        d += ` L ${innerX} ${innerY}`
    }
    return d + ' Z'
}

function PipFace({ isSpeaking, lipPhase, mood }) {
    const isHappy = mood === 'happy'

    // ── All face features sit in the CENTRE zone of the star (roughly y 33–58)
    // Eyes centred at y=42, brows at y=35/36, mouth around y=52–54
    // Eyes brought closer together (cx 33 & 47) so they're inside the star belly
    const eyeRy        = isHappy ? 4   : 4.5
    const eyeY         = 42
    const eyeLX        = 33   // left eye x
    const eyeRX        = 47   // right eye x
    const browY        = isHappy ? 35 : 36
    const browCurve    = isHappy ? 2.5 : 0.5
    const cheekOpacity = isHappy ? 0.6 : 0.15

    // Star: outer r=36 gives nice spiky star, inner r=17 keeps centre wide enough for face
    const star       = starPath(40, 41, 36, 17)
    const starShadow = starPath(40, 43, 36, 17)

    let mouthEl

    if (!isSpeaking) {
        if (isHappy) {
            // Compact smile — sits well within star centre
            mouthEl = (
                <g>
                    <clipPath id="smileClip">
                        <path d="M 31 52 Q 40 61 49 52 Q 40 57 31 52 Z" />
                    </clipPath>
                    <rect x="31" y="50" width="18" height="9" rx="2" fill="white" clipPath="url(#smileClip)" />
                    <path d="M 31 52 Q 40 61 49 52" fill="none" stroke="#92400e" strokeWidth="2.2" strokeLinecap="round" />
                </g>
            )
        } else {
            mouthEl = (
                <path d="M 32 53 Q 40 58 48 53" fill="none" stroke="#92400e" strokeWidth="2" strokeLinecap="round" />
            )
        }
    } else {
        const phase = lipPhase % 4
        switch (phase) {
            case 0: // Closed
                mouthEl = (
                    <path d="M 33 53 Q 40 55 47 53" fill="none" stroke="#92400e" strokeWidth="2" strokeLinecap="round" />
                )
                break
            case 1: // Wide open
                mouthEl = (
                    <g>
                        <ellipse cx="40" cy="54" rx="8" ry="6" fill="#7c2d12" />
                        <rect x="33" y="49" width="14" height="4" rx="2" fill="white" />
                        <rect x="34" y="57" width="12" height="3.5" rx="2" fill="white" />
                        <path d="M 32 51 Q 40 48 48 51" fill="none" stroke="#b45309" strokeWidth="1.4" strokeLinecap="round" />
                        <path d="M 32 51 Q 40 61 48 51" fill="none" stroke="#b45309" strokeWidth="1.4" strokeLinecap="round" />
                    </g>
                )
                break
            case 2: // Mid open
                mouthEl = (
                    <g>
                        <ellipse cx="40" cy="54" rx="7" ry="4" fill="#7c2d12" />
                        <rect x="34" y="50" width="12" height="3.5" rx="2" fill="white" />
                        <path d="M 33 52 Q 40 49 47 52" fill="none" stroke="#b45309" strokeWidth="1.4" strokeLinecap="round" />
                        <path d="M 33 52 Q 40 59 47 52" fill="none" stroke="#b45309" strokeWidth="1.4" strokeLinecap="round" />
                    </g>
                )
                break
            case 3: // Small open
                mouthEl = (
                    <g>
                        <ellipse cx="40" cy="54" rx="5.5" ry="3" fill="#92400e" />
                        <rect x="35" y="51.5" width="10" height="3" rx="1.5" fill="white" opacity="0.85" />
                        <path d="M 34 53 Q 40 51 46 53" fill="none" stroke="#b45309" strokeWidth="1.1" strokeLinecap="round" />
                    </g>
                )
                break
            default:
                mouthEl = (
                    <path d="M 33 53 Q 40 55 47 53" fill="none" stroke="#92400e" strokeWidth="2" strokeLinecap="round" />
                )
        }
    }

    return (
        <svg width="72" height="72" viewBox="0 0 80 80" style={{ display: 'block' }}>
            {/* Drop shadow */}
            <path d={starShadow} fill="#d97706" opacity="0.35" />
            {/* Star body */}
            <path d={star} fill="#fde68a" stroke="#f59e0b" strokeWidth="2.5" strokeLinejoin="round" />
            {/* Inner glow ring to make centre feel like a "face zone" */}
            <circle cx="40" cy="41" r="18" fill="#fef3c7" opacity="0.45" />

            {/* Eyebrows — short, close together, above eyes */}
            <path d={`M ${eyeLX - 5} ${browY} Q ${eyeLX} ${browY - browCurve} ${eyeLX + 5} ${browY}`}
                fill="none" stroke="#92400e" strokeWidth="2" strokeLinecap="round" />
            <path d={`M ${eyeRX - 5} ${browY} Q ${eyeRX} ${browY - browCurve} ${eyeRX + 5} ${browY}`}
                fill="none" stroke="#92400e" strokeWidth="2" strokeLinecap="round" />

            {/* Eyes */}
            <ellipse cx={eyeLX} cy={eyeY} rx="4.5" ry={eyeRy} fill="#1e1b4b" />
            <ellipse cx={eyeRX} cy={eyeY} rx="4.5" ry={eyeRy} fill="#1e1b4b" />
            {/* Shine */}
            <circle cx={eyeLX + 1.5} cy={eyeY - 1.2} r="1.3" fill="white" />
            <circle cx={eyeRX + 1.5} cy={eyeY - 1.2} r="1.3" fill="white" />

            {/* Cheeks — tucked just beside the eyes, not on star tips */}
            <ellipse cx={eyeLX - 7} cy={eyeY + 5} rx="4.5" ry="3" fill="#fca5a5" opacity={cheekOpacity} />
            <ellipse cx={eyeRX + 7} cy={eyeY + 5} rx="4.5" ry="3" fill="#fca5a5" opacity={cheekOpacity} />

            {/* Mouth */}
            {mouthEl}
        </svg>
    )
}

// ── Main component ────────────────────────────────────────────────────────
const VOICE_PREF_KEY = 'pip_voice_enabled'

export default function AvatarGuide() {
    const location = useLocation()
    const [open, setOpen]         = useState(false)
    const [msgIndex, setMsgIndex] = useState(0)
    const [displayed, setDisplayed] = useState('')
    const [typing, setTyping]     = useState(false)

    // isSpeaking = true whenever typewriter is running (drives lip sync always)
    // soundActive = true only when voice is on AND speech synth is speaking (drives wave bars)
    const [isSpeaking, setIsSpeaking]   = useState(false)
    const [soundActive, setSoundActive] = useState(false)
    const [lipPhase, setLipPhase]       = useState(0)

    const [bouncing, setBouncing] = useState(false)
    const [hidden, setHidden]     = useState(false)
    const [voiceOn, setVoiceOn]   = useState(() => {
        try { return localStorage.getItem(VOICE_PREF_KEY) === 'true' }
        catch { return false }
    })
    const [voiceReady, setVoiceReady] = useState(false)

    const synthRef      = useRef(window.speechSynthesis || null)
    const utteranceRef  = useRef(null)
    // Lip sync runs on a plain setInterval — most reliable, never drifts
    const lipIntervalRef = useRef(null)

    const messages = getGuide(location.pathname)

    // ── Start / stop the lip-sync interval ───────────────────────────────
    // Called with true when typewriter starts, false when it ends.
    // Uses setInterval (not setTimeout chain) so it never stops mid-speech.
    function startLipSync() {
        stopLipSync()  // clear any existing one first
        let phase = 0
        lipIntervalRef.current = setInterval(() => {
            // Vary dwell time per phase by slightly randomising which phase we jump to.
            // Simple pattern: 0→1→2→3→0→... but we skip randomly to 0 (closed) more often
            // to mimic natural consonant pauses.
            const next = phase === 0
                ? (Math.random() < 0.4 ? 0 : 1)   // 40% stay closed, 60% open wide
                : (phase + 1) % 4
            phase = next
            setLipPhase(phase)
        }, 110)   // fires every 110ms — fast enough to look animated, not jittery
    }

    function stopLipSync() {
        if (lipIntervalRef.current) {
            clearInterval(lipIntervalRef.current)
            lipIntervalRef.current = null
        }
        setLipPhase(0)
    }

    // ── Load voices ───────────────────────────────────────────────────────
    useEffect(() => {
        if (!synthRef.current) return
        const load = () => setVoiceReady(true)
        if (synthRef.current.getVoices().length) {
            setVoiceReady(true)
        } else {
            synthRef.current.addEventListener('voiceschanged', load)
            return () => synthRef.current.removeEventListener('voiceschanged', load)
        }
    }, [])

    // ── Persist voice preference ──────────────────────────────────────────
    useEffect(() => {
        try { localStorage.setItem(VOICE_PREF_KEY, voiceOn) } catch {}
        if (!voiceOn) {
            stopSpeechSynth()
            setSoundActive(false)
        }
    }, [voiceOn])

    // ── Page change ───────────────────────────────────────────────────────
    useEffect(() => {
        stopAll()
        setMsgIndex(0)
        setDisplayed('')
        setOpen(false)
        setHidden(false)
        setBouncing(true)
        const t = setTimeout(() => setBouncing(false), 1200)
        return () => { clearTimeout(t); stopAll() }
    }, [location.pathname])

    // ── Close bubble ──────────────────────────────────────────────────────
    useEffect(() => {
        if (!open) stopAll()
    }, [open])

    // ── Main typewriter + speech effect ───────────────────────────────────
    // Triggers whenever the bubble opens or the message index changes.
    // Lip sync is ALWAYS started here — voiceOn only controls the audio.
    useEffect(() => {
        if (!open) return

        const msg = messages[msgIndex] || ''
        setDisplayed('')
        setTyping(true)

        // Always start lip sync — visible regardless of sound setting
        setIsSpeaking(true)
        startLipSync()

        // Stop any previous speech
        stopSpeechSynth()

        // Only start audio if voice is enabled
        if (voiceOn && synthRef.current && voiceReady) {
            const clean = stripEmoji(msg)
            const utt = new SpeechSynthesisUtterance(clean)
            utt.rate = 0.95
            utt.pitch = 1.15
            utt.volume = 1
            const voice = pickVoice()
            if (voice) utt.voice = voice
            // ── Lip sync stops exactly when speech ends ──────────────────
            utt.onend = () => {
                setSoundActive(false)
                setIsSpeaking(false)
                stopLipSync()
            }
            utt.onerror = () => {
                setSoundActive(false)
                setIsSpeaking(false)
                stopLipSync()
            }
            utteranceRef.current = utt
            setSoundActive(true)
            synthRef.current.speak(utt)
        }

        // Typewriter — just updates text, never touches lip sync
        let i = 0
        const iv = setInterval(() => {
            i++
            setDisplayed(msg.slice(0, i))
            if (i >= msg.length) {
                clearInterval(iv)
                setTyping(false)
                // If voice is OFF, stop lips after text finishes (no audio to wait for)
                if (!voiceOn || !synthRef.current) {
                    setIsSpeaking(false)
                    stopLipSync()
                }
                // If voice is ON, lips keep moving until utt.onend fires above
            }
        }, 22)

        return () => {
            clearInterval(iv)
            stopAll()
        }
    }, [open, msgIndex, location.pathname])

    function stopSpeechSynth() {
        if (synthRef.current?.speaking) synthRef.current.cancel()
        setSoundActive(false)
    }

    function stopAll() {
        stopSpeechSynth()
        setIsSpeaking(false)
        stopLipSync()
    }

    function handleVoiceToggle() {
        setVoiceOn(v => !v)
    }

    function handleVoiceOn() {
        // User turns sound ON mid-message — replay from current message with audio
        if (!voiceOn && open && synthRef.current && voiceReady) {
            const msg = messages[msgIndex] || ''
            const clean = stripEmoji(msg)
            const utt = new SpeechSynthesisUtterance(clean)
            utt.rate = 0.95
            utt.pitch = 1.15
            utt.volume = 1
            const voice = pickVoice()
            if (voice) utt.voice = voice
            utt.onend   = () => setSoundActive(false)
            utt.onerror = () => setSoundActive(false)
            utteranceRef.current = utt
            setSoundActive(true)
            synthRef.current.speak(utt)
        }
        setVoiceOn(true)
    }

    if (hidden) return null

    const isLast = msgIndex >= messages.length - 1
    const mood   = location.pathname === '/' || location.pathname === '/student' ? 'happy' : 'neutral'
    const hasSynth = !!synthRef.current

    return (
        <>
            <style>{`
                @keyframes pip-bounce {
                    0%,100% { transform: translateY(0) }
                    30%     { transform: translateY(-12px) }
                    60%     { transform: translateY(-6px) }
                }
                @keyframes pip-pop {
                    0%   { transform: scale(0.7) translateY(10px); opacity: 0 }
                    70%  { transform: scale(1.05) translateY(-2px); opacity: 1 }
                    100% { transform: scale(1) translateY(0); opacity: 1 }
                }
                @keyframes pip-blink {
                    0%,90%,100% { opacity: 1 }
                    95%         { opacity: 0 }
                }
                @keyframes pip-sound-wave {
                    0%,100% { transform: scaleY(1) }
                    50%     { transform: scaleY(1.6) }
                }
                .pip-bubble { animation: pip-pop 0.35s cubic-bezier(.34,1.56,.64,1) forwards; }
                .pip-bounce { animation: pip-bounce 0.9s ease-in-out 3; }
                .pip-btn {
                    border: none; cursor: pointer; font-family: 'Nunito', sans-serif;
                    font-weight: 800; border-radius: 999px; transition: all .15s;
                }
                .pip-btn:hover { filter: brightness(0.93); transform: scale(0.97); }
                .pip-avatar-btn {
                    width: 72px; height: 72px; border-radius: 50%;
                    background: white;
                    border: 3px solid #c4b5fd;
                    box-shadow: 0 4px 0 #c4b5fd;
                    cursor: pointer; padding: 0; display: flex;
                    align-items: center; justify-content: center;
                    transition: box-shadow .15s, transform .15s;
                }
                .pip-avatar-btn:hover { transform: scale(1.06); box-shadow: 0 6px 0 #c4b5fd; }
                .pip-voice-btn {
                    border: none; cursor: pointer;
                    background: transparent;
                    padding: 4px 6px;
                    border-radius: 8px;
                    display: flex; align-items: center; gap: 4px;
                    transition: background .15s;
                    font-family: 'Nunito', sans-serif;
                    font-size: 11px; font-weight: 700;
                }
                .pip-voice-btn:hover { background: #f0f4ff; }
                .pip-wave-bar {
                    display: inline-block;
                    width: 3px; height: 10px;
                    background: #7c3aed;
                    border-radius: 2px;
                    transform-origin: bottom center;
                }
                .pip-wave-bar:nth-child(1) { animation: pip-sound-wave 0.6s ease-in-out infinite 0s; }
                .pip-wave-bar:nth-child(2) { animation: pip-sound-wave 0.6s ease-in-out infinite 0.15s; }
                .pip-wave-bar:nth-child(3) { animation: pip-sound-wave 0.6s ease-in-out infinite 0.3s; }
                .pip-wave-bar:nth-child(4) { animation: pip-sound-wave 0.6s ease-in-out infinite 0.1s; }
            `}</style>

            <div style={{
                position: 'fixed', bottom: 24, right: 24,
                zIndex: 9999,
                display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10,
                pointerEvents: 'none',
            }}>
                {/* ── Speech bubble ───────────────────────────────────────── */}
                {open && (
                    <div className="pip-bubble" style={{
                        pointerEvents: 'all',
                        background: 'white',
                        border: '3px solid #c4b5fd',
                        borderRadius: 20,
                        borderBottomRightRadius: 4,
                        padding: '16px 18px',
                        maxWidth: 290,
                        minWidth: 220,
                        boxShadow: '0 6px 0 #c4b5fd',
                    }}>
                        {/* Top row */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            {hasSynth ? (
                                <button
                                    className="pip-voice-btn"
                                    onClick={voiceOn ? handleVoiceToggle : handleVoiceOn}
                                    title={voiceOn ? 'Mute Pip' : 'Hear Pip speak'}
                                    style={{ color: voiceOn ? '#7c3aed' : '#9ca3af' }}
                                >
                                    {voiceOn && soundActive ? (
                                        <span style={{ display: 'inline-flex', alignItems: 'flex-end', gap: 2, height: 14 }}>
                                            <span className="pip-wave-bar" />
                                            <span className="pip-wave-bar" />
                                            <span className="pip-wave-bar" />
                                            <span className="pip-wave-bar" />
                                        </span>
                                    ) : (
                                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                                            <path d="M11 4L6 8H3a1 1 0 00-1 1v2a1 1 0 001 1h3l5 4V4z"
                                                fill={voiceOn ? '#7c3aed' : '#d1d5db'} />
                                            {voiceOn ? (
                                                <>
                                                    <path d="M14.5 7.5a3.5 3.5 0 010 5" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" />
                                                    <path d="M16.5 5.5a6.5 6.5 0 010 9" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" />
                                                </>
                                            ) : (
                                                <path d="M14 8l3 4M17 8l-3 4" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" />
                                            )}
                                        </svg>
                                    )}
                                    <span>{voiceOn ? 'Sound on' : 'Sound off'}</span>
                                </button>
                            ) : <span />}

                            <button onClick={() => setOpen(false)} className="pip-btn" style={{
                                background: '#f0f4ff', color: '#9ca3af',
                                width: 22, height: 22, fontSize: 12,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                borderRadius: '50%', padding: 0,
                            }}>✕</button>
                        </div>

                        {/* Progress dots */}
                        <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
                            {messages.map((_, i) => (
                                <div key={i} onClick={() => { stopAll(); setMsgIndex(i) }} style={{
                                    width: 8, height: 8, borderRadius: '50%', cursor: 'pointer',
                                    background: i === msgIndex ? '#7c3aed' : i < msgIndex ? '#c4b5fd' : '#e5e7eb',
                                    transition: 'background .2s',
                                }} />
                            ))}
                        </div>

                        <div style={{
                            fontSize: 10, fontWeight: 800, color: '#7c3aed',
                            textTransform: 'uppercase', letterSpacing: 1,
                            marginBottom: 6, fontFamily: "'Nunito', sans-serif",
                        }}>Pip the Guide</div>

                        <p style={{
                            fontSize: 14, fontWeight: 600, color: '#1e1b4b',
                            lineHeight: 1.65, margin: '0 0 14px',
                            fontFamily: "'Nunito', sans-serif", minHeight: 60,
                        }}>
                            {displayed}
                            {typing && <span style={{ animation: 'pip-blink 1s infinite', marginLeft: 1 }}>|</span>}
                        </p>

                        <div style={{ display: 'flex', gap: 8 }}>
                            {msgIndex > 0 && (
                                <button onClick={() => { stopAll(); setMsgIndex(i => i - 1) }} className="pip-btn" style={{
                                    background: '#f0f4ff', color: '#7c3aed',
                                    padding: '7px 14px', fontSize: 12, flex: 1,
                                    border: '2px solid #e8e0ff',
                                }}>← Back</button>
                            )}
                            {!isLast ? (
                                <button onClick={() => { stopAll(); setMsgIndex(i => i + 1) }} className="pip-btn" style={{
                                    background: '#7c3aed', color: 'white',
                                    padding: '7px 14px', fontSize: 12, flex: 2,
                                    boxShadow: '0 3px 0 #5b21b6',
                                }}>Next tip →</button>
                            ) : (
                                <button onClick={() => { stopAll(); setOpen(false); setHidden(true) }} className="pip-btn" style={{
                                    background: '#10b981', color: 'white',
                                    padding: '7px 14px', fontSize: 12, flex: 2,
                                    boxShadow: '0 3px 0 #059669',
                                }}>Got it! ✓</button>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Avatar button ────────────────────────────────────────── */}
                <div style={{ pointerEvents: 'all', position: 'relative' }}>
                    {!open && (
                        <div style={{
                            position: 'absolute', top: -2, right: -2,
                            width: 16, height: 16, borderRadius: '50%',
                            background: '#ef4444', border: '2px solid white',
                            fontSize: 9, fontWeight: 900, color: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: "'Nunito', sans-serif",
                            zIndex: 1,
                        }}>!</div>
                    )}
                    <button
                        className={`pip-avatar-btn ${bouncing ? 'pip-bounce' : ''}`}
                        onClick={() => { setOpen(o => !o); setMsgIndex(0) }}
                        title="Pip the Guide — click for help!"
                    >
                        <PipFace isSpeaking={isSpeaking} lipPhase={lipPhase} mood={mood} />
                    </button>
                    <div style={{
                        textAlign: 'center', marginTop: 4,
                        fontSize: 10, fontWeight: 800, color: '#7c3aed',
                        fontFamily: "'Nunito', sans-serif",
                        letterSpacing: 0.5,
                    }}>Nova 🎓</div>
                </div>
            </div>
        </>
    )
}