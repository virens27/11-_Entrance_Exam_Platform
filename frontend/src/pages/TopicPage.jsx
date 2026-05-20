import { useParams, useNavigate } from 'react-router-dom'

const topicMeta = {
    number: {
        name: 'Number & Arithmetic', emoji: '🔢',
        color: '#7c3aed', pale: '#ede9fe', border: '#c4b5fd', shadow: '#c4b5fd',
        gradient: 'linear-gradient(135deg,#7c3aed,#a855f7)',
        desc: 'Master fractions, decimals, percentages, prime numbers, squares and advanced arithmetic.',
        subtopics: ['Fractions & Decimals', 'Percentages', 'Prime Numbers', 'Square & Cube Numbers', 'Negative Numbers', 'Factors & Multiples'],
    },
    algebra: {
        name: 'Algebra & Logic', emoji: '📐',
        color: '#0891b2', pale: '#e0f2fe', border: '#7dd3fc', shadow: '#7dd3fc',
        gradient: 'linear-gradient(135deg,#0891b2,#06b6d4)',
        desc: 'Solve word problems, linear equations and basic inequalities with confidence.',
        subtopics: ['Word Problems', 'Linear Equations', 'Basic Inequalities', 'Number Patterns', 'Substitution'],
    },
    geometry: {
        name: 'Geometry & Measure', emoji: '📏',
        color: '#059669', pale: '#d1fae5', border: '#6ee7b7', shadow: '#6ee7b7',
        gradient: 'linear-gradient(135deg,#059669,#10b981)',
        desc: 'Understand 2D and 3D shapes, area, perimeter, volume, bearings, scale and circles.',
        subtopics: ['Area & Perimeter', 'Volume & Surface Area', 'Circles & Polygons', 'Symmetry', 'Bearings', 'Scale Factor'],
    },
    data: {
        name: 'Data & Probability', emoji: '📊',
        color: '#d97706', pale: '#fef3c7', border: '#fde68a', shadow: '#fde68a',
        gradient: 'linear-gradient(135deg,#d97706,#f59e0b)',
        desc: 'Explore probability, ratios, proportions and averages using real data.',
        subtopics: ['Basic Probability', 'Ratios & Proportions', 'Mean, Median, Mode', 'Charts & Graphs', 'Data Interpretation'],
    },
    patterns: {
        name: 'Pattern Recognition', emoji: '🧩',
        color: '#db2777', pale: '#fce7f3', border: '#f9a8d4', shadow: '#f9a8d4',
        gradient: 'linear-gradient(135deg,#db2777,#ec4899)',
        desc: 'Develop logical reasoning skills and solve mathematical puzzles and sequences.',
        subtopics: ['Number Sequences', 'Shape Patterns', 'Logical Puzzles', 'Matrix Reasoning', 'Odd One Out'],
    },
}

