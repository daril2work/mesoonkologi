import { useState, useEffect } from 'react'
import { Bell, LogOut, MessageSquare, CheckCircle, Calendar, X, Copy, Check, Info, Phone } from 'lucide-react'
import { useAuthStore } from '@features/auth/store'
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '../api/useNotifications'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'
import { clsx } from 'clsx'
import { supabase } from '@lib/supabase'

export default function PatientTopNav() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const { data: notifications = [] } = useNotifications()
  const [showNotifications, setShowNotifications] = useState(false)
  const markAsRead = useMarkNotificationRead()
  const markAllAsRead = useMarkAllNotificationsRead()

  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profileData, setProfileData] = useState<any>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [whatsAppInput, setWhatsAppInput] = useState('')
  const [savingWhatsApp, setSavingWhatsApp] = useState(false)
  const [copied, setCopied] = useState(false)

  const unreadCount = notifications.length

  const fetchProfile = async () => {
    if (!user) return
    setProfileLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, cancer_site, date_of_birth, phone_number, hospital_id')
        .eq('id', user.id)
        .single()
      if (error) throw error
      setProfileData(data)
      setWhatsAppInput(data.phone_number || '')
    } catch (err: any) {
      console.error('Gagal mengambil profil:', err.message)
    } finally {
      setProfileLoading(false)
    }
  }

  useEffect(() => {
    if (showProfileModal) {
      fetchProfile()
    }
  }, [showProfileModal])

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Berhasil keluar')
    } catch (error) {
      toast.error('Gagal keluar')
    }
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

      {/* PROFILE MODAL */}
      {showProfileModal && (
        <div className="fixed inset-0 z-[200] flex justify-center items-start sm:items-center p-4 overflow-y-auto bg-stone-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowProfileModal(false)}>
          <div 
            className="w-full max-w-[360px] bg-white rounded-[28px] shadow-2xl overflow-hidden flex flex-col p-6 my-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-headline font-extrabold text-stone-800 text-lg">Profil Saya</h3>
              <button 
                onClick={() => setShowProfileModal(false)} 
                className="p-2 bg-stone-50 hover:bg-stone-100 rounded-full text-stone-400 hover:text-stone-600 transition-all focus:outline-none"
              >
                <X size={18} />
              </button>
            </div>

            {profileLoading && !profileData ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-4 border-[#006060] border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-stone-400 font-medium">Memuat profil...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Profile Visual */}
                <div className="text-center pb-2">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#006060] to-[#0d9488] text-white font-extrabold flex items-center justify-center text-2xl shadow-md border-2 border-white mb-2 mx-auto">
                    {(profileData?.full_name || user?.fullName || 'P')[0].toUpperCase()}
                  </div>
                  <h4 className="font-headline font-bold text-stone-800 text-base leading-tight">
                    {profileData?.full_name || user?.fullName || 'Pasien'}
                  </h4>
                </div>

                {/* Patient ID with Copy Tool */}
                <div className="bg-stone-50 border border-stone-100 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-stone-400 uppercase tracking-widest">ID Pasien</span>
                    <button
                      onClick={async () => {
                        const idToCopy = `#P-${(profileData?.id || user?.id || '').slice(0, 6).toUpperCase()}`
                        await navigator.clipboard.writeText(idToCopy)
                        setCopied(true)
                        toast.success('ID Pasien disalin ke clipboard!')
                        setTimeout(() => setCopied(false), 2000)
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-stone-200 rounded-lg text-[11px] font-bold text-[#0d9488] hover:bg-[#e5f9f5] transition-all focus:outline-none shadow-sm"
                    >
                      {copied ? <Check size={12} className="text-green-600 animate-bounce" /> : <Copy size={12} />}
                      {copied ? 'Tersalin' : 'Salin ID'}
                    </button>
                  </div>
                  <div className="text-sm font-black text-stone-800 font-mono tracking-wide text-left">
                    {`#P-${(profileData?.id || user?.id || '').slice(0, 6).toUpperCase()}`}
                  </div>
                  <p className="text-[10px] text-stone-400 leading-normal flex items-start gap-1 text-left">
                    <Info size={12} className="shrink-0 text-stone-400 mt-0.5" />
                    <span>ID Pasien ini dapat Anda gunakan sebagai username/login.</span>
                  </p>
                </div>

                {/* Diagnostic Details */}
                <div className="space-y-2 text-stone-600 text-xs">
                  <div className="flex items-center gap-3 p-3 bg-stone-50 border border-stone-100/50 rounded-xl">
                    <Calendar size={16} className="text-[#0d9488] shrink-0" />
                    <div className="flex-1">
                      <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider text-left">Tanggal Lahir</div>
                      <div className="font-bold text-stone-700 text-left">
                        {profileData?.date_of_birth 
                          ? new Date(profileData.date_of_birth).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                          : 'Belum diisi'
                        }
                      </div>
                    </div>
                  </div>
                </div>

                {/* WhatsApp Update Form */}
                <div className="border-t border-stone-100 pt-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-[#0d9488]" />
                    <span className="text-xs font-black text-stone-700 uppercase tracking-wider block text-left">Nomor WhatsApp</span>
                  </div>

                  {!profileData?.phone_number && (
                    <div className="bg-[#fffbeb] border border-[#fef3c7] rounded-xl p-3 flex gap-2">
                      <Info size={16} color="#d97706" className="shrink-0 mt-0.5" />
                      <p className="text-[11px] text-[#b45309] leading-relaxed text-left">
                        WhatsApp belum diisi. Mohon lengkapi agar dapat login cepat & memulihkan kata sandi secara mandiri via OTP.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input 
                      type="tel"
                      value={whatsAppInput}
                      onChange={(e) => setWhatsAppInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="Contoh: 08123456789"
                      className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#0d9488] transition-all"
                    />
                    <button
                      onClick={async () => {
                        if (!whatsAppInput.trim()) {
                          toast.error('Mohon isi nomor WhatsApp Anda')
                          return
                        }
                        setSavingWhatsApp(true)
                        try {
                          const cleanPhone = whatsAppInput.replace(/\D/g, '')
                          if (!user?.id) {
                            toast.error('Sesi tidak valid, silakan masuk kembali')
                            return
                          }
                          const { error } = await supabase
                            .from('profiles')
                            .update({ phone_number: cleanPhone })
                            .eq('id', user.id)

                          if (error) throw error

                          toast.success('Nomor WhatsApp berhasil diperbarui!')
                          await fetchProfile()
                        } catch (err: any) {
                          toast.error('Gagal memperbarui WhatsApp: ' + err.message)
                        } finally {
                          setSavingWhatsApp(false)
                        }
                      }}
                      disabled={savingWhatsApp}
                      className="px-4 py-2 bg-[#006060] hover:bg-[#0d9488] disabled:bg-stone-300 text-white font-bold text-xs rounded-xl transition-all shadow-sm focus:outline-none"
                    >
                      {savingWhatsApp ? 'Menyimpan...' : 'Simpan'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
