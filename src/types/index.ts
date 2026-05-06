// ============================================================
// MESO App — Types Barrel (Entry Point)
// ============================================================
// This file re-exports all types for backward compatibility.
// Prefer importing directly from domain files for better clarity:
//   import type { AuthUser } from '@features/auth/types'
//   import type { SymptomReport } from '@features/reports/types'
//   import type { ApiResponse } from '@types/api'

export type * from '@features/auth/types'
export type * from '@features/reports/types'
export type * from '@features/chat/types'
export type * from '@features/education/types'
export type * from '@features/schedules/types'
export type * from './api'
export type * from './ui'
