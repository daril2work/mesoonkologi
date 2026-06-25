import { useState, useEffect } from 'react'
import { X, Copy, Check, Info, Calendar, Phone } from 'lucide-react'
import { usePatientProfile } from '../hooks/usePatientProfile'
import toast from 'react-hot-toast'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string | undefined
  userFullName: string | undefined
}

export default function ProfileModal({ isOpen, onClose, userId, userFullName }: ProfileModalProps) {
  const { profileData, isLoading, updatePhone, isSaving } = usePatientProfile(userId, isOpen)
  const [whatsAppInput, setWhatsAppInput] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (profileData?.phone_number) {
      setWhatsAppInput(profileData.phone_number)
    }
  }, [profileData?.phone_number])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex justify-center items-start sm:items-center p-4 overflow-y-auto bg-stone-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="w-full max-w-[360px] bg-white rounded-[28px] shadow-2xl overflow-hidden flex flex-col p-6 my-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-headline font-extrabold text-stone-800 text-lg">Profil Saya</h3>
          <button 
            onClick={onClose} 
            className="p-2 bg-stone-50 hover:bg-stone-100 rounded-full text-stone-400 hover:text-stone-600 transition-all focus:outline-none"
          >
            <X size={18} />
          </button>
        </div>

        {isLoading && !profileData ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-4 border-[#006060] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-stone-400 font-medium">Memuat profil...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Profile Visual */}
            <div className="text-center pb-2">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#006060] to-[#0d9488] text-white font-extrabold flex items-center justify-center text-2xl shadow-md border-2 border-white mb-2 mx-auto">
                {(profileData?.full_name || userFullName || 'P')[0].toUpperCase()}
              </div>
              <h4 className="font-headline font-bold text-stone-800 text-base leading-tight">
                {profileData?.full_name || userFullName || 'Pasien'}
              </h4>
            </div>

            {/* Patient ID with Copy Tool */}
            <div className="bg-stone-50 border border-stone-100 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-stone-400 uppercase tracking-widest">ID Pasien</span>
                <button
                  onClick={async () => {
                    const idToCopy = `#P-${(profileData?.id || userId || '').slice(0, 6).toUpperCase()}`
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
                {`#P-${(profileData?.id || userId || '').slice(0, 6).toUpperCase()}`}
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
                  onClick={() => updatePhone(whatsAppInput)}
                  disabled={isSaving}
                  className="px-4 py-2 bg-[#006060] hover:bg-[#0d9488] disabled:bg-stone-300 text-white font-bold text-xs rounded-xl transition-all shadow-sm focus:outline-none"
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
