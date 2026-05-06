// ============================================================
// MESO App — Application Constants (Barrel Entry Point)
// ============================================================
// This file is intentionally kept minimal.
// Import directly from domain configs for better tree-shaking:
//   import { ROUTES } from '@configs/routes.config'
//   import { SYMPTOMS_CONFIG } from '@configs/symptoms.config'
//   import { GRADE_CONFIG } from '@configs/grade.config'

export const APP_NAME = 'MESO'
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0'

// Re-exports for backward compatibility
export * from './routes.config'
export * from './grade.config'
