import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import * as THREE from 'three'
import '../styles/HomePage.css'

export default function HomePage() {
    const canvasRef = useRef(null)
    const navigate = useNavigate()

    useEffect(() => {
        const canvas = canvasRef.current
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
        renderer.setPixelRatio(window.devicePixelRatio)
        renderer.setSize(window.innerWidth, window.innerHeight)

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
        camera.position.z = 5

        const starGeo = new THREE.BufferGeometry()
        const pos = new Float32Array(1800 * 3)
        for (let i = 0; i < pos.length; i++) pos[i] = (Math.random() - 0.5) * 80
        starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
        const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.14, transparent: true, opacity: 0.9 }))
        scene.add(stars)

        const orbData = [
            { color: 0xfde68a, size: 0.22 },
            { color: 0xa855f7, size: 0.18 },
            { color: 0x34d399, size: 0.20 },
            { color: 0xf472b6, size: 0.16 },
            { color: 0x60a5fa, size: 0.18 },
        ]
        const orbs = orbData.map((o, i) => {
            const mesh = new THREE.Mesh(
                new THREE.SphereGeometry(o.size, 32, 32),
                new THREE.MeshStandardMaterial({ color: o.color, emissive: o.color, emissiveIntensity: 0.6, roughness: 0.3 })
            )
            mesh.position.set((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 3)
            mesh.userData = { speedX: (Math.random() - 0.5) * 0.003, phase: i * 1.3 }
            scene.add(mesh)
            return mesh
        })

        scene.add(new THREE.AmbientLight(0xffffff, 0.5))
        const pl = new THREE.PointLight(0xa855f7, 2, 20)
        pl.position.set(0, 3, 3)
        scene.add(pl)

        let frameId
        const clock = new THREE.Clock()
        const animate = () => {
            frameId = requestAnimationFrame(animate)
            const t = clock.getElapsedTime()
            stars.rotation.y = t * 0.012
            orbs.forEach(o => {
                o.position.x += o.userData.speedX
                o.position.y += Math.sin(t + o.userData.phase) * 0.003
                if (Math.abs(o.position.x) > 6) o.userData.speedX *= -1
            })
            renderer.render(scene, camera)
        }
        animate()

        const onResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight
            camera.updateProjectionMatrix()
            renderer.setSize(window.innerWidth, window.innerHeight)
        }
        window.addEventListener('resize', onResize)
        return () => { cancelAnimationFrame(frameId); window.removeEventListener('resize', onResize); renderer.dispose() }
    }, [])

    const features = [
        { label: 'Adaptive Learning', color: '#ede9fe', text: '#7c3aed' },
        { label: 'Rewards & Coins', color: '#fef3c7', text: '#92400e' },
        { label: 'AI Powered', color: '#d1fae5', text: '#065f46' },
        { label: 'Parent Reports', color: '#fce7f3', text: '#9d174d' },
        { label: 'Instant Feedback', color: '#e0f2fe', text: '#075985' },
    ]

    const steps = [
        { num: '1', title: 'Create account', desc: 'Register free in under a minute', color: '#7c3aed' },
        { num: '2', title: 'Choose a topic', desc: 'Pick from 5 core maths topics', color: '#10b981' },
        { num: '3', title: 'Practice & level up', desc: 'Earn coins as your level grows', color: '#f59e0b' },
    ]

    return (
        <div className="hp-wrapper">
            <canvas ref={canvasRef} className="hp-canvas" />
            <div className="hp-overlay" />

            {/* ── Hero ── */}
            <section className="hp-hero">
                <div className="hp-hero-inner">
                    <div className="hp-badge fade-in">
                        <span className="hp-badge-dot" /> 11+ Preparation Platform
                    </div>

                    <h1 className="hp-title fade-in">
                        Master Your<br />
                        <span className="hp-title-hl">11+ Exam</span><br />
                        with Smart Practice
                    </h1>

                    <p className="hp-sub fade-in">
                        Interactive maths lessons, adaptive tests and AI-powered questions
                        built for students aged 8 - 11. Learn, level up, earn rewards!
                    </p>

                    <div className="hp-pills fade-in">
                        {features.map(f => (
                            <span key={f.label} className="hp-pill" style={{ background: f.color + 'cc', color: f.text }}>
                                {f.label}
                            </span>
                        ))}
                    </div>

                    <div className="hp-btns fade-in">
                        <button className="hp-btn-primary" onClick={() => navigate('/login')}>
                            Get Started Free
                        </button>
                        <button className="hp-btn-secondary" onClick={() => navigate('/login')}>
                            Login
                        </button>
                    </div>

                    <div className="hp-stats fade-in">
                        <div className="hp-stat">
                            <span className="hp-stat-num">1000+</span>
                            <span className="hp-stat-label">Questions</span>
                        </div>
                        <div className="hp-stat-div" />
                        <div className="hp-stat">
                            <span className="hp-stat-num">3</span>
                            <span className="hp-stat-label">Difficulty Levels</span>
                        </div>
                        <div className="hp-stat-div" />
                        <div className="hp-stat">
                            <span className="hp-stat-num">AI</span>
                            <span className="hp-stat-label">Powered</span>
                        </div>
                    </div>
                </div>

                
            </section>

            {/* ── How it works ── */}
            <section className="hp-how">
                <div className="hp-section-inner">
                    <p className="hp-section-tag">How it works</p>
                    <h2 className="hp-section-title">Three steps to exam success</h2>
                    <div className="hp-steps">
                        {steps.map((s, i) => (
                            <div key={s.num} className="hp-step-card">
                                <div className="hp-step-num" style={{ background: s.color, boxShadow: `0 4px 0 ${s.color}88` }}>
                                    {s.num}
                                </div>
                                <h3 className="hp-step-title">{s.title}</h3>
                                <p className="hp-step-desc">{s.desc}</p>
                                {i < 2 && <div className="hp-step-arrow">›</div>}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Features ── */}
            <section className="hp-features-section">
                <div className="hp-section-inner">
                    <p className="hp-section-tag">Features</p>
                    <h2 className="hp-section-title">Everything a student needs</h2>
                    <div className="hp-feat-grid">
                        {[
                            { icon: '📚', title: 'Topic Lessons', desc: 'Read full lessons with formulas, examples and worked solutions before each test.', color: '#ede9fe', border: '#c4b5fd' },
                            { icon: '⚡', title: 'Adaptive Tests', desc: 'Get 5 correct in a row and your difficulty increases — just like the real 11+ exam.', color: '#d1fae5', border: '#6ee7b7' },
                            { icon: '🏆', title: 'Rewards System', desc: 'Earn coins, points and badges as you progress from Beginner to Advanced level.', color: '#fef3c7', border: '#fde68a' },
                            { icon: '📊', title: 'Parent Dashboard', desc: 'Parents see full progress reports — scores, time spent, topics and level reached.', color: '#e0f2fe', border: '#bae6fd' },
                            { icon: '🤖', title: 'AI Questions', desc: 'After 50 questions, the AI automatically generates 50 new fresh questions for you.', color: '#fce7f3', border: '#f9a8d4' },
                            { icon: '💡', title: 'Instant Feedback', desc: 'Every wrong answer shows a full step-by-step explanation so you learn from mistakes.', color: '#fff7ed', border: '#fed7aa' },
                        ].map(f => (
                            <div key={f.title} className="hp-feat-card" style={{ background: f.color, borderColor: f.border }}>
                                <span className="hp-feat-icon">{f.icon}</span>
                                <h3 className="hp-feat-title">{f.title}</h3>
                                <p className="hp-feat-desc">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="hp-cta">
                <div className="hp-section-inner hp-cta-inner">
                    <h2 className="hp-cta-title">Ready to start practising?</h2>
                    <p className="hp-cta-sub">Join students already preparing for their 11+ entrance exam — completely free.</p>
                    <button className="hp-btn-primary hp-btn-big" onClick={() => navigate('/login')}>
                        Create Free Account
                    </button>
                </div>
            </section>

            <footer className="hp-footer">
                <span>© 2025 11+ Exam Prep</span>
                <span className="hp-footer-dot" />
                <span>Built for students aged 10–13</span>
            </footer>
        </div>
    )
}