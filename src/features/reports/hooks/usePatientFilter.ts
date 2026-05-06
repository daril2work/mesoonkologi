// ============================================================
// MESO App — usePatientFilter Hook
// S-05: Extract filter/sort logic dari PharmacistPatients.tsx
// Single Responsibility: filtering + sorting + search state
// ============================================================
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { PatientDirectoryItem } from '../types'

type SortKey = 'status' | 'name' | 'oldest'
type StatusFilter = 'all' | 'Butuh Tindakan' | 'Observasi' | 'Stabil'

const STATUS_PRIORITY: Record<string, number> = {
  'Butuh Tindakan': 0,
  'Observasi': 1,
  'Stabil': 2,
}

interface UsePatientFilterResult {
  filteredPatients: PatientDirectoryItem[]
  searchTerm: string
  sortKey: SortKey
  statusFilter: StatusFilter
  setSortKey: (key: SortKey) => void
  setStatusFilter: (status: StatusFilter) => void
}

export function usePatientFilter(
  patients: PatientDirectoryItem[] | undefined
): UsePatientFilterResult {
  const [searchParams] = useSearchParams()
  const searchTerm = searchParams.get('search')?.toLowerCase() ?? ''

  const [sortKey, setSortKey] = useState<SortKey>('status')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const filteredPatients = useMemo(() => {
    if (!patients) return []

    return patients
      // 1. Filter by search
      .filter(p =>
        p.fullName.toLowerCase().includes(searchTerm) ||
        p.id.toLowerCase().includes(searchTerm)
      )
      // 2. Filter by status
      .filter(p => statusFilter === 'all' || p.overallStatus === statusFilter)
      // 3. Sort
      .sort((a, b) => {
        if (sortKey === 'name') {
          return a.fullName.localeCompare(b.fullName, 'id')
        }
        if (sortKey === 'oldest') {
          const dateA = a.lastReportDate ? new Date(a.lastReportDate).getTime() : 0
          const dateB = b.lastReportDate ? new Date(b.lastReportDate).getTime() : 0
          return dateA - dateB
        }
        // Default: sort by status priority
        return (STATUS_PRIORITY[a.overallStatus] ?? 99) - (STATUS_PRIORITY[b.overallStatus] ?? 99)
      })
  }, [patients, searchTerm, sortKey, statusFilter])

  return { filteredPatients, searchTerm, sortKey, statusFilter, setSortKey, setStatusFilter }
}
