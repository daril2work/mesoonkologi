import { useState } from 'react'
import PatientLayout from '../components/PatientLayout'
import PatientTopNav from '../components/PatientTopNav'
import { ArrowRight, Play, MessageCircle, Download, FileText, Copy, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@configs/app.config'
import { useEducationMaterials, useFeaturedMaterial } from '../api/useEducation'
import type { EducationMaterial } from '../types'
import { toast } from 'react-hot-toast'

const TABS = ['Semua Topik', 'Nutrisi', 'Perawatan Kulit', 'Psikologi'] as const
type TabKey = typeof TABS[number]

// Map tab label → DB category value (or undefined = no filter)
const TAB_TO_CATEGORY: Record<TabKey, string | undefined> = {
  'Semua Topik': undefined,
  'Nutrisi': 'Nutrisi',
  'Perawatan Kulit': 'Perawatan Kulit',
  'Psikologi': 'Psikologi',
}

function getEmbedUrl(url: string) {
  if (!url) return '';
  
  // Handle YouTube
  const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
  }

  // Handle TikTok (e.g. https://www.tiktok.com/@user/video/123456789)
  const ttMatch = url.match(/tiktok\.com\/@[^\/]+\/video\/(\d+)/i);
  if (ttMatch && ttMatch[1]) {
    // TikTok embed URL format
    return `https://www.tiktok.com/embed/v2/${ttMatch[1]}`;
  }

  // Fallback (jika format lain, iframe mungkin akan diblokir oleh platform jika mereka memakai X-Frame-Options: DENY)
  return url;
}

