import React, { useState } from 'react'
import PharmacistLayout from '../components/PharmacistLayout'
import { useEducationMaterials, useCreateEducation, useDeleteEducation, useUpdateEducation } from '../api/useEducation'
import { toast } from 'react-hot-toast'
import { ConfirmationModal } from '@components/ui/ConfirmationModal'
import { clsx } from 'clsx'

// S-01: Konstanta default image (sebelumnya duplikat di 3 tempat)
const DEFAULT_THUMBNAIL = 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=800&q=80'
const DEFAULT_FEATURED_IMG = 'https://images.unsplash.com/photo-1576091160550-2173dad99a01?auto=format&fit=crop&w=800&q=80'
const DEFAULT_CARD_IMG = 'https://images.unsplash.com/photo-1505751172107-5739a007721d?auto=format&fit=crop&w=800&q=80'

export default function PharmacistEducation() {
  const { data: materials, isLoading } = useEducationMaterials()
  const { mutate: createEducation } = useCreateEducation()
  const { mutate: deleteEducation } = useDeleteEducation()
  const { mutate: updateEducation } = useUpdateEducation()
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Semua')

  const CATEGORIES = ['Semua', 'Nutrisi', 'Psikologi', 'Terapi', 'Aktivitas']

  const [newVideo, setNewVideo] = useState({
    title: '',
    description: '',
    category: 'Terapi',
    videoUrl: '',
    imageUrl: DEFAULT_THUMBNAIL,
    isFeatured: false
  })

  // S-01: State untuk delete confirmation modal (menggantikan confirm())
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [editTargetId, setEditTargetId] = useState<string | null>(null)

  const handleOpenEdit = (item: any) => {
    setEditTargetId(item.id)
    setNewVideo({
      title: item.title,
      description: item.description || '',
      category: item.category,
      videoUrl: item.videoUrl,
      imageUrl: item.imageUrl || DEFAULT_THUMBNAIL,
      isFeatured: item.isFeatured
    })
    setIsModalOpen(true)
  }

  const handleOpenCreate = () => {
    setEditTargetId(null)
    setNewVideo({ title: '', description: '', category: 'Terapi', videoUrl: '', imageUrl: DEFAULT_THUMBNAIL, isFeatured: false })
    setIsModalOpen(true)
  }

  // Client-side filtering for better UX responsiveness
  const filteredMaterials = materials?.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (m.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    const matchesCategory = selectedCategory === 'Semua' || m.category === selectedCategory
    return matchesSearch && matchesCategory
  }) || []

  const featuredMaterial = filteredMaterials.find(m => m.isFeatured) || filteredMaterials[0]
  const normalMaterials = filteredMaterials.filter(m => m.id !== featuredMaterial?.id)

  const [imageError, setImageError] = useState(false)

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newVideo.title || !newVideo.videoUrl) return
    
    if (editTargetId) {
      updateEducation({
        id: editTargetId,
        updates: { ...newVideo }
      }, {
        onSuccess: () => {
          toast.success('Konten edukasi berhasil diperbarui')
          setIsModalOpen(false)
          setEditTargetId(null)
          setImageError(false)
        }
      })
    } else {
      createEducation({
        ...newVideo,
        content: ''
      }, {
        onSuccess: () => {
          toast.success('Konten edukasi berhasil ditambahkan')
          setIsModalOpen(false)
          setImageError(false)
        }
      })
    }
  }

  const handleDelete = (id: string) => {
    setDeleteTargetId(id)
  }

  const handleConfirmDelete = () => {
    if (!deleteTargetId) return
    deleteEducation(deleteTargetId, {
      onSuccess: () => {
        toast.success('Konten berhasil dihapus')
        setDeleteTargetId(null)
      },
      onError: () => {
        toast.error('Gagal menghapus konten.')
        setDeleteTargetId(null)
      }
    })
  }

  const handleToggleFeatured = (item: any) => {
    const willBeFeatured = !item.isFeatured;

    // Jika ingin menjadikan ini unggulan, matikan yang unggulan saat ini (jika ada)
    if (willBeFeatured && featuredMaterial && featuredMaterial.isFeatured && featuredMaterial.id !== item.id) {
      updateEducation({
        id: featuredMaterial.id,
        updates: { isFeatured: false }
      })
    }

    updateEducation({
      id: item.id,
      updates: { isFeatured: willBeFeatured }
    }, {
      onSuccess: () => {
        toast.success(willBeFeatured ? 'Materi dijadikan unggulan' : 'Materi dilepas dari unggulan')
      }
    })
  }

  return (
    <PharmacistLayout>
      <div className="min-h-screen">
        {/* Top Bar Section */}
        <header className="px-4 sm:px-8 lg:px-10 py-6 sm:py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-container bg-white/80 backdrop-blur-xl sticky top-0 z-30">
          <div>
            <h2 className="text-2xl sm:text-3xl headline-font font-black text-on-surface tracking-tight">Manajemen Edukasi</h2>
            <p className="text-on-surface-variant text-xs sm:text-sm mt-1 font-medium">Kurasi materi untuk mendukung perjalanan pemulihan pasien.</p>
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <button 
              onClick={handleOpenCreate}
              className="flex items-center justify-center gap-2 bg-primary text-on-primary px-6 sm:px-8 py-3 sm:py-3.5 rounded-2xl font-black text-xs sm:text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20 active:scale-95 w-full sm:w-auto font-body"
            >
              <span className="material-symbols-outlined text-[22px]">upload</span>
              Upload Materi
            </button>
          </div>
        </header>

        <section className="p-4 sm:p-8 lg:p-10 max-w-7xl mx-auto">
          {/* Filter & Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-12">
            <div className="md:col-span-8 bg-surface-container-low p-6 rounded-[32px] flex flex-col sm:flex-row items-center justify-between gap-6 border border-stone-100 shadow-sm">
              <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto scrollbar-hide">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={clsx(
                      "px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all",
                      selectedCategory === cat 
                        ? "bg-primary text-on-primary shadow-md" 
                        : "bg-white text-stone-400 hover:text-primary border border-stone-100"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="relative w-full sm:w-72">
                <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-stone-300 text-lg">search</span>
                <input 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-6 py-3.5 bg-white rounded-2xl border-none ring-1 ring-stone-100 focus:ring-2 focus:ring-primary/20 w-full text-xs font-bold outline-none transition-all placeholder:text-stone-300" 
                  placeholder="Cari materi..." 
                  type="text"
                />
              </div>
            </div>
            <div className="md:col-span-4 bg-tertiary-container/10 p-6 rounded-[32px] flex items-center gap-5 border border-tertiary/5">
              <div className="bg-white p-4 rounded-2xl shadow-sm text-tertiary border border-tertiary/10">
                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_stories</span>
              </div>
              <div>
                <p className="text-[10px] font-black text-tertiary/60 uppercase tracking-[0.2em] mb-1">Database Edukasi</p>
                <p className="text-3xl font-black text-on-surface headline-font tracking-tight">{materials?.length ?? 0} <span className="text-sm font-bold text-stone-400">Total</span></p>
              </div>
            </div>
          </div>

          {/* Content Grid */}
          {isLoading ? (
            <div className="py-32 text-center animate-pulse">
              <span className="material-symbols-outlined text-6xl text-primary/20 animate-spin" style={{ fontVariationSettings: "'wght' 200" }}>sync</span>
              <p className="mt-4 font-black text-stone-300 uppercase tracking-widest text-[10px]">Menyinkronkan Galeri...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {/* Featured Card */}
              {featuredMaterial && searchTerm === '' && selectedCategory === 'Semua' && (
                <div className="md:col-span-2 bg-primary rounded-[32px] sm:rounded-[48px] p-6 sm:p-10 lg:p-12 flex flex-col lg:flex-row items-center gap-6 sm:gap-10 lg:gap-12 overflow-hidden relative group shadow-2xl shadow-primary/20">
                  <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/leaf.png')]"></div>
                  <div className="flex-1 z-10 relative w-full">
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFeatured(featuredMaterial);
                      }}
                      className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full mb-4 sm:mb-8 cursor-pointer hover:bg-white/20 transition-all active:scale-95"
                      title="Klik untuk melepas dari unggulan"
                    >
                      <span className="material-symbols-outlined text-xs sm:text-sm text-yellow-400" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em]">Materi Unggulan</span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl headline-font font-black text-white mb-4 leading-tight tracking-tight">{featuredMaterial.title}</h3>
                    <p className="text-white/75 text-xs sm:text-sm md:text-base lg:text-lg mb-6 sm:mb-8 md:mb-10 max-w-xl font-medium leading-relaxed">{featuredMaterial.description || 'Materi pilihan terbaik untuk mendukung pemulihan pasien.'}</p>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
                      <button onClick={(e) => { e.stopPropagation(); handleOpenEdit(featuredMaterial); }} className="bg-white text-primary px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest hover:bg-stone-50 transition-all active:scale-95 shadow-xl w-full sm:w-auto text-center font-body">Edit Konten</button>
                    </div>
                  </div>
                  <div 
                    className="w-full max-w-[200px] aspect-square sm:max-w-[240px] lg:max-w-none lg:w-72 lg:h-72 xl:w-96 xl:h-96 bg-white/5 backdrop-blur-3xl rounded-[32px] sm:rounded-[64px] flex items-center justify-center p-4 sm:p-8 border border-white/10 z-10 transition-transform duration-1000 group-hover:rotate-3 shrink-0 relative cursor-pointer shadow-lg"
                    onClick={() => featuredMaterial.videoUrl && window.open(featuredMaterial.videoUrl, '_blank')}
                  >
                    <img 
                        className="w-full h-full object-cover rounded-[24px] sm:rounded-[48px] shadow-2xl border-4 border-white/10" 
                        src={featuredMaterial.imageUrl || DEFAULT_FEATURED_IMG} 
                        alt="Featured" 
                    />
                  </div>
                </div>
              )}

              {/* Normal Cards */}
              {normalMaterials.map((item) => (
                <div key={item.id} className="group bg-white rounded-[40px] overflow-hidden transition-all duration-500 hover:translate-y-[-8px] hover:shadow-2xl hover:shadow-primary/5 border border-stone-100 flex flex-col">
                  <div 
                    className="relative h-64 w-full overflow-hidden p-3 cursor-pointer"
                    onClick={() => item.videoUrl && window.open(item.videoUrl, '_blank')}
                  >
                    <img
                      className="w-full h-full object-cover rounded-[32px] transition-transform duration-1000 group-hover:scale-105"
                      src={item.imageUrl || DEFAULT_CARD_IMG}
                      alt={item.title}
                    />
                    <div className="absolute inset-0 m-3 rounded-[32px] bg-black/10 group-hover:bg-black/30 transition-colors duration-500 flex items-center justify-center">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all duration-500">
                             <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                        </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFeatured(item);
                      }}
                      className={clsx(
                        "absolute top-8 left-8 p-2 rounded-full backdrop-blur-md border border-white/20 shadow-lg transition-all active:scale-90",
                        item.isFeatured ? "bg-yellow-400 text-white" : "bg-white/20 text-white hover:bg-white/40"
                      )}
                    >
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: item.isFeatured ? "'FILL' 1" : "'FILL' 0" }}>star</span>
                    </button>
                    <div className="absolute top-8 right-8 px-4 py-2 bg-white/90 backdrop-blur-md text-primary text-[10px] font-black rounded-full uppercase tracking-widest border border-white/20 shadow-lg">
                        {item.category}
                    </div>
                  </div>
                  <div className="px-10 pb-10 pt-4 flex flex-col flex-1">
                    <h3 className="text-2xl font-black text-on-surface mb-3 headline-font leading-tight group-hover:text-primary transition-colors tracking-tight">{item.title}</h3>
                    <p className="text-on-surface-variant text-sm line-clamp-2 mb-8 font-medium leading-relaxed opacity-70">{item.description}</p>
                    <div className="mt-auto flex flex-wrap items-center justify-between pt-6 border-t border-stone-50 gap-4">
                      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-[10px] font-black text-stone-400 uppercase shrink-0">MN</div>
                        <span className="text-[9px] sm:text-[10px] font-black text-stone-400 uppercase tracking-widest leading-tight">Baru Ditambahkan</span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 shrink-0 ml-auto">
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleOpenEdit(item); }}
                            className="p-2 sm:p-3 text-stone-300 hover:text-primary hover:bg-primary-container/30 rounded-2xl transition-all active:scale-90"
                            title="Edit Konten"
                        >
                          <span className="material-symbols-outlined text-lg sm:text-xl">edit</span>
                        </button>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(item.videoUrl || window.location.href);
                                toast.success('Tautan disalin!');
                            }}
                            className="p-2 sm:p-3 text-stone-300 hover:text-primary hover:bg-primary-container/30 rounded-2xl transition-all active:scale-90"
                            title="Salin Tautan"
                        >
                          <span className="material-symbols-outlined text-lg sm:text-xl">content_copy</span>
                        </button>
                        <button 
                            onClick={() => handleDelete(item.id)}
                            className="p-2 sm:p-3 text-stone-300 hover:text-tertiary hover:bg-tertiary-container/30 rounded-2xl transition-all active:scale-90"
                        >
                          <span className="material-symbols-outlined text-lg sm:text-xl">delete</span>
                        </button>
                        <button 
                            onClick={() => item.videoUrl && window.open(item.videoUrl, '_blank')}
                            className="px-4 py-2 sm:px-6 sm:py-3 bg-stone-50 text-on-surface font-black text-[9px] sm:text-[10px] uppercase tracking-widest hover:bg-primary hover:text-on-primary rounded-xl sm:rounded-2xl transition-all shadow-sm"
                        >
                            Detail
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Modal (Simplified implementation of the design's modal intent) */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-xl rounded-[32px] sm:rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-stone-100 max-h-[90vh] flex flex-col">
              <div className="p-6 sm:p-12 overflow-y-auto">
                <div className="flex justify-between items-start mb-10">
                    <div>
                        <h2 className="headline-font text-3xl font-black text-on-surface tracking-tight">{editTargetId ? 'Edit Materi' : 'Upload Materi'}</h2>
                        <p className="text-sm font-medium text-stone-500 mt-1">{editTargetId ? 'Ubah informasi konten edukasi ini.' : 'Tambahkan konten edukasi baru ke perpustakaan digital.'}</p>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-400">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                
                <form onSubmit={handleCreate} className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">Judul Konten</label>
                    <input 
                      type="text" 
                      required
                      value={newVideo.title}
                      onChange={(e) => setNewVideo({...newVideo, title: e.target.value})}
                      placeholder="Contoh: Manajemen Nutrisi Kemoterapi"
                      className="w-full px-6 py-4 bg-stone-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-stone-300"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">Kategori</label>
                      <select 
                        value={newVideo.category}
                        onChange={(e) => setNewVideo({...newVideo, category: e.target.value})}
                        className="w-full px-6 py-4 bg-stone-50 border-none rounded-2xl text-sm font-black text-on-surface focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer"
                      >
                        {CATEGORIES.filter(c => c !== 'Semua').map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">URL Video</label>
                      <input 
                        type="url" 
                        required
                        value={newVideo.videoUrl}
                        onChange={(e) => setNewVideo({...newVideo, videoUrl: e.target.value})}
                        placeholder="https://youtube.com/..."
                        className="w-full px-6 py-4 bg-stone-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-stone-300"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">URL Thumbnail (Opsional)</label>
                      <input 
                        type="url" 
                        value={newVideo.imageUrl}
                        onChange={(e) => setNewVideo({...newVideo, imageUrl: e.target.value})}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full px-6 py-4 bg-stone-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-stone-300"
                      />
                    </div>
                    {newVideo.imageUrl && (
                      <div className="h-36 w-full rounded-2xl overflow-hidden border border-stone-100 bg-stone-50 relative flex items-center justify-center">
                        {!imageError ? (
                          <img 
                            src={newVideo.imageUrl} 
                            alt="Preview" 
                            className="w-full h-full object-cover" 
                            onError={() => setImageError(true)}
                            onLoad={() => setImageError(false)}
                          />
                        ) : (
                          <div className="text-center p-6">
                            <span className="material-symbols-outlined text-stone-300 text-3xl mb-2">broken_image</span>
                            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Link Gambar Tidak Valid</p>
                            <p className="text-[9px] text-stone-300 mt-1">Gunakan link langsung (akhiran .jpg atau .png)</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 px-1">
                    <input 
                      type="checkbox"
                      id="isFeatured"
                      checked={newVideo.isFeatured}
                      onChange={(e) => setNewVideo({...newVideo, isFeatured: e.target.checked})}
                      className="w-5 h-5 rounded border-stone-200 text-primary focus:ring-primary/20 cursor-pointer"
                    />
                    <label htmlFor="isFeatured" className="text-xs font-bold text-on-surface-variant cursor-pointer font-bold">Jadikan sebagai Materi Unggulan (Tampil di Header)</label>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">Deskripsi Singkat</label>
                    <textarea 
                      rows={3}
                      value={newVideo.description}
                      onChange={(e) => setNewVideo({...newVideo, description: e.target.value})}
                      placeholder="Jelaskan isi materi secara ringkas..."
                      className="w-full px-6 py-4 bg-stone-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none placeholder:text-stone-300"
                    />
                  </div>

                  <div className="flex items-center gap-4 pt-4">
                    <button 
                      type="submit"
                      className="w-full py-5 bg-primary text-on-primary rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                      <span className="material-symbols-outlined text-xl">{editTargetId ? 'save' : 'cloud_upload'}</span>
                      {editTargetId ? 'Simpan Perubahan' : 'Simpan & Publikasikan'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* S-01: ConfirmationModal untuk delete — menggantikan confirm() */}
      <ConfirmationModal
        isOpen={!!deleteTargetId}
        variant="danger"
        title="Hapus Konten Edukasi"
        description="Konten yang dihapus tidak dapat dikembalikan. Pastikan Anda sudah yakin sebelum melanjutkan."
        confirmLabel="Ya, Hapus Konten"
        cancelLabel="Batalkan"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </PharmacistLayout>
  )
}
