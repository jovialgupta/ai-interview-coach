import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import { AuthProvider, ProtectedRoute } from './auth'
import DashboardPage from './pages/DashboardPage'
import InterviewHistoryPage from './pages/InterviewHistoryPage'
import LandingPage from './pages/LandingPage'
import LearningJourneyPage from './pages/LearningJourneyPage'
import Layout from './pages/Layout'
import LoginPage from './pages/LoginPage'
import OnboardingPage from './pages/OnboardingPage'
import SessionPage from './pages/SessionPage'
import SignupPage from './pages/SignupPage'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/session/:sessionId"
            element={
              <ProtectedRoute>
                <SessionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <InterviewHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/learning-journey"
            element={
              <ProtectedRoute>
                <LearningJourneyPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App