export default function PatientEducation() {
  const navigate = useNavigate()
  const [selectedTab, setSelectedTab] = useState<TabKey>('Semua Topik')
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null)

  const category = TAB_TO_CATEGORY[selectedTab]
  const { data: materials, isLoading } = useEducationMaterials(category)
  const { data: featured } = useFeaturedMaterial()

  const handleContentClick = (item: EducationMaterial) => {
    if (item.videoUrl) {
      setActiveVideoUrl(item.videoUrl)
    } else {
      // Jika tidak ada video, bisa diarahkan ke modal detail atau link eksternal jika ada
      // Untuk sementara, kita asumsi video adalah interaksi utama yang diinginkan user
      alert('Materi artikel sedang disiapkan. Silakan hubungi apoteker via chat untuk panduan lebih lanjut.')
    }
  }

  return (
    <PatientLayout>
      <div style={{ background: '#ffffff', minHeight: '100vh', paddingBottom: '40px' }}>

        <PatientTopNav />

        <main style={{ padding: '0 24px' }}>

          {/* Hero Section — Featured Material */}
          {featured && (
            <div style={{
              background: '#000000',
              borderRadius: '32px',
              overflow: 'hidden',
              position: 'relative',
              marginTop: '8px',
              marginBottom: '32px',
              minHeight: '400px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              padding: '32px'
            }}>
              {featured.imageUrl && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  backgroundImage: `url("${featured.imageUrl}")`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  opacity: 0.6
                }} />
              )}
              <div style={{ position: 'relative', zIndex: 2 }}>
                <div style={{
                  background: '#046b5e', color: '#ffffff', padding: '4px 12px',
                  borderRadius: '99px', fontSize: '0.65rem', fontWeight: 800,
                  display: 'inline-block', marginBottom: '16px', letterSpacing: '0.05em'
                }}>
                  EDUKASI UNGGULAN
                </div>
                <h1 style={{
                  fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '2rem',
                  fontWeight: 800, color: '#ffffff', margin: '0 0 16px 0',
                  lineHeight: 1.1, letterSpacing: '-0.02em'
                }}>
                  {featured.title}
                </h1>
                <p style={{
                  fontFamily: '"Inter", sans-serif', fontSize: '1rem',
                  color: 'rgba(255,255,255,0.8)', margin: '0 0 24px 0', lineHeight: 1.5
                }}>
                  {featured.description}
                </p>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button 
                    onClick={() => handleContentClick(featured)}
                    style={{
                      background: '#b2f0e0', color: '#046b5e', border: 'none',
                      padding: '14px 28px', borderRadius: '99px', fontWeight: 800,
                      fontSize: '0.95rem', cursor: 'pointer'
                    }}
                  >
                    Mulai Membaca
                  </button>
                  <button 
                    onClick={async () => {
                      const urlToCopy = featured.videoUrl || window.location.href;
                      try {
                        await navigator.clipboard.writeText(urlToCopy);
                        toast.success('Tautan disalin!');
                      } catch {
                        toast.error('Gagal menyalin tautan. Coba salin manual.');
                      }
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.2)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.4)',
                      padding: '14px 28px', borderRadius: '99px', fontWeight: 800,
                      fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                      backdropFilter: 'blur(4px)'
                    }}
                  >
                    <Copy size={18} /> Salin Tautan
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', marginBottom: '32px', paddingBottom: '4px' }}>
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                style={{
                  padding: '10px 24px',
                  borderRadius: '99px',
                  border: 'none',
                  background: selectedTab === tab ? '#046b5e' : '#f5f5f5',
                  color: selectedTab === tab ? '#ffffff' : '#727878',
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Content Cards from Supabase */}
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#a3a9a8', fontFamily: '"Inter", sans-serif' }}>
              Memuat materi...
            </div>
          ) : !materials || materials.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#a3a9a8', fontFamily: '"Inter", sans-serif' }}>
              Belum ada materi untuk kategori ini.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
              {materials.map((item, index) => (
                <MaterialCard 
                  key={item.id} 
                  item={item} 
                  index={index} 
                  onOpen={() => handleContentClick(item)}
                />
              ))}
            </div>
          )}

          {/* CTA Footer Section */}
          <div style={{ padding: '56px 0 16px', textAlign: 'center' }}>
            <h2 style={{
              fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '1.75rem',
              fontWeight: 800, color: '#1b1c1c', margin: '0 0 16px 0'
            }}>
              Butuh Panduan Khusus?
            </h2>
            <p style={{
              fontFamily: '"Inter", sans-serif', fontSize: '0.95rem',
              color: '#727878', margin: '0 0 32px 0', lineHeight: 1.5
            }}>
              Tim ahli kami siap membantu menjawab pertanyaan Anda seputar nutrisi dan perawatan diri selama masa pengobatan.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={() => navigate(ROUTES.PATIENT_CHAT)}
                style={{
                  background: '#046b5e', color: '#ffffff', border: 'none',
                  padding: '16px', borderRadius: '99px', fontWeight: 800,
                  fontSize: '1rem', cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: '0 8px 24px rgba(4, 107, 94, 0.2)'
                }}
              >
                <MessageCircle size={20} /> Konsultasi Gratis
              </button>
              <button style={{
                background: '#ffffff', color: '#046b5e', border: '2px solid #f0eded',
                padding: '16px', borderRadius: '99px', fontWeight: 800,
                fontSize: '1rem', cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}>
                <Download size={20} /> Unduh E-Book Gratis
              </button>
            </div>
          </div>

        </main>
      </div>

      {/* Video Player Modal */}
      {activeVideoUrl && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(8px)', padding: '24px'
        }}>
          <div style={{
            position: 'relative', width: '100%', maxWidth: '900px',
            background: '#000', borderRadius: '16px', overflow: 'hidden',
            aspectRatio: '16/9', boxShadow: '0 24px 64px rgba(0,0,0,0.5)'
          }}>
            <button 
              onClick={() => setActiveVideoUrl(null)}
              style={{
                position: 'absolute', top: '16px', right: '16px', zIndex: 10,
                background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff',
                width: '40px', height: '40px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', backdropFilter: 'blur(4px)'
              }}
            >
              <X size={24} />
            </button>
            <iframe
              src={getEmbedUrl(activeVideoUrl)}
              style={{ width: '100%', height: '100%', border: 'none' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </PatientLayout>
  )
}

