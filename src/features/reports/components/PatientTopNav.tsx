import { useState } from 'react'
import { Bell, LogOut, MessageSquare, CheckCircle, Calendar, X } from 'lucide-react'
import { useAuthStore } from '@features/auth/store'
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '../api/useNotifications'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'
import { clsx } from 'clsx'

export default function PatientTopNav() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const { data: notifications = [] } = useNotifications()
  const [showNotifications, setShowNotifications] = useState(false)
  const markAsRead = useMarkNotificationRead()
  const markAllAsRead = useMarkAllNotificationsRead()

  const unreadCount = notifications.length

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Berhasil keluar')
    } catch (error) {
      toast.error('Gagal keluar')
    }
  }

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md sticky top-0 z-[100] border-b border-surface-container-low">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-primary-container rounded-xl flex items-center justify-center shadow-sm">
          <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            favorite
          </span>
        </div>
        <div className="flex flex-col">
          <span className="font-headline font-extrabold text-[0.8rem] text-primary leading-none uppercase tracking-tighter">
            Sahabat
          </span>
          <span className="font-headline font-extrabold text-[0.8rem] text-primary leading-none uppercase tracking-tighter">
            Pejuang
          </span>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <button 
            aria-label="Notifikasi" 
            onClick={() => setShowNotifications(true)}
            className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors relative"
          >
            <Bell size={22} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-error text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* NOTIFICATION OVERLAY (Bottom Sheet style on Mobile) */}
          {showNotifications && (
            <div className="fixed inset-0 z-[200] flex items-end sm:items-start sm:justify-end p-0 sm:p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowNotifications(false)}>
              <div 
                className="w-full sm:w-[400px] bg-white rounded-t-[32px] sm:rounded-[24px] shadow-2xl h-[70vh] sm:h-auto sm:max-h-[600px] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300 sm:slide-in-from-right"
                onClick={(e) => e.stopPropagation()}
              >
                <header className="px-6 py-5 border-b border-stone-50 flex justify-between items-center bg-white sticky top-0 z-10">
                  <div className="flex items-baseline gap-2">
                    <h3 className="font-headline font-extrabold text-on-surface">Pemberitahuan</h3>
                    {notifications.length > 0 && (
                      <button 
                        onClick={() => markAllAsRead.mutate(notifications)}
                        className="text-[10px] font-black text-[#1a7a7a] hover:text-[#156363] uppercase tracking-wider transition-colors ml-2"
                      >
                        Tandai semua dibaca
                      </button>
                    )}
                  </div>
                  <button onClick={() => setShowNotifications(false)} className="p-2 bg-stone-50 rounded-full text-stone-400">
                    <X size={18} />
                  </button>
                </header>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {notifications.length === 0 ? (
                    <div className="py-12 text-center">
                      <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Bell className="text-stone-300" size={24} />
                      </div>
                      <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Belum ada kabar baru</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div 
                        key={notif.id}
                        onClick={() => {
                          if (notif.link) navigate(notif.link)
                          setShowNotifications(false)
                        }}
                        className="p-4 rounded-2xl hover:bg-surface-container-low transition-all cursor-pointer flex justify-between items-start gap-4 border border-transparent hover:border-surface-container group/item"
                      >
                        <div className="flex gap-4 overflow-hidden">
                          <div className={clsx(
                            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                            notif.type === 'chat' ? "bg-primary-container/30 text-primary" :
                            notif.type === 'evaluation' ? "bg-tertiary-container/30 text-tertiary" :
                            "bg-amber-100/50 text-amber-600"
                          )}>
                            {notif.type === 'chat' && <MessageSquare size={20} />}
                            {notif.type === 'evaluation' && <CheckCircle size={20} />}
                            {notif.type === 'schedule' && <Calendar size={20} />}
                          </div>
                          <div className="space-y-1 overflow-hidden">
                            <h4 className="font-headline text-sm font-bold text-on-surface truncate">{notif.title}</h4>
                            <p className="font-body text-xs text-on-surface-variant leading-relaxed line-clamp-2">{notif.description}</p>
                            <p className="text-[10px] text-stone-400 font-medium">
                              {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: id })}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation() // Cegah navigasi tautan
                            markAsRead.mutate({ id: notif.id, type: notif.type })
                          }}
                          aria-label="Tandai dibaca"
                          className="p-2 hover:bg-stone-100 rounded-full text-stone-400 hover:text-primary transition-all shrink-0 self-center"
                        >
                          <CheckCircle size={16} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <footer className="p-4 bg-stone-50/50 border-t border-stone-50">
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="w-full py-3 bg-white border border-stone-200 rounded-xl font-headline font-bold text-xs text-stone-500 hover:bg-stone-100"
                  >
                    Tutup
                  </button>
                </footer>
              </div>
            </div>
          )}
        </div>

        <button 
          aria-label="Logout" 
          onClick={handleLogout}
          className="p-2 text-error hover:bg-error-container rounded-full transition-colors"
        >
          <LogOut size={20} />
        </button>
        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-container shadow-sm">
          <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Pasien')}&background=e5f9f5&color=046b5e`}
            alt={user?.fullName || 'Profil'}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </header>
  )
}
