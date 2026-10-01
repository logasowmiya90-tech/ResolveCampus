import './App.css'
import './pages/GrievancePages.css'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import {
  CTASection,
  CaseTimeline,
  FeaturesSection,
  Footer,
  Hero,
  HowItWorks,
  Navbar,
  ProblemSection,
} from './components/LandingSections.jsx'
import LoginPage from './pages/LoginPage.jsx'
import CaseDetails from './pages/CaseDetails.jsx'
import MyGrievances from './pages/MyGrievances.jsx'
import AdminCaseDetails from './pages/AdminCaseDetails.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import AdminLayout from './pages/AdminLayout.jsx'
import OfficerCaseDetails from './pages/OfficerCaseDetails.jsx'
import OfficerDashboard from './pages/OfficerDashboard.jsx'
import OfficerLayout from './pages/OfficerLayout.jsx'
import RolePlaceholder from './pages/RolePlaceholder.jsx'
import StudentDashboard from './pages/StudentDashboard.jsx'
import StudentOverview from './pages/StudentOverview.jsx'
import SubmitGrievance from './pages/SubmitGrievance.jsx'
import { dashboardPathForRole } from './services/auth.js'

function App() {
  const { isAuthenticated, user } = useAuth()

  return (
    <Routes>
      <Route
        path="/"
        element={(
          <>
            <a className="skip-link" href="#main-content">Skip to content</a>
            <Navbar />
            <main id="main-content">
              <Hero />
              <ProblemSection />
              <HowItWorks />
              <FeaturesSection />
              <CaseTimeline />
              <CTASection />
            </main>
            <Footer />
          </>
        )}
      />
      <Route path="/login" element={isAuthenticated ? <Navigate to={dashboardPathForRole(user.role)} replace /> : <LoginPage />} />
      <Route
        path="/student"
        element={(
          <ProtectedRoute allowedRole="STUDENT">
            <StudentDashboard />
          </ProtectedRoute>
        )}
      >
        <Route index element={<StudentOverview />} />
        <Route path="submit" element={<SubmitGrievance />} />
        <Route path="grievances" element={<MyGrievances />} />
        <Route path="grievances/:caseId" element={<CaseDetails />} />
      </Route>
      <Route
        path="/officer"
        element={(
          <ProtectedRoute allowedRole="OFFICER">
            <OfficerLayout />
          </ProtectedRoute>
        )}
      >
        <Route index element={<OfficerDashboard />} />
        <Route path="grievances/:caseId" element={<OfficerCaseDetails />} />
      </Route>
      <Route
        path="/admin"
        element={(
          <ProtectedRoute allowedRole="ADMIN">
            <AdminLayout />
          </ProtectedRoute>
        )}
      >
        <Route index element={<AdminDashboard />} />
        <Route path="grievances/:caseId" element={<AdminCaseDetails />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
