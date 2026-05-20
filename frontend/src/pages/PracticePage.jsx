import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

const lessons = {
    number: {
        title: 'Number & Arithmetic', emoji: '🔢',
        color: '#7c3aed', pale: '#ede9fe', border: '#c4b5fd', gradient: 'linear-gradient(135deg,#7c3aed,#a855f7)',
        sections: [
            {
                heading: 'Fractions',
                content: `A fraction represents a part of a whole. It has two parts — the numerator (top number) and the denominator (bottom number).\n\nTo add or subtract fractions, you must make the denominators the same first by finding the LCM.\n\nTo multiply fractions, multiply the numerators together and the denominators together.\n\nTo divide fractions, flip the second fraction upside down and then multiply.`,
                formulas: ['a/b + c/d = (ad + bc) / bd', 'a/b × c/d = ac / bd', 'a/b ÷ c/d = a/b × d/c'],
                example: { q: 'Calculate: 2/3 + 3/4', steps: ['Find common denominator: LCM of 3 and 4 = 12', 'Convert: 2/3 = 8/12 and 3/4 = 9/12', 'Add: 8/12 + 9/12 = 17/12', 'Simplify: 17/12 = 1 and 5/12'], answer: '1 and 5/12' },
            },
            {
                heading: 'Percentages',
                content: `A percentage is a fraction out of 100. The % symbol means "per hundred".\n\nTo find a percentage of an amount, divide by 100 then multiply by the percentage.\n\nTo convert a fraction to a percentage, divide the numerator by the denominator and multiply by 100.\n\nPercentage change = (change ÷ original) × 100.`,
                formulas: ['X% of Y = (X ÷ 100) × Y', 'Fraction to %: (top ÷ bottom) × 100', '% change = (change ÷ original) × 100'],
                example: { q: 'Find 35% of 240', steps: ['Method: (35 ÷ 100) × 240', '= 0.35 × 240', '= 84'], answer: '84' },
            },
            {
                heading: 'Prime & Square Numbers',
                content: `A prime number has exactly two factors: 1 and itself. The first few primes are 2, 3, 5, 7, 11, 13, 17...\n\nNote: 1 is NOT a prime number. 2 is the only even prime!\n\nA square number is a number multiplied by itself (n²).\nA cube number is a number multiplied by itself three times (n³).`,
                formulas: ['Square: n² = n × n', 'Cube: n³ = n × n × n', '√(n²) = n'],
                example: { q: 'Is 97 a prime number?', steps: ['Check primes up to √97 ≈ 9.8', 'Try 2: 97 is odd — No', 'Try 3: 9+7=16, not div by 3 — No', 'Try 5: does not end in 0/5 — No', 'Try 7: 97÷7 = 13.8 — No', 'No prime divides 97!'], answer: 'Yes, 97 is prime!' },
            },
        ],
    },
    algebra: {
        title: 'Algebra & Logic', emoji: '📐',
        color: '#0891b2', pale: '#e0f2fe', border: '#7dd3fc', gradient: 'linear-gradient(135deg,#0891b2,#06b6d4)',
        sections: [
            {
                heading: 'Solving Equations',
                content: `An equation shows two expressions are equal. To solve it, find the value of the unknown variable.\n\nThe golden rule: whatever you do to one side, you MUST do the same to the other side!\n\nWork step by step — undo addition with subtraction, undo multiplication with division.`,
                formulas: ['If ax + b = c, then x = (c - b) / a', 'If x/a = b, then x = a × b'],
                example: { q: 'Solve: 3x + 7 = 22', steps: ['Subtract 7 from both sides: 3x = 15', 'Divide both sides by 3: x = 5'], answer: 'x = 5' },
            },
            {
                heading: 'Word Problems',
                content: `Word problems describe a real situation using words. You need to translate the words into maths!\n\nKey words to look for:\n• "more than", "increased by" → addition (+)\n• "less than", "decreased by" → subtraction (−)\n• "times", "product of" → multiplication (×)\n• "shared equally", "each" → division (÷)\n• "is", "equals", "gives" → equals (=)`,
                formulas: ['Read carefully and underline key info', 'Let x = the unknown', 'Write the equation, then solve!'],
                example: { q: 'Aisha has 3 times as many stickers as Ben. Together they have 48. How many does Aisha have?', steps: ['Let Ben have x stickers', 'Aisha has 3x stickers', 'Together: x + 3x = 48', '4x = 48, so x = 12', 'Aisha has 3 × 12 = 36'], answer: 'Aisha has 36 stickers' },
            },
        ],
    },
    geometry: {
        title: 'Geometry & Measure', emoji: '📏',
        color: '#059669', pale: '#d1fae5', border: '#6ee7b7', gradient: 'linear-gradient(135deg,#059669,#10b981)',
        sections: [
            {
                heading: 'Area & Perimeter',
                content: `Area is the space INSIDE a 2D shape. Perimeter is the total distance AROUND the outside.\n\nRemember: area is always in square units (cm², m²) and perimeter is in regular units (cm, m).`,
                formulas: ['Rectangle: Area = length × width', 'Triangle: Area = ½ × base × height', 'Circle: Area = π × r²', 'Circle: Circumference = 2 × π × r'],
                example: { q: 'Find the area of a triangle with base 8cm and height 5cm', steps: ['Formula: Area = ½ × base × height', 'Area = ½ × 8 × 5', 'Area = ½ × 40 = 20 cm²'], answer: '20 cm²' },
            },
            {
                heading: 'Volume & Surface Area',
                content: `Volume is the amount of 3D space inside a shape. Surface area is the total area of ALL faces of a 3D shape.\n\nVolume uses cubic units (cm³, m³) and surface area uses square units (cm², m²).`,
                formulas: ['Cuboid: Volume = l × w × h', 'Cuboid: Surface Area = 2(lw + lh + wh)', 'Cylinder: Volume = π × r² × h', 'Cube: Volume = s³'],
                example: { q: 'Volume of a cuboid: 5cm × 3cm × 4cm', steps: ['Formula: Volume = l × w × h', 'Volume = 5 × 3 × 4', 'Volume = 60 cm³'], answer: '60 cm³' },
            },
        ],
    },
    data: {
        title: 'Data & Probability', emoji: '📊',
        color: '#d97706', pale: '#fef3c7', border: '#fde68a', gradient: 'linear-gradient(135deg,#d97706,#f59e0b)',
        sections: [
            {
                heading: 'Probability',
                content: `Probability measures how likely an event is to happen. It is always between 0 (impossible) and 1 (certain).\n\nProbability can be written as a fraction, decimal or percentage.\n\nThe probability of something NOT happening = 1 − P(event happening).`,
                formulas: ['P(event) = favourable outcomes / total outcomes', 'P(not A) = 1 − P(A)', '0 ≤ P(event) ≤ 1'],
                example: { q: 'A bag has 3 red, 4 blue and 5 green marbles. What is P(blue)?', steps: ['Total = 3 + 4 + 5 = 12', 'Favourable (blue) = 4', 'P(blue) = 4/12', 'Simplify: P(blue) = 1/3'], answer: '1/3 (≈ 0.333)' },
            },
            {
                heading: 'Mean, Median & Mode',
                content: `These are three types of averages used to describe a set of data.\n\nMean: the sum of all values divided by how many there are.\nMedian: the middle value when data is in order.\nMode: the value that appears most often.\nRange: the difference between highest and lowest.`,
                formulas: ['Mean = sum of values ÷ number of values', 'Median = middle value (sort first!)', 'Range = highest − lowest'],
                example: { q: 'Find the mean of: 4, 7, 2, 9, 3', steps: ['Add all: 4+7+2+9+3 = 25', 'Count: 5 values', 'Mean = 25 ÷ 5 = 5'], answer: 'Mean = 5' },
            },
        ],
    },
    patterns: {
        title: 'Pattern Recognition', emoji: '🧩',
        color: '#db2777', pale: '#fce7f3', border: '#f9a8d4', gradient: 'linear-gradient(135deg,#db2777,#ec4899)',
        sections: [
            {
                heading: 'Number Sequences',
                content: `A sequence is a list of numbers following a rule. The rule tells you how to get from one term to the next.\n\nCommon sequences:\n• Arithmetic: add or subtract a fixed number (e.g. 2, 5, 8, 11...)\n• Geometric: multiply or divide by a fixed number (e.g. 2, 6, 18, 54...)\n• Square numbers: 1, 4, 9, 16, 25...\n• Triangle numbers: 1, 3, 6, 10, 15...`,
                formulas: ['Arithmetic nth term = a + (n-1)d', 'a = first term, d = common difference'],
                example: { q: 'Find the next two terms: 3, 7, 11, 15, __, __', steps: ['Pattern: 7-3=4, 11-7=4 — add 4 each time!', 'Next: 15 + 4 = 19', 'Then: 19 + 4 = 23'], answer: '19 and 23' },
            },
            {
                heading: 'Logical Reasoning',
                content: `Logical reasoning tests your ability to think systematically and spot patterns or rules.\n\nTips for solving puzzles:\n• Look at what changes and what stays the same\n• Try working backwards from the answer\n• Eliminate impossible options one by one\n• Draw diagrams or tables if it helps!`,
                formulas: ['Identify the rule → Apply it consistently', 'If A → B, and A is true, then B must be true'],
                example: { q: 'If all Bloops are Razzles, and all Razzles are Lazzles, are all Bloops definitely Lazzles?', steps: ['All Bloops → Razzles (given)', 'All Razzles → Lazzles (given)', 'So: Bloops → Razzles → Lazzles', 'Yes! All Bloops must be Lazzles'], answer: 'Yes — logical chain confirmed!' },
            },
        ],
    },
}

