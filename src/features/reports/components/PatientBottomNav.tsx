import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, MessageSquare, ClipboardList, FileText, BookOpen } from 'lucide-react'
import { ROUTES } from '@configs/app.config'

export default function PatientBottomNav() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-[84px] bg-white border-t border-surface-container-low flex justify-between items-center px-4 z-[50] shadow-[0_-8px_32px_rgba(0,0,0,0.05)] rounded-t-[32px]">
      {/* Left Side: Home & Chat */}
      <div className="flex flex-1 justify-around items-center">
        <NavItem to={ROUTES.PATIENT_DASHBOARD} icon={<Home size={22} />} label="Home" active={location.pathname === ROUTES.PATIENT_DASHBOARD} />
        <NavItem to={ROUTES.PATIENT_CHAT} icon={<MessageSquare size={22} />} label="Chat" active={location.pathname === ROUTES.PATIENT_CHAT} />
      </div>

      {/* Center FAB: Lapor */}
      <div className="relative -top-8 flex justify-center flex-none">
        <Link
          to={ROUTES.PATIENT_REPORT_NEW}
          className="w-16 h-16 rounded-full bg-primary flex flex-col items-center justify-center text-on-primary shadow-lg shadow-primary/30 transition-transform active:scale-95 border-[6px] border-surface-container-low"
        >
          <ClipboardList size={28} strokeWidth={3} />
        </Link>
      </div>

      {/* Right Side: Hasil & Edukasi */}
      <div className="flex flex-1 justify-around items-center">
        <NavItem to={ROUTES.PATIENT_HISTORY} icon={<FileText size={22} />} label="Riwayat" active={location.pathname === ROUTES.PATIENT_HISTORY} />
        <NavItem to={ROUTES.PATIENT_EDUCATION} icon={<BookOpen size={22} />} label="Tips" active={location.pathname === ROUTES.PATIENT_EDUCATION} />
      </div>
    </nav>
  )
}

function NavItem({ to, icon, label, active }: { to: string, icon: React.ReactElement, label: string, active: boolean }) {
  return (
    <Link
      to={to}
      className={`
        flex flex-col items-center gap-1.5 p-2 transition-all duration-300
        ${active ? 'text-primary scale-105' : 'text-on-surface-variant'}
      `}
    >
      <div className={`
        p-1.5 rounded-xl transition-all
        ${active ? 'bg-primary-container' : 'bg-transparent'}
      `}>
        {React.cloneElement(icon, {
          // @ts-ignore - Lucide icons accept these props
          strokeWidth: active ? 2.5 : 2,
          size: 20
        })}
      </div>
      <span className={`
        font-headline text-[0.65rem] tracking-tight
        ${active ? 'font-bold' : 'font-medium'}
      `}>
        {label}
      </span>
    </Link>
  )
}