export default function TopicPage() {
    const { topicName } = useParams()
    const navigate = useNavigate()
    const topic = topicMeta[topicName]

    if (!topic) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: "'Nunito',sans-serif", color: '#7c3aed', fontSize: 18 }}>
            Topic not found.
            <button
                onClick={() => navigate('/student')}
                style={{ marginLeft: 12, color: '#7c3aed', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontFamily: "'Nunito',sans-serif" }}
            >
                Go back
            </button>
        </div>
    )

    return (
        <div style={{ fontFamily: "'Nunito',sans-serif", minHeight: '100vh', background: '#f0f4ff', padding: '20px 16px 60px' }}>

            {/* Back */}
            <button
                onClick={() => navigate('/student')}
                style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: 'white', border: '3px solid #e8e0ff', color: '#7c3aed',
                    padding: '8px 18px', borderRadius: 999, fontSize: 13, fontWeight: 700,
                    cursor: 'pointer', fontFamily: "'Nunito',sans-serif", marginBottom: 24
                }}
            >
                ← Back to Dashboard
            </button>

            <div style={{ maxWidth: 1100, margin: '0 auto' }}>

                {/* Topic header */}
                <div style={{ background: topic.gradient, borderRadius: 28, padding: '28px 28px', marginBottom: 20, boxShadow: `0 6px 0 ${topic.shadow}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(255,255,255,0.2)', border: '3px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem', flexShrink: 0 }}>
                            {topic.emoji}
                        </div>
                        <div>
                            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'white', marginBottom: 4 }}>{topic.name}</div>
                            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>{topic.desc}</div>
                        </div>
                    </div>
                </div>

                {/* Subtopics covered */}
                <div style={{ background: 'white', border: `3px solid ${topic.border}`, borderRadius: 22, padding: '20px 22px', marginBottom: 20 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: topic.color, marginBottom: 12 }}>
                        Topics covered
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {topic.subtopics.map(s => (
                            <span key={s} style={{ background: topic.pale, border: `2px solid ${topic.border}`, color: topic.color, padding: '5px 14px', borderRadius: 999, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 10 }}>✓</span> {s}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Mode cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>

                    {/* Practice card — unchanged */}
                    <div
                        onClick={() => navigate(`/student/practice/${topicName}`)}
                        style={{ background: 'white', border: '3px solid #7dd3fc', borderRadius: 24, padding: '28px 22px', cursor: 'pointer', transition: 'all .25s', boxShadow: '0 6px 0 #7dd3fc', display: 'flex', flexDirection: 'column' }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 10px 0 #7dd3fc' }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 0 #7dd3fc' }}
                    >
                        <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg,#0891b2,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', marginBottom: 14, boxShadow: '0 4px 0 #0369a1' }}>📚</div>
                        <div style={{ background: '#e0f2fe', border: '2px solid #7dd3fc', color: '#075985', padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: .5, width: 'fit-content', marginBottom: 12 }}>Learn First</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1e1b4b', marginBottom: 10 }}>Practice Mode</div>
                        <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.7, marginBottom: 18, flex: 1 }}>Read the full lesson with explanations and worked examples, then take a practice test with instant feedback.</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                            {['Full lesson & formulas', 'Practice questions', 'Instant answer feedback', 'Step-by-step explanations'].map(f => (
                                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#4b5563', fontWeight: 600 }}>
                                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#0891b2', flexShrink: 0 }} />{f}
                                </div>
                            ))}
                        </div>
                        <button style={{ width: '100%', padding: '13px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#0891b2,#06b6d4)', color: 'white', fontSize: 14, fontWeight: 900, cursor: 'pointer', fontFamily: "'Nunito',sans-serif", boxShadow: '0 4px 0 #0369a1' }}>
                            Start Practice →
                        </button>
                    </div>

                    {/* Test card — unchanged */}
                    <div
                        onClick={() => navigate(`/student/level/${topicName}`)}
                        style={{ background: 'white', border: `3px solid ${topic.border}`, borderRadius: 24, padding: '28px 22px', cursor: 'pointer', transition: 'all .25s', boxShadow: `0 6px 0 ${topic.shadow}`, display: 'flex', flexDirection: 'column' }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = `0 10px 0 ${topic.shadow}` }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 6px 0 ${topic.shadow}` }}
                    >
                        <div style={{ width: 64, height: 64, borderRadius: 18, background: topic.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', marginBottom: 14, boxShadow: `0 4px 0 ${topic.shadow}` }}>✏️</div>
                        <div style={{ background: topic.pale, border: `2px solid ${topic.border}`, color: topic.color, padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: .5, width: 'fit-content', marginBottom: 12 }}>Test Yourself</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1e1b4b', marginBottom: 10 }}>Test Mode</div>
                        <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.7, marginBottom: 18, flex: 1 }}>Select your difficulty level first, then begin a timed test with questions matched to your chosen stage.</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                            {['Choose difficulty first', 'Timed MCQ test', 'Adaptive progression', 'Hints & explanations'].map(f => (
                                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#4b5563', fontWeight: 600 }}>
                                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: topic.color, flexShrink: 0 }} />{f}
                                </div>
                            ))}
                        </div>
                        <button style={{ width: '100%', padding: '13px', borderRadius: 14, border: 'none', background: topic.gradient, color: 'white', fontSize: 14, fontWeight: 900, cursor: 'pointer', fontFamily: "'Nunito',sans-serif", boxShadow: `0 4px 0 ${topic.shadow}` }}>
                            Choose Level →
                        </button>
                    </div>

                    {/* ── Challenge card — NEW ── */}
                    <div
                        onClick={() => navigate(`/student/challenge/${topicName}`)}
                        style={{ background: 'white', border: '3px solid #f9a8d4', borderRadius: 24, padding: '28px 22px', cursor: 'pointer', transition: 'all .25s', boxShadow: '0 6px 0 #f9a8d4', display: 'flex', flexDirection: 'column' }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 10px 0 #f9a8d4' }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 0 #f9a8d4' }}
                    >
                        <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', marginBottom: 14, boxShadow: '0 4px 0 #6d28d9' }}>⚡</div>
                        <div style={{ background: '#fce7f3', border: '2px solid #f9a8d4', color: '#9d174d', padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: .5, width: 'fit-content', marginBottom: 12 }}>All Levels Mixed</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1e1b4b', marginBottom: 10 }}>Challenge Mode</div>
                        <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.7, marginBottom: 18, flex: 1 }}>50 mixed questions from Bronze to Diamond across all difficulty levels. Can you conquer them all in 60 minutes?</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                            {['50 mixed questions', 'All sublevels: Bronze → Diamond', '60 minute timer', 'Full report at the end'].map(f => (
                                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#4b5563', fontWeight: 600 }}>
                                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#7c3aed', flexShrink: 0 }} />{f}
                                </div>
                            ))}
                        </div>
                        <button style={{ width: '100%', padding: '13px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: 'white', fontSize: 14, fontWeight: 900, cursor: 'pointer', fontFamily: "'Nunito',sans-serif", boxShadow: '0 4px 0 #6d28d9' }}>
                            Start Challenge ⚡
                        </button>
                    </div>

                </div>
            </div>
        </div>
    )
}