export default function PracticePage() {
    const { topicName } = useParams()
    const navigate = useNavigate()
    const [activeSection, setActive] = useState(0)

    const lesson = lessons[topicName]
    if (!lesson) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: "'Nunito',sans-serif" }}>
            Topic not found. <button onClick={() => navigate('/student')} style={{ marginLeft: 12, color: '#7c3aed', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Go back</button>
        </div>
    )

    const section = lesson.sections[activeSection]
    const totalSecs = lesson.sections.length

    return (
        <div style={{ fontFamily: "'Nunito',sans-serif", minHeight: '100vh', background: '#f0f4ff', padding: '20px 16px 60px' }}>

            {/* Back */}
            <button onClick={() => navigate(`/student/topic/${topicName}`)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'white', border: '3px solid #e8e0ff', color: '#7c3aed', padding: '8px 18px', borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito',sans-serif", marginBottom: 22 }}>
                ← Back
            </button>

            <div style={{ maxWidth: 680, margin: '0 auto' }}>

                {/* Header */}
                <div style={{ background: lesson.gradient, borderRadius: 24, padding: '20px 24px', marginBottom: 18, boxShadow: `0 5px 0 ${lesson.border}` }}>
                    <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.4)', color: 'white', padding: '3px 12px', borderRadius: 999, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: .8, marginBottom: 8 }}>Practice Mode</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', marginBottom: 4 }}>{lesson.emoji} {lesson.title}</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>Read each section carefully, then take the practice test!</div>
                </div>

                {/* Section tabs */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
                    {lesson.sections.map((s, i) => (
                        <button key={i} onClick={() => setActive(i)}
                            style={{ padding: '8px 18px', borderRadius: 999, border: `3px solid ${activeSection === i ? lesson.color : '#e5e7eb'}`, background: activeSection === i ? lesson.pale : 'white', color: activeSection === i ? lesson.color : '#9ca3af', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: "'Nunito',sans-serif", transition: 'all .2s' }}>
                            {i + 1}. {s.heading}
                        </button>
                    ))}
                </div>

                {/* Lesson card */}
                <div style={{ background: 'white', border: `3px solid ${lesson.border}`, borderRadius: 24, padding: '28px', marginBottom: 14, boxShadow: `0 5px 0 ${lesson.border}` }}>

                    {/* Section header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: lesson.pale, border: `2px solid ${lesson.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: lesson.color, flexShrink: 0 }}>
                            {activeSection + 1}/{totalSecs}
                        </div>
                        <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#1e1b4b' }}>{section.heading}</h2>
                    </div>

                    {/* Content text */}
                    <div style={{ marginBottom: 22 }}>
                        {section.content.split('\n\n').map((para, i) => (
                            <p key={i} style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.8, marginBottom: 12 }}>{para}</p>
                        ))}
                    </div>

                    {/* Formulas */}
                    <div style={{ background: lesson.pale, border: `3px solid ${lesson.border}`, borderRadius: 16, padding: '18px 20px', marginBottom: 20 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: lesson.color, marginBottom: 12 }}>Key Formulas</div>
                        {section.formulas.map((f, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: lesson.color, flexShrink: 0, marginTop: 5 }} />
                                <code style={{ fontFamily: "'Courier New',monospace", fontSize: 14, color: '#1e1b4b', background: 'rgba(255,255,255,0.7)', padding: '3px 10px', borderRadius: 8 }}>{f}</code>
                            </div>
                        ))}
                    </div>

                    {/* Worked example */}
                    <div style={{ background: '#f8f4ff', border: '3px solid #e8e0ff', borderRadius: 16, padding: '20px' }}>
                        <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: '#9ca3af', marginBottom: 10 }}>Worked Example</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#1e1b4b', marginBottom: 14, lineHeight: 1.5 }}>{section.example.q}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                            {section.example.steps.map((step, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                    <span style={{ width: 26, height: 26, borderRadius: 8, background: lesson.pale, border: `2px solid ${lesson.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: lesson.color, flexShrink: 0 }}>{i + 1}</span>
                                    <span style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.6, paddingTop: 2 }}>{step}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ background: lesson.pale, border: `3px solid ${lesson.border}`, borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: lesson.color }}>Answer:</span>
                            <span style={{ fontSize: 15, fontWeight: 900, color: '#1e1b4b' }}>{section.example.answer}</span>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
                    <button onClick={() => setActive(p => Math.max(0, p - 1))} disabled={activeSection === 0}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 12, border: '3px solid #e8e0ff', background: 'white', color: activeSection === 0 ? '#d1d5db' : '#7c3aed', fontSize: 14, fontWeight: 700, cursor: activeSection === 0 ? 'not-allowed' : 'pointer', fontFamily: "'Nunito',sans-serif" }}>
                        ← Previous
                    </button>

                    {/* Dots */}
                    <div style={{ display: 'flex', gap: 8 }}>
                        {lesson.sections.map((_, i) => (
                            <div key={i} onClick={() => setActive(i)} style={{ width: 10, height: 10, borderRadius: '50%', background: activeSection === i ? lesson.color : '#e5e7eb', cursor: 'pointer', transition: 'background .2s' }} />
                        ))}
                    </div>

                    {activeSection < totalSecs - 1 ? (
                        <button onClick={() => setActive(p => Math.min(totalSecs - 1, p + 1))}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 12, border: `3px solid ${lesson.border}`, background: lesson.pale, color: lesson.color, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>
                            Next →
                        </button>
                    ) : (
                        <button onClick={() => navigate(`/student/practice-test/${topicName}`)}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 12, border: 'none', background: '#7c3aed', color: 'white', fontSize: 14, fontWeight: 900, cursor: 'pointer', fontFamily: "'Nunito',sans-serif", boxShadow: '0 4px 0 #5b21b6' }}>
                            Start Practice Test →
                        </button>
                    )}
                </div>

                {/* CTA banner */}
                <div style={{ background: lesson.gradient, borderRadius: 20, padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', boxShadow: `0 5px 0 ${lesson.border}` }}>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 900, color: 'white', marginBottom: 2 }}>Ready to test yourself?</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>30 min · Instant feedback · Step-by-step explanations</div>
                    </div>
                    <button onClick={() => navigate(`/student/practice-test/${topicName}`)}
                        style={{ padding: '11px 22px', borderRadius: 14, border: 'none', background: '#fde68a', color: '#78350f', fontSize: 14, fontWeight: 900, cursor: 'pointer', fontFamily: "'Nunito',sans-serif", boxShadow: '0 4px 0 #d97706', whiteSpace: 'nowrap' }}>
                        Start Practice Test →
                    </button>
                </div>

            </div>
        </div>
    )
}