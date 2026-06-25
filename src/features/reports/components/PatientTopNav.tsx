import { useState } from 'react'
import { Bell, LogOut } from 'lucide-react'
import { useAuthStore } from '@features/auth/store'
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '../api/useNotifications'
import toast from 'react-hot-toast'
import ProfileModal from './ProfileModal'
import NotificationPanel from './NotificationPanel'

export default function PatientTopNav() {
  const { user, logout } = useAuthStore()
  const { data: notifications = [] } = useNotifications()
  const [showNotifications, setShowNotifications] = useState(false)
  const markAsRead = useMarkNotificationRead()
  const markAllAsRead = useMarkAllNotificationsRead()
  const [showProfileModal, setShowProfileModal] = useState(false)

  const unreadCount = notifications.length

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Berhasil keluar')
    } catch (error) {
      toast.error('Gagal keluar')
    }
  }

  const handleMarkRead = (id: string, type: string) => {
    markAsRead.mutate({ id, type: type as 'schedule' | 'chat' | 'evaluation' })
  }

  const handleMarkAllRead = (notifs: typeof notifications) => {
    markAllAsRead.mutate(notifs)
  }

  return (
    <>
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
          </div>

          <button 
            aria-label="Logout" 
            onClick={handleLogout}
            className="p-2 text-error hover:bg-error-container rounded-full transition-colors"
          >
            <LogOut size={20} />
          </button>
          <button 
            aria-label="Buka Profil"
            onClick={() => setShowProfileModal(true)}
            className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-container shadow-sm hover:scale-105 transition-all duration-200 focus:outline-none shrink-0"
          >
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Pasien')}&background=e5f9f5&color=046b5e`}
              alt={user?.fullName || 'Profil'}
              className="w-full h-full object-cover"
            />
          </button>
        </div>
      </header>

      <NotificationPanel 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
        notifications={notifications}
        onMarkRead={handleMarkRead}
        onMarkAllRead={handleMarkAllRead}
      />

      <ProfileModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
        userId={user?.id}
        userFullName={user?.fullName ?? undefined}
      />
    </>
  )
}
