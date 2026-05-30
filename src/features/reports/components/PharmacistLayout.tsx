import React from 'react'
import { useAuthStore } from '@features/auth/store'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { clsx } from 'clsx'
import { ROUTES } from '@configs/app.config'
import { useNotifications } from '../hooks/useNotifications'
import { supabase } from '@lib/supabase'
import { useQueryClient } from '@tanstack/react-query'

interface PharmacistLayoutProps {
  children: React.ReactNode
}

export default function PharmacistLayout({ children }: PharmacistLayoutProps) {
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [isNotifOpen, setIsNotifOpen] = React.useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const currentSearch = searchParams.get('search') ?? ''
  const queryClient = useQueryClient()
  
  // Destructure all needed counts from the hook
  const { unreadCount, reportsCount, messagesCount, queueIds } = useNotifications()

  const handleMarkReportsRead = (e: React.MouseEvent) => {
    e.stopPropagation()
    const readReportIds = JSON.parse(localStorage.getItem('read_pharma_reports') || '[]')
    queueIds.forEach((id: string) => {
      if (!readReportIds.includes(id)) {
        readReportIds.push(id)
      }
    })
    localStorage.setItem('read_pharma_reports', JSON.stringify(readReportIds))
    // Trigger re-render of useNotifications by invalidating the queue it depends on
    queryClient.invalidateQueries({ queryKey: ['pharmacistQueue'] })
  }

  const handleMarkMessagesRead = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) return
    await supabase
      .from('chat_messages')
      .update({ is_read: true })
      .eq('receiver_id', user.id)
      .eq('is_read', false)
      
    // Refetch the unread messages count implicitly
    queryClient.invalidateQueries({ queryKey: ['chatMessages'] })
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value) {
      setSearchParams({ search: value })
    } else {
      searchParams.delete('search')
      setSearchParams(searchParams)
    }
  }

  const navItems = [
    { label: 'Antrean Laporan', icon: 'assignment', path: '/pharma/dashboard' },
    { label: 'Data Pasien', icon: 'group', path: '/pharma/patients' },
    { label: 'Manajemen Edukasi', icon: 'school', path: '/pharma/education' },
    { label: 'Pengaturan Jadwal', icon: 'calendar_today', path: '/pharma/schedule' },
  ]

  return (
    <div className="bg-surface text-on-surface min-h-screen font-body antialiased">
      {/* SIDEBAR BACKDROP FOR MOBILE */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={clsx(
        "h-screen w-64 fixed left-0 top-0 bg-stone-50 border-r border-stone-100 font-headline flex flex-col py-6 z-50 overflow-y-auto transition-transform duration-300 ease-in-out",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="px-6 mb-10 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>medical_services</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-teal-800 leading-tight">Sentuhan Nurani</h1>
              <p className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold">Clinical Portal</p>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-1 text-stone-400 hover:text-teal-600 active:scale-95 transition-all flex items-center justify-center"
            title="Close Menu"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300",
                  isActive 
                    ? "bg-teal-600 text-white shadow-lg shadow-teal-600/20 font-bold" 
                    : "text-stone-500 hover:text-teal-600 hover:bg-stone-100"
                )}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="px-3 border-t border-stone-100 pt-4">
          <Link 
            to={ROUTES.PHARMA_HELP}
            onClick={() => setIsSidebarOpen(false)}
            className="w-full flex items-center gap-3 px-4 py-3 text-stone-500 hover:text-teal-600 hover:bg-stone-100 transition-colors duration-300 rounded-lg text-left"
          >
            <span className="material-symbols-outlined">help_outline</span>
            <span className="text-sm">Bantuan</span>
          </Link>
          <button 
            onClick={() => {
              setIsSidebarOpen(false)
              logout()
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-stone-500 hover:text-teal-600 hover:bg-stone-100 transition-colors duration-300 rounded-lg text-left"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="text-sm">Keluar</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="lg:ml-64 ml-0 flex flex-col min-h-screen">
        {/* HEADER */}
        <header className="h-16 border-b border-stone-100 bg-white/80 backdrop-blur-xl sticky top-0 z-40 px-4 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 lg:flex-none">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-1 text-stone-600 hover:text-teal-600 active:scale-95 transition-all flex items-center justify-center"
              title="Open Menu"
            >
              <span className="material-symbols-outlined text-2xl">menu</span>
            </button>
            <div className="flex items-center bg-stone-100 rounded-full px-4 py-1.5 w-full max-w-[150px] sm:max-w-xs md:w-96">
              <span className="material-symbols-outlined text-stone-400 text-lg">search</span>
              <input 
                value={currentSearch}
                onChange={handleSearchChange}
                className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder-stone-400 outline-none" 
                placeholder="Cari nama pasien..." 
                type="text"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3 lg:gap-6">
            <div className="flex items-center gap-2 lg:gap-4">
              <div className="relative">
                <button 
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="text-stone-600 hover:text-teal-600 transition-all opacity-90 active:scale-95 relative"
                >
                  <span className="material-symbols-outlined">notifications</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600 text-[9px] text-white items-center justify-center font-black">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    </span>
                  )}
                </button>

                {/* Dropdown Notifikasi */}
                {isNotifOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
                    <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-stone-100 py-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-6 pb-3 border-b border-stone-50 flex justify-between items-center">
                        <h4 className="font-bold text-on-surface">Notifikasi</h4>
                        <span className="text-[10px] font-black text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full uppercase tracking-widest">{unreadCount} Baru</span>
                      </div>
                      <div className="max-h-[320px] overflow-y-auto">
                        {unreadCount === 0 ? (
                          <div className="py-10 px-6 text-center">
                            <p className="text-xs text-stone-400 font-medium">Tidak ada notifikasi baru.</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-stone-50">
                            {reportsCount > 0 && (
                              <div className="px-6 py-4 hover:bg-stone-50 transition-colors cursor-pointer flex justify-between items-center gap-3" onClick={() => { navigate(ROUTES.PHARMA_DASHBOARD); setIsNotifOpen(false); }}>
                                <div>
                                  <p className="text-xs font-bold text-on-surface">Laporan Baru</p>
                                  <p className="text-[10px] text-stone-500 mt-1">Ada {reportsCount} laporan yang perlu ditinjau.</p>
                                </div>
                                <button
                                  onClick={handleMarkReportsRead}
                                  className="p-1.5 hover:bg-stone-200 rounded-full text-stone-400 hover:text-teal-600 transition-all shrink-0 self-center"
                                  title="Tandai dibaca"
                                >
                                  <span className="material-symbols-outlined text-lg leading-none">check_circle</span>
                                </button>
                              </div>
                            )}
                            {messagesCount > 0 && (
                              <div className="px-6 py-4 hover:bg-stone-50 transition-colors cursor-pointer flex justify-between items-center gap-3" onClick={() => { navigate(ROUTES.PHARMA_CHAT); setIsNotifOpen(false); }}>
                                <div>
                                  <p className="text-xs font-bold text-teal-600">Pesan Konsultasi</p>
                                  <p className="text-[10px] text-stone-500 mt-1">Ada {messagesCount} pesan baru dari pasien.</p>
                                </div>
                                <button
                                  onClick={handleMarkMessagesRead}
                                  className="p-1.5 hover:bg-stone-200 rounded-full text-stone-400 hover:text-teal-600 transition-all shrink-0 self-center"
                                  title="Tandai dibaca"
                                >
                                  <span className="material-symbols-outlined text-lg leading-none">check_circle</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              <button 
                onClick={() => navigate('/pharma/settings')}
                className="text-stone-600 hover:text-teal-600 transition-all opacity-90 active:scale-95"
              >
                <span className="material-symbols-outlined">settings</span>
              </button>
            </div>

            <div className="h-8 w-[1px] bg-stone-200"></div>
            
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-teal-700">Apoteker</p>
                <p className="text-[10px] text-stone-500">{user?.fullName ?? 'Sari'}</p>
              </div>
              <img 
                alt="Avatar" 
                className="w-9 h-9 rounded-full object-cover ring-2 ring-teal-50" 
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName ?? 'Sari')}&background=0d9488&color=ffffff`}
              />
            </div>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="flex-1 bg-stone-50/50">
          {children}
        </main>
      </div>
    </div>
  )
}
