// src/hooks/useQuestionSession.js
// ================================================================
//  Fetches questions from Supabase pool by main_level + sublevel.
//
//  FIX: shownIdsRef is now GLOBAL for the entire session.
//  Once a question ID is seen, it is NEVER shown again in this
//  session — even after sublevel changes.
//  Previously shownIdsRef was reset on sublevel change which
//  caused repeats when the same question appeared in multiple combos.
// ================================================================

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../utils/supabaseClient'

export const SUBLEVEL_ORDER = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond']

const FULL_PROGRESSION = [
  { mainLevel: 'Beginner',     sublevel: 'Bronze'   },
  { mainLevel: 'Beginner',     sublevel: 'Silver'   },
  { mainLevel: 'Beginner',     sublevel: 'Gold'     },
  { mainLevel: 'Beginner',     sublevel: 'Platinum' },
  { mainLevel: 'Beginner',     sublevel: 'Diamond'  },
  { mainLevel: 'Intermediate', sublevel: 'Bronze'   },
  { mainLevel: 'Intermediate', sublevel: 'Silver'   },
  { mainLevel: 'Intermediate', sublevel: 'Gold'     },
  { mainLevel: 'Intermediate', sublevel: 'Platinum' },
  { mainLevel: 'Intermediate', sublevel: 'Diamond'  },
  { mainLevel: 'Advanced',     sublevel: 'Bronze'   },
  { mainLevel: 'Advanced',     sublevel: 'Silver'   },
  { mainLevel: 'Advanced',     sublevel: 'Gold'     },
  { mainLevel: 'Advanced',     sublevel: 'Platinum' },
  { mainLevel: 'Advanced',     sublevel: 'Diamond'  },
]

const DIFFICULTY_SLICE = {
  beginner:     { start: 0,  end: 5  },
  intermediate: { start: 5,  end: 10 },
  advanced:     { start: 10, end: 15 },
  medium:       { start: 5,  end: 10 },
  hard:         { start: 10, end: 15 },
}

const STREAK_TO_ADVANCE = 5
const MAX_PER_SUBLEVEL  = 15
const VALID_TOPICS      = ['number', 'algebra', 'geometry', 'data', 'patterns']

function normaliseTopic(topicName) {
  if (!topicName || topicName === 'all') return null
  const lower = topicName.toLowerCase().replace(/s$/, '')
  return VALID_TOPICS.includes(lower) ? lower : topicName.toLowerCase()
}

