import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@lib/supabase'
import { ROUTES } from '@configs/app.config'
import { AppLoader } from '@components/ui/AppLoader'
import { logger } from '@utils/logger'

/**
 * M-01 Implementation (Option B):
 * Redirects the user from a standalone report view to the full patient profile
 * to maintain clinical context.
 */
export default function PharmacistReportDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  useEffect(() => {
    async function getPatientIdAndRedirect() {
      if (!id) return

      try {
        const { data, error } = await supabase
          .from('symptom_reports')
          .select('patient_id')
          .eq('id', id)
          .single()

        if (error) throw error
        if (data?.patient_id) {
          // Redirect to /pharma/patient/:id/:reportId
          const targetPath = ROUTES.PHARMA_PATIENT_DETAIL
            .replace(':id', data.patient_id)
            .replace(':reportId?', id)
          
          navigate(targetPath, { replace: true })
        } else {
          throw new Error('Patient ID not found for this report')
        }
      } catch (err) {
        logger.error('[PharmacistReportDetail] Redirect Error:', err instanceof Error ? err : undefined)
        navigate(ROUTES.PHARMA_DASHBOARD, { replace: true })
      }
    }

    getPatientIdAndRedirect()
  }, [id, navigate])

  return <AppLoader />
}
