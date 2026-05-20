// frontend/src/utils/startTestSession.js

const START_LEVEL_TAG = {
  beginner: 'B1',
  medium: 'I1',
  hard: 'A1',
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://11plusapi.novaca.in'

export async function startTestSession({
  userId,
  topic,
  difficulty,
  testType = 'test',
}) {
  const levelTag = START_LEVEL_TAG[difficulty] || 'B1'

  const res = await fetch(`${BACKEND_URL}/api/ai/start-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      studentId: userId,
      topic,
      difficulty,
      levelTag,
      testType,
      count: 45,
    }),
  })

  const data = await res.json()

  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to start test session')
  }

  return data.session_id
}