export function useQuestionSession(difficulty, topicName, user) {
  const diffKey = difficulty?.toLowerCase() ?? 'beginner'
  const slice   = DIFFICULTY_SLICE[diffKey] ?? DIFFICULTY_SLICE.beginner
  const SESSION_PROGRESSION = FULL_PROGRESSION.slice(slice.start, slice.end)

  const [levelIdx,        setLevelIdx]        = useState(0)
  const [levelStreak,     setLevelStreak]     = useState(0)
  const [levelAttempts,   setLevelAttempts]   = useState(0)
  const [question,        setQuestion]        = useState(null)
  const [loadingQuestion, setLoadingQuestion] = useState(true)
  const [poolEmpty,       setPoolEmpty]       = useState(false)
  const [fetchError,      setFetchError]      = useState(null)
  const [score,           setScore]           = useState(0)
  const [streak,          setStreak]          = useState(0)
  const [totalAttempted,  setTotalAttempted]  = useState(0)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [levelUpInfo,     setLevelUpInfo]     = useState({
    active: false, reason: null, newSublevel: null, newMainLevel: null,
  })

  const levelIdxRef      = useRef(0)
  const levelStreakRef   = useRef(0)
  const levelAttemptsRef = useRef(0)
  const streakRef        = useRef(0)
  const totalRef         = useRef(0)
  const questionRef      = useRef(null)
  const isFetchingRef    = useRef(false)

  // ── KEY FIX: Global seen IDs — NEVER reset during session ───────
  // This single Set tracks ALL question IDs shown in this session,
  // across all sublevel changes. This prevents any question from
  // appearing twice regardless of which sublevel it belongs to.
  const globalSeenIdsRef = useRef([])

  useEffect(() => { levelIdxRef.current = levelIdx },           [levelIdx])
  useEffect(() => { levelStreakRef.current = levelStreak },     [levelStreak])
  useEffect(() => { levelAttemptsRef.current = levelAttempts }, [levelAttempts])
  useEffect(() => { streakRef.current = streak },               [streak])
  useEffect(() => { totalRef.current = totalAttempted },        [totalAttempted])
  useEffect(() => { questionRef.current = question },           [question])

  const fetchNextQuestion = useCallback(async (overrideIdx) => {
    if (!user) return
    if (isFetchingRef.current) return

    isFetchingRef.current = true
    setLoadingQuestion(true)
    setPoolEmpty(false)
    setFetchError(null)

    const idx = overrideIdx ?? levelIdxRef.current
    const { mainLevel, sublevel } = SESSION_PROGRESSION[idx]
    const topic = normaliseTopic(topicName)

    try {
      let query = supabase
        .from('questions')
        .select('id, topic, subtopic, main_level, sublevel, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, hint, difficulty_score')
        .eq('main_level', mainLevel)
        .eq('sublevel', sublevel)
        .order('difficulty_score', { ascending: true })

      if (topic) query = query.eq('topic', topic)

      // Use GLOBAL seen IDs — never show a question twice in entire session
      if (globalSeenIdsRef.current.length > 0) {
        query = query.not('id', 'in', `(${globalSeenIdsRef.current.join(',')})`)
      }

      const { data, error } = await query.limit(10)

      if (error) {
        console.error('[useQuestionSession] DB error:', error.message)
        setFetchError('Could not load question. Please check your connection.')
        setLoadingQuestion(false)
        isFetchingRef.current = false
        return
      }

      if (!data || data.length === 0) {
        // Try without topic filter if we have one (fallback for thin pools)
        if (topic) {
          let fallbackQuery = supabase
            .from('questions')
            .select('id, topic, subtopic, main_level, sublevel, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, hint, difficulty_score')
            .eq('main_level', mainLevel)
            .eq('sublevel', sublevel)
            .order('difficulty_score', { ascending: true })

          if (globalSeenIdsRef.current.length > 0) {
            fallbackQuery = fallbackQuery.not('id', 'in', `(${globalSeenIdsRef.current.join(',')})`)
          }

          const { data: fbData } = await fallbackQuery.limit(10)
          if (fbData && fbData.length > 0) {
            const picked = fbData[0]
            globalSeenIdsRef.current.push(picked.id)
            setQuestion(picked)
            setPoolEmpty(false)
            setLoadingQuestion(false)
            isFetchingRef.current = false
            return
          }
        }

        // Genuinely empty — pool not generated yet
        console.warn(`[useQuestionSession] Pool empty for ${mainLevel}/${sublevel}`)
        setPoolEmpty(true)
        setLoadingQuestion(false)
        isFetchingRef.current = false
        return
      }

      const picked = data[0]
      globalSeenIdsRef.current.push(picked.id)
      setQuestion(picked)
      setPoolEmpty(false)
      setLoadingQuestion(false)

    } catch (err) {
      console.error('[useQuestionSession] Unexpected error:', err)
      setFetchError('Something went wrong. Please refresh the page.')
      setLoadingQuestion(false)
    } finally {
      isFetchingRef.current = false
    }
  }, [user, topicName, diffKey]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (user) fetchNextQuestion(0)
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const markAnswered = useCallback(async (isCorrect) => {
    if (!questionRef.current || !user) return

    const newTotal         = totalRef.current + 1
    const newLevelAttempts = levelAttemptsRef.current + 1
    setTotalAttempted(newTotal)
    setLevelAttempts(newLevelAttempts)
    totalRef.current         = newTotal
    levelAttemptsRef.current = newLevelAttempts

    const newLevelStreak = isCorrect ? levelStreakRef.current + 1 : 0
    const newStreak      = isCorrect ? streakRef.current + 1      : 0
    if (isCorrect) setScore(s => s + 1)
    setLevelStreak(newLevelStreak)
    setStreak(newStreak)
    levelStreakRef.current = newLevelStreak
    streakRef.current      = newStreak

    const advanceByStreak     = newLevelStreak >= STREAK_TO_ADVANCE
    const advanceByCompletion = newLevelAttempts >= MAX_PER_SUBLEVEL

    if (advanceByStreak || advanceByCompletion) {
      const reason  = advanceByStreak ? 'streak' : 'completion'
      const nextIdx = levelIdxRef.current + 1

      if (nextIdx >= SESSION_PROGRESSION.length) {
        setSessionComplete(true)
        return { levelUp: true, reason, sessionComplete: true }
      }

      const nextLevel = SESSION_PROGRESSION[nextIdx]
      levelIdxRef.current      = nextIdx
      levelStreakRef.current   = 0
      levelAttemptsRef.current = 0
      // NOTE: globalSeenIdsRef is NOT reset here — that's the fix

      setLevelIdx(nextIdx)
      setLevelStreak(0)
      setLevelAttempts(0)
      setLevelUpInfo({
        active:       true,
        reason,
        newSublevel:  nextLevel.sublevel,
        newMainLevel: nextLevel.mainLevel,
      })
      setTimeout(() => setLevelUpInfo({
        active: false, reason: null, newSublevel: null, newMainLevel: null,
      }), 3500)

      return { levelUp: true, reason, sessionComplete: false, nextLevel }
    }

    return { levelUp: false, reason: null, sessionComplete: false }

  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const currentLevel = SESSION_PROGRESSION[levelIdx]

  return {
    question,
    loadingQuestion,
    poolEmpty,
    fetchError,
    sessionComplete,
    levelUpInfo,
    sessionStats: {
      mainLevel:     currentLevel?.mainLevel,
      sublevel:      currentLevel?.sublevel,
      streak,
      levelStreak,
      levelAttempts,
      totalAttempted,
      score,
      levelIndex:    levelIdx,
      totalLevels:   SESSION_PROGRESSION.length,
    },
    fetchNextQuestion,
    markAnswered,
  }
}