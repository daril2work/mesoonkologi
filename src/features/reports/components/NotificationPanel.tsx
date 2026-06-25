import { X, Bell, MessageSquare, CheckCircle, Calendar } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'
import { clsx } from 'clsx'
import { useNavigate } from 'react-router-dom'

interface Notification {
  id: string
  title: string
  description: string
  type: 'evaluation' | 'chat' | 'schedule'
  link?: string
  createdAt: string
  isRead: boolean
}

interface NotificationPanelProps {
  isOpen: boolean
  onClose: () => void
  notifications: Notification[]
  onMarkRead: (notifId: string, type: string) => void
  onMarkAllRead: (notifications: Notification[]) => void
}

export default function NotificationPanel({ 
  isOpen, 
  onClose, 
  notifications, 
  onMarkRead, 
  onMarkAllRead 
}: NotificationPanelProps) {
  const navigate = useNavigate()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-start sm:justify-end p-0 sm:p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="w-full sm:w-[400px] bg-white rounded-t-[32px] sm:rounded-[24px] shadow-2xl h-[70vh] sm:h-auto sm:max-h-[600px] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300 sm:slide-in-from-right"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-6 py-5 border-b border-stone-50 flex justify-between items-center bg-white sticky top-0 z-10">
          <div className="flex items-baseline gap-2">
            <h3 className="font-headline font-extrabold text-on-surface">Pemberitahuan</h3>
            {notifications.length > 0 && (
              <button 
                onClick={() => onMarkAllRead(notifications)}
                className="text-[10px] font-black text-[#1a7a7a] hover:text-[#156363] uppercase tracking-wider transition-colors ml-2"
              >
                Tandai semua dibaca
              </button>
            )}
          </div>
          <button onClick={onClose} className="p-2 bg-stone-50 rounded-full text-stone-400">
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
                  onClose()
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
                    onMarkRead(notif.id, notif.type)
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
            onClick={onClose}
            className="w-full py-3 bg-white border border-stone-200 rounded-xl font-headline font-bold text-xs text-stone-500 hover:bg-stone-100"
          >
            Tutup
          </button>
        </footer>
      </div>
    </div>
  )
}
