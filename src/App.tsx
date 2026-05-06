// ============================================================
// MESO App — App.tsx
//
// A-01: File ini sebelumnya berisi boilerplate Vite yang
// tidak pernah digunakan (counter, logo placeholder, dsb).
//
// Entry point sesungguhnya ada di:
//   src/main.tsx → AppProviders → AppRouter
//
// File ini dipertahankan sebagai barrel export untuk
// menghindari breaking change pada tooling yang mungkin
// meng-import dari sini secara eksplisit.
// ============================================================

// Re-export komponen utama untuk backward compatibility
export { default as AppRouter } from './app/AppRouter'
export { default as AppProviders } from './app/AppProviders'
