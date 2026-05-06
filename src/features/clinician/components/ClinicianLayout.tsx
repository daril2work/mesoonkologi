import React from 'react'
import { useAuthStore } from '@features/auth/store'
import { Link, useLocation } from 'react-router-dom'
import { clsx } from 'clsx'
import { ROUTES } from '@configs/app.config'

interface ClinicianLayoutProps {
  children: React.ReactNode
  title?: string
  showBack?: boolean
  backPath?: string
}

export default function ClinicianLayout({ children, title, showBack, backPath = ROUTES.DOCTOR_WATCHLIST }: ClinicianLayoutProps) {
  const { user, logout } = useAuthStore()
  const location = useLocation()

  // CS-01: Satu definisi navItems — dipakai desktop nav DAN bottom nav
  // A-02: Gunakan ROUTES constants, tidak ada hardcoded path
  const navItems = [
    { label: 'Daftar Pantau', icon: 'analytics', path: ROUTES.DOCTOR_WATCHLIST },
    { label: 'Riwayat Pasien', icon: 'history', path: ROUTES.DOCTOR_HISTORY },
  ]

  return (
    <div className="bg-[#f6fbf9] min-h-screen font-body antialiased">
      {/* TOP NAVBAR */}
      <header className="sticky top-0 w-full h-16 md:h-20 bg-white/90 backdrop-blur-md flex items-center justify-between px-4 md:px-10 z-50 shadow-sm border-b border-stone-100">
        <div className="flex items-center gap-4 md:gap-12 overflow-x-hidden">
          {/* Logo Section / Back Button on Mobile */}
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            {showBack && (
              <Link to={backPath} className="md:hidden w-10 h-10 flex items-center justify-center text-stone-600 mr-1">
                <span className="material-symbols-outlined">arrow_back</span>
              </Link>
            )}
            
            <div className={clsx("w-7 h-7 md:w-8 md:h-8 bg-[#006a60] rounded-lg flex items-center justify-center", showBack && "hidden md:flex")}>
              <span className="material-symbols-outlined text-white text-lg md:text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>clinical_notes</span>
            </div>
            
            <h1 className="text-sm md:text-xl font-bold text-[#006a60] headline-font tracking-tight whitespace-nowrap">
              {showBack ? (
                <span className="md:hidden text-teal-900">{title || 'Detail'}</span>
              ) : null}
              <span className={clsx(showBack ? "hidden md:inline" : "inline")}>
                SN <span className="hidden sm:inline">Clinical Portal</span>
              </span>
            </h1>
          </div>

          {/* Navigation Links - Desktop Only */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={clsx(
                    "text-sm font-bold transition-all relative py-2 whitespace-nowrap",
                    isActive 
                      ? "text-[#006a60]" 
                      : "text-stone-400 hover:text-stone-600"
                  )}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#006a60] rounded-full"></span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Profile & Settings */}
        <div className="flex items-center gap-3 md:gap-6 shrink-0">
          <div className="flex items-center gap-3 md:gap-5">
            <button className="text-stone-400 hover:text-stone-600 transition-all active:scale-95">
              <span className="material-symbols-outlined text-xl md:text-2xl">notifications</span>
            </button>
            <button 
              onClick={() => logout()}
              className="text-stone-400 hover:text-red-500 transition-all active:scale-95 flex items-center gap-2 group"
            >
              <span className="material-symbols-outlined text-xl md:text-2xl">logout</span>
              <span className="hidden lg:inline text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Keluar</span>
            </button>
          </div>
          <div className="h-6 md:h-8 w-[1px] bg-stone-200"></div>
          <div className="flex items-center gap-2 md:gap-3">
            <img 
              alt="Avatar" 
              className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover border-2 border-white shadow-md" 
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName ?? 'Dokter')}&background=006a60&color=ffffff`}
            />
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-[1600px] mx-auto py-6 md:py-10 px-4 md:px-10 pb-28 md:pb-10">
        {children}
      </main>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-lg border-t border-stone-100 flex items-center justify-around px-10 py-4 z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] rounded-t-[32px]">
        {/* CS-01: Reuse navItems yang sama dengan desktop nav */}
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.label}
              to={item.path}
              className={clsx(
                'flex flex-col items-center gap-1.5 transition-all',
                isActive ? 'text-[#006a60]' : 'text-stone-300'
              )}
            >
              <span
                className="material-symbols-outlined text-2xl"
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                {item.icon}
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
              {isActive && <span className="w-1 h-1 bg-[#006a60] rounded-full" />}
            </Link>
          )
        })}
      </nav>

      {/* FOOTER - Hidden on very small screens for efficiency */}
      <footer className="hidden sm:flex max-w-[1600px] mx-auto px-10 py-12 border-t border-stone-100 justify-between items-center text-[11px] font-bold text-stone-400 uppercase tracking-widest">
        <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-green-600 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            Sentuhan Nurani Medical Compliance 2024
        </div>
        <div className="flex gap-8">
            <Link to="#" className="hover:text-primary transition-colors">Panduan Sistem</Link>
            <Link to="#" className="hover:text-primary transition-colors">Kebijakan Privasi Data Pasien</Link>
            <Link to="#" className="hover:text-primary transition-colors">Bantuan Teknis</Link>
        </div>
      </footer>
    </div>
  )
}
