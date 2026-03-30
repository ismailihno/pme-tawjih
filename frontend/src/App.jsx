import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'

import Navbar  from './components/layout/Navbar'
import Footer  from './components/layout/Footer'

// Public
import HomePage           from './pages/HomePage'
import LoginPage          from './pages/auth/LoginPage'
import RegisterPage       from './pages/auth/RegisterPage'
import SchoolsPage        from './pages/schools/SchoolsPage'
import SchoolDetail       from './pages/schools/SchoolDetail'
import AnnouncementsPage  from './pages/announcements/AnnouncementsPage'
import AnnouncementDetail from './pages/announcements/AnnouncementDetail'
import CareersPage        from './pages/careers/CareersPage'   // ← AJOUTÉ

// Student
import StudentDashboard  from './pages/student/StudentDashboard'
import QuestionnairePage from './pages/student/QuestionnairePage'
import ResultsPage       from './pages/student/ResultsPage'
import ProfilePage       from './pages/student/ProfilePage'

// Payments
import PaymentHistory from './pages/payments/PaymentHistory'
import PaymentSuccess from './pages/payments/PaymentSuccess'
import PaymentCancel  from './pages/payments/PaymentCancel'

// Counselor
import CounselorDashboard from './pages/counselor/CounselorDashboard'

// Admin
import AdminDashboard       from './pages/admin/AdminDashboard'
import AdminUsers           from './pages/admin/AdminUsers'
import AdminSchools         from './pages/admin/AdminSchools'
import AdminRecommendations from './pages/admin/AdminRecommendations'
import AdminAdmins          from './pages/admin/AdminAdmins'
import AdminPayments        from './pages/admin/AdminPayments'
import AdminCareers         from './pages/admin/AdminCareers'

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto" />
        <p className="text-on-surface-variant font-body text-sm">Chargement…</p>
      </div>
    </div>
  )
}

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  return user ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}

function CounselorRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (!['counselor','admin'].includes(user.role)) return <Navigate to="/dashboard" replace />
  return children
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  return !user ? children : <Navigate to="/dashboard" replace />
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            {/* Public */}
            <Route path="/"                   element={<HomePage />} />
            <Route path="/schools"            element={<SchoolsPage />} />
            <Route path="/schools/:id"        element={<SchoolDetail />} />
            <Route path="/announcements"      element={<AnnouncementsPage />} />
            <Route path="/announcements/:id"  element={<AnnouncementDetail />} />
            <Route path="/careers"            element={<CareersPage />} />  {/* ← AJOUTÉ */}

            {/* Auth */}
            <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

            {/* Paiements (publics après redirect Stripe) */}
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-cancel"  element={<PaymentCancel />} />

            {/* Étudiant */}
            <Route path="/dashboard"     element={<PrivateRoute><StudentDashboard /></PrivateRoute>} />
            <Route path="/questionnaire" element={<PrivateRoute><QuestionnairePage /></PrivateRoute>} />
            <Route path="/results"       element={<PrivateRoute><ResultsPage /></PrivateRoute>} />
            <Route path="/profile"       element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
            <Route path="/payments"      element={<PrivateRoute><PaymentHistory /></PrivateRoute>} />

            {/* Conseiller */}
            <Route path="/counselor" element={<CounselorRoute><CounselorDashboard /></CounselorRoute>} />

            {/* Admin */}
            <Route path="/admin"                 element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/users"           element={<AdminRoute><AdminUsers /></AdminRoute>} />
            <Route path="/admin/schools"         element={<AdminRoute><AdminSchools /></AdminRoute>} />
            <Route path="/admin/recommendations" element={<AdminRoute><AdminRecommendations /></AdminRoute>} />
            <Route path="/admin/admins"          element={<AdminRoute><AdminAdmins /></AdminRoute>} />
            <Route path="/admin/payments"        element={<AdminRoute><AdminPayments /></AdminRoute>} />
            <Route path="/admin/careers"         element={<AdminRoute><AdminCareers /></AdminRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  )
}