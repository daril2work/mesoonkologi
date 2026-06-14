import { useState } from 'react'
import { useStaffUsers, useSearchUsers, updateUserRole } from '../api/useUserManagement'
import type { AppUserProfile } from '../api/useUserManagement'
import { toast } from 'react-hot-toast'

export default function UserManagementPanel() {
  const { users, isLoading, refetch } = useStaffUsers()
  const [searchQuery, setSearchQuery] = useState('')
  const { results, isSearching } = useSearchUsers(searchQuery)

  const handleRoleToggle = async (user: AppUserProfile, newRole: 'pharmacist' | 'doctor' | 'patient') => {
    try {
      // If the user already has this role, we can untoggle them to 'patient'
      const roleToSet = user.role === newRole ? 'patient' : newRole
      
      await updateUserRole(user.id, roleToSet)
      toast.success(`Role untuk ${user.full_name || 'User'} berhasil diubah menjadi ${roleToSet.toUpperCase()}`)
      
      // Clear search to show updated staff list or just refetch
      refetch()
    } catch (error: any) {
      toast.error('Gagal mengubah role: ' + error.message)
    }
  }

  // Display either search results (if searching) or the default staff list
  const displayList = searchQuery.trim().length >= 3 ? results : users

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h3 className="font-bold text-lg">Daftar Staf Medis</h3>
          <p className="text-xs text-stone-500">Kelola role Apoteker dan Dokter dari pengguna yang terdaftar.</p>
        </div>
        
        {/* Search Input */}
        <div className="relative w-full sm:w-64 md:w-80">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-lg">
            search
          </span>
          <input 
            type="text" 
            placeholder="Cari nama profil (min. 3 huruf)..."
            className="w-full bg-white border border-stone-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium focus:ring-2 ring-primary/20 outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {isSearching && (
             <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-primary animate-spin text-lg">
               sync
             </span>
          )}
        </div>
      </div>

      <div className="bg-white border border-stone-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50/50 border-b border-stone-100">
                <th className="py-4 px-6 text-[10px] font-black text-stone-400 uppercase tracking-widest w-1/2">Nama Lengkap</th>
                <th className="py-4 px-6 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">Status Role</th>
                <th className="py-4 px-6 text-[10px] font-black text-stone-400 uppercase tracking-widest text-right">Aksi Toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {isLoading && !searchQuery ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-xs text-stone-400 animate-pulse">
                    Memuat data staf medis...
                  </td>
                </tr>
              ) : displayList.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center">
                    <div className="flex flex-col items-center justify-center text-stone-400">
                      <span className="material-symbols-outlined text-4xl mb-2 opacity-50">person_off</span>
                      <p className="text-sm font-medium">Tidak ada profil ditemukan</p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayList.map(user => (
                  <tr key={user.id} className="hover:bg-stone-50/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase">
                          {user.full_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-bold text-on-surface text-sm">{user.full_name || 'Unnamed User'}</p>
                          <p className="text-xs text-stone-500 font-mono mt-0.5">{user.id.substring(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      {user.role === 'pharmacist' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider border border-emerald-100">
                          <span className="material-symbols-outlined text-[12px]">medical_services</span> Apoteker
                        </span>
                      )}
                      {user.role === 'doctor' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider border border-blue-100">
                          <span className="material-symbols-outlined text-[12px]">stethoscope</span> Dokter
                        </span>
                      )}
                      {user.role === 'patient' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 text-[10px] font-bold uppercase tracking-wider border border-stone-200">
                          <span className="material-symbols-outlined text-[12px]">personal_injury</span> Pasien
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        {/* Toggle Apoteker */}
                        <button
                          onClick={() => handleRoleToggle(user, 'pharmacist')}
                          className={`relative flex items-center justify-center w-20 h-8 rounded-lg text-xs font-bold transition-all ${
                            user.role === 'pharmacist' 
                              ? 'bg-[#1a7a7a] text-white shadow-sm' 
                              : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                          }`}
                        >
                          Apoteker
                        </button>
                        
                        {/* Toggle Dokter */}
                        <button
                          onClick={() => handleRoleToggle(user, 'doctor')}
                          className={`relative flex items-center justify-center w-20 h-8 rounded-lg text-xs font-bold transition-all ${
                            user.role === 'doctor' 
                              ? 'bg-[#1a7a7a] text-white shadow-sm' 
                              : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                          }`}
                        >
                          Dokter
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
