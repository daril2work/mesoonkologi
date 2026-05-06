// ============================================================
// Shared UI Utility Types
// ============================================================
import type { UserRole } from '@features/auth/types'

export interface SelectOption {
  value: string
  label: string
}

export interface NavItem {
  label: string
  path: string
  icon?: string
  roles?: UserRole[]
  badge?: number
}