// ------------------------------------------------------------------
// Card sub-component — varies style based on position & category
// ------------------------------------------------------------------
function MaterialCard({ item, index, onOpen }: { item: EducationMaterial; index: number; onOpen: () => void }) {
  const isHighlighted = index % 3 === 1 // Every 2nd card gets colored background

  const categoryColor: Record<string, { bg: string; text: string }> = {
    'Nutrisi': { bg: '#b2f0e0', text: '#046b5e' },
    'Perawatan Kulit': { bg: '#ffe9ec', text: '#b90c55' },
    'Psikologi': { bg: '#e5f9f5', text: '#046b5e' },
    'Mental Health': { bg: '#ede7f6', text: '#6a1b9a' },
    'Terapi': { bg: '#e3f2fd', text: '#1565c0' },
    'Aktivitas': { bg: '#fff8e1', text: '#e65100' },
  }

  const colors = categoryColor[item.category] ?? { bg: '#f5f5f5', text: '#424848' }
  const isVideoType = !!item.videoUrl

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Image */}
      {item.imageUrl && (
        <div 
          onClick={onOpen}
          style={{ borderRadius: '32px', overflow: 'hidden', position: 'relative', height: '260px', cursor: 'pointer' }}
        >
          <img src={item.imageUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', gap: '8px' }}>
            <span style={{
              background: colors.bg, color: colors.text,
              padding: '4px 12px', borderRadius: '99px',
              fontSize: '0.65rem', fontWeight: 800
            }}>
              {item.category.toUpperCase()}
            </span>
            {isVideoType && (
              <span style={{
                background: '#ffffff', color: '#1b1c1c',
                padding: '4px 12px', borderRadius: '99px',
                fontSize: '0.65rem', fontWeight: 800,
                display: 'flex', alignItems: 'center', gap: '4px'
              }}>
                <Play size={10} fill="#1b1c1c" /> VIDEO
              </span>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{
        background: isHighlighted ? colors.bg : 'transparent',
        borderRadius: '24px',
        padding: isHighlighted ? '20px' : '0',
      }}>
        <h2 style={{
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          fontSize: '1.4rem', fontWeight: 800,
          color: isHighlighted ? colors.text : '#1b1c1c',
          margin: '0 0 8px 0', lineHeight: 1.2
        }}>
          {item.title}
        </h2>
        {item.description && (
          <p style={{
            fontFamily: '"Inter", sans-serif',
            fontSize: '0.95rem',
            color: isHighlighted ? colors.text : '#727878',
            margin: '0 0 16px 0', lineHeight: 1.5, opacity: 0.85
          }}>
            {item.description}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: isHighlighted ? 'rgba(255,255,255,0.5)' : '#f5f5f5',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {isVideoType
                ? <Play size={12} color={colors.text} />
                : <FileText size={12} color={isHighlighted ? colors.text : '#727878'} />
              }
            </div>
            <span style={{
              fontSize: '0.75rem',
              color: isHighlighted ? colors.text : '#a3a9a8',
              fontFamily: '"Inter", sans-serif'
            }}>
              {isVideoType ? 'Video Materi' : 'Artikel'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              onClick={async (e) => {
                e.stopPropagation();
                const urlToCopy = item.videoUrl || window.location.href;
                try {
                  await navigator.clipboard.writeText(urlToCopy);
                  toast.success('Tautan disalin!');
                } catch {
                  toast.error('Gagal menyalin tautan. Coba salin manual.');
                }
              }}
              style={{
                background: 'transparent', border: 'none',
                color: isHighlighted ? colors.text : '#a3a9a8',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
              title="Salin Tautan"
            >
              <Copy size={18} />
            </button>
            <button 
              onClick={onOpen}
              style={{
                background: 'transparent', border: 'none',
                color: isHighlighted ? colors.text : '#046b5e',
                fontWeight: 700, fontSize: '0.875rem',
                display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer'
              }}
            >
              {isVideoType ? 'Tonton' : 'Baca'} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
