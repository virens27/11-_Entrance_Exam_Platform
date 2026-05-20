// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import AvatarGuide from './components/AvatarGuide.jsx'

import HomePage            from './pages/HomePage.jsx'
import LoginPage           from './pages/LoginPage.jsx'
import RolePage            from './pages/RolePage.jsx'
import LevelPage           from './pages/LevelPage.jsx'
import StudentDashboard    from './pages/StudentDashboard.jsx'
import TopicPage           from './pages/TopicPage.jsx'
import PracticePage        from './pages/PracticePage.jsx'
import PracticeTest        from './pages/PracticeTest.jsx'
import TestPage            from './pages/TestPage.jsx'
import ChallengePage       from './pages/Challengepage.jsx'
import ParentDashboard     from './pages/ParentDashboard.jsx'
import RewardsPage         from './pages/RewardsPage.jsx'
import ExamInstructionPage from './pages/ExamInstructionPage.jsx'

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" />
}

export default function App() {
  return (
    <BrowserRouter>
      <AvatarGuide />
      <Routes>
        {/* Public */}
        <Route path="/"      element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Role selection */}
        <Route path="/role" element={
          <ProtectedRoute><RolePage /></ProtectedRoute>
        } />

        {/* Level selection */}
        <Route path="/student/level/:topicName" element={
          <ProtectedRoute><LevelPage /></ProtectedRoute>
        } />

        {/* Exam instructions */}
        <Route path="/student/exam-instructions/:topicName/:difficulty" element={
          <ProtectedRoute><ExamInstructionPage /></ProtectedRoute>
        } />

        {/* Student area */}
        <Route path="/student" element={
          <ProtectedRoute><StudentDashboard /></ProtectedRoute>
        } />
        <Route path="/student/topic/:topicName" element={
          <ProtectedRoute><TopicPage /></ProtectedRoute>
        } />
        <Route path="/student/practice/:topicName" element={
          <ProtectedRoute><PracticePage /></ProtectedRoute>
        } />
        <Route path="/student/practice-test/:topicName" element={
          <ProtectedRoute><PracticeTest /></ProtectedRoute>
        } />

        {/* Test mode */}
        <Route path="/student/test/:topicName/:difficulty" element={
          <ProtectedRoute><TestPage /></ProtectedRoute>
        } />

        {/* ── Challenge mode — NEW ── */}
        <Route path="/student/challenge/:topicName" element={
          <ProtectedRoute><ChallengePage /></ProtectedRoute>
        } />

        <Route path="/student/rewards" element={
          <ProtectedRoute><RewardsPage /></ProtectedRoute>
        } />

        {/* Parent area */}
        <Route path="/parent/:studentId" element={<ParentDashboard />} />
        <Route path="/parent"            element={<ParentDashboard />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}