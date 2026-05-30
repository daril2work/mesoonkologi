import { Routes, Route, Navigate } from 'react-router-dom'
import { ROUTES } from '@configs/app.config'
import { Suspense, lazy } from 'react'
import { useAuthStore } from '@features/auth/store'
import { ProtectedRoute } from '@features/auth/components/ProtectedRoute'
import { AppLoader } from '@components/ui/AppLoader'
import { ErrorBoundary } from '@components/ui/ErrorBoundary'
import { useAppInitializer } from './useAppInitializer'

// Lazy load pages (code splitting)
const LoginPage = lazy(() => import('@features/auth/pages/LoginPage'))
const RegisterPage = lazy(() => import('@features/auth/pages/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('@features/auth/pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@features/auth/pages/ResetPasswordPage'))
const PatientDashboard = lazy(() => import('@features/reports/pages/PatientDashboard'))
const ReportForm = lazy(() => import('@features/reports/pages/ReportForm'))
const PatientHistory = lazy(() => import('@features/reports/pages/PatientHistory'))
const PatientChat = lazy(() => import('@features/reports/pages/PatientChat'))
const PatientEducation = lazy(() => import('@features/reports/pages/PatientEducation'))
const PharmacistDashboard = lazy(() => import('@features/reports/pages/PharmacistDashboard'))
const PharmacistPatients = lazy(() => import('@features/reports/pages/PharmacistPatients'))
const PharmacistPatientDetail = lazy(() => import('@features/reports/pages/PharmacistPatientDetail'))
const PharmacistEducation = lazy(() => import('@features/reports/pages/PharmacistEducation'))
const PharmacistSchedule = lazy(() => import('@features/reports/pages/PharmacistSchedule'))
const PharmacistReportDetail = lazy(() => import('@features/reports/pages/PharmacistReportDetail'))
const PharmacistReportForm = lazy(() => import('@features/reports/pages/PharmacistReportForm'))
const PharmacistHelp = lazy(() => import('@features/reports/pages/PharmacistHelp'))
const PharmacistSettings = lazy(() => import('@features/reports/pages/PharmacistSettings'))
const PharmacistChat = lazy(() => import('@features/reports/pages/PharmacistChat'))
const PatientPlaceholderPage = lazy(() => import('@features/reports/pages/PatientPlaceholderPage'))
const PrivacyPolicy = lazy(() => import('@features/auth/pages/PrivacyPolicy'))
const DeactivatedAccountPage = lazy(() => import('@features/auth/pages/DeactivatedAccountPage'))

// Clinician Pages
const ClinicianWatchlist = lazy(() => import('@features/clinician/pages/ClinicianWatchlist'))
const ClinicianPatientDetail = lazy(() => import('@features/clinician/pages/ClinicianPatientDetail'))
const ClinicianHistory = lazy(() => import('@features/clinician/pages/ClinicianHistory'))

export default function AppRouter() {
  const { isInitialized } = useAuthStore()
  
  // P2-5: Auth & Cache initialization logic
  useAppInitializer()

  if (!isInitialized) {
    return <AppLoader />
  }

  return (
    <Suspense fallback={<AppLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
        <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />
        <Route path={ROUTES.PRIVACY_POLICY} element={<PrivacyPolicy />} />
        <Route path={ROUTES.DEACTIVATED} element={<DeactivatedAccountPage />} />
        <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.LOGIN} replace />} />

        {/* Patient Routes */}
        <Route element={<ProtectedRoute allowedRoles={['patient']} />}>
          <Route path={ROUTES.PATIENT_DASHBOARD} element={<PatientDashboard />} />
          <Route path={ROUTES.PATIENT_REPORT_NEW} element={<ReportForm />} />
          <Route path={ROUTES.PATIENT_HISTORY} element={<PatientHistory />} />
          <Route path={ROUTES.PATIENT_CHAT} element={<PatientChat />} />
          <Route path={ROUTES.PATIENT_EDUCATION} element={<PatientEducation />} />
          <Route path={ROUTES.PATIENT_PROFILE} element={<PatientPlaceholderPage />} />
        </Route>

        {/* Pharmacist Routes */}
        <Route element={<ErrorBoundary><ProtectedRoute allowedRoles={['pharmacist', 'admin']} /></ErrorBoundary>}>
          <Route path={ROUTES.PHARMA_DASHBOARD} element={<PharmacistDashboard />} />
          <Route path={ROUTES.PHARMA_REPORT_NEW} element={<PharmacistReportForm />} />
          <Route path={ROUTES.PHARMA_PATIENTS} element={<PharmacistPatients />} />
          <Route path={ROUTES.PHARMA_PATIENT_DETAIL} element={<PharmacistPatientDetail />} />
          <Route path={ROUTES.PHARMA_EDUCATION} element={<PharmacistEducation />} />
          <Route path={ROUTES.PHARMA_SCHEDULE} element={<PharmacistSchedule />} />
          <Route path={ROUTES.PHARMA_REPORT_DETAIL} element={<PharmacistReportDetail />} />
          <Route path={ROUTES.PHARMA_HELP} element={<PharmacistHelp />} />
          <Route path={ROUTES.PHARMA_SETTINGS} element={<PharmacistSettings />} />
          <Route path={ROUTES.PHARMA_CHAT} element={<PharmacistChat />} />
        </Route>

        {/* Doctor Routes */}
        <Route element={<ErrorBoundary><ProtectedRoute allowedRoles={['doctor', 'admin']} /></ErrorBoundary>}>
          <Route path={ROUTES.DOCTOR_WATCHLIST} element={<ClinicianWatchlist />} />
          <Route path={ROUTES.DOCTOR_PATIENT} element={<ClinicianPatientDetail />} />
          <Route path={ROUTES.DOCTOR_HISTORY} element={<ClinicianHistory />} />
        </Route>

        {/* 404 Fallback */}
        <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
      </Routes>
    </Suspense>
  )
}
