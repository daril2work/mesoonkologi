// ============================================================
// Auth Feature — Protected Route Wrapper
// ============================================================
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store'
import { ROUTES } from '@configs/app.config'
import { AppLoader } from '@components/ui/AppLoader'

interface ProtectedRouteProps {
  allowedRoles?: ('patient' | 'pharmacist' | 'doctor' | 'admin')[]
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { session, user, isInitialized } = useAuthStore()
  const location = useLocation()

  // Tunggu Supabase selesai resolve auth state saat boot pertama
  if (!isInitialized) {
    return <AppLoader message="Memeriksa sesi..." />
  }

  // Belum login → redirect ke login, simpan intended path
  if (!session || !user) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />
  }

  // H-05: Role tidak sesuai → arahkan ke dashboard default role mereka,
  // BUKAN ke HOME (yang langsung redirect ke LOGIN → potensi infinite loop)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const roleDefaultRoutes: Record<string, string> = {
      patient: ROUTES.PATIENT_DASHBOARD,
      pharmacist: ROUTES.PHARMA_DASHBOARD,
      doctor: ROUTES.DOCTOR_WATCHLIST,
      admin: ROUTES.PHARMA_DASHBOARD,
    }
    const safeFallback = roleDefaultRoutes[user.role] ?? ROUTES.LOGIN
    return <Navigate to={safeFallback} replace />
  }

  return <Outlet />
}
