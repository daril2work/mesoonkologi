import { useState, useEffect, useRef } from 'react'
import PatientLayout from '../components/PatientLayout'
import { ArrowLeft, MoreVertical, Plus, Send } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@features/auth/store'
import { useChatMessages, useSendMessage, useAssignedPharmacist } from '../api/useChat'
import { format } from 'date-fns'

export default function PatientChat() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { data: pharmacist } = useAssignedPharmacist()
  const { data: messages, isLoading } = useChatMessages(pharmacist?.id)
  const { mutate: sendMessage } = useSendMessage()
  
  const [inputText, setInputText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!inputText.trim() || !pharmacist) return

    sendMessage({
      receiverId: pharmacist.id,
      content: inputText.trim()
    })
    setInputText('')
  }

  const chips = [
    { label: 'Saran menu ringan', color: '#ffe9ec', textColor: '#b90c55' },
    { label: 'Jadwal minum obat', color: '#e5f9f5', textColor: '#046b5e' },
    { label: 'Efek samping', color: '#f0eded', textColor: '#1b1c1c' },
  ]

  const renderMessageContent = (content: string) => {
    // Simple regex to find text between double asterisks and wrap in <strong>
    const parts = content.split(/(\*\*.*?\*\*)/g)
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>
      }
      return part
    })
  }

  return (
    <PatientLayout>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 72px)', background: '#fcf9f8' }}>
        
        {/* Header */}
        <header style={{ 
          display: 'flex', alignItems: 'center', padding: '16px 20px', 
          background: '#ffffff', borderBottom: '1px solid #f0eded', gap: '12px' 
        }}>
          <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}>
            <ArrowLeft size={24} color="#046b5e" />
          </button>
          <div style={{ position: 'relative', width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', background: '#f0eded' }}>
            <img 
              src={pharmacist?.avatar_url || `https://ui-avatars.com/api/?name=${pharmacist?.full_name || 'Apoteker'}&background=046b5e&color=fff`} 
              alt="Pharmacist" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: '1rem', color: '#046b5e' }}>
              {pharmacist?.full_name || 'Pharmacist Consultation'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#727878' }}>
              {pharmacist ? (
                <>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4caf50' }} />
                  Online
                </>
              ) : (
                <>Apoteker tidak tersedia</>
              )}
            </div>
          </div>
          <MoreVertical size={20} color="#727878" />
        </header>

        {/* Chat Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ alignSelf: 'center', background: '#f0eded', padding: '4px 12px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700, color: '#727878', marginBottom: '8px' }}>
            HARI INI
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', color: '#727878', fontSize: '0.875rem' }}>Memuat pesan...</div>
          ) : (
            messages?.map((msg) => {
              const isMe = msg.senderId === user?.id
              return (
                <div key={msg.id} style={{ 
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  <div style={{ 
                    background: isMe ? '#046b5e' : '#ffffff',
                    color: isMe ? '#ffffff' : '#1b1c1c',
                    padding: '12px 16px',
                    borderRadius: isMe ? '24px 24px 4px 24px' : '24px 24px 24px 4px',
                    fontFamily: '"Inter", sans-serif',
                    fontSize: '0.875rem',
                    lineHeight: 1.5,
                    boxShadow: isMe ? 'none' : '0 2px 8px rgba(0,0,0,0.05)',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {renderMessageContent(msg.content)}
                  </div>
                  <div style={{ 
                    fontSize: '0.65rem', 
                    color: '#a3a9a8', 
                    textAlign: isMe ? 'right' : 'left',
                    padding: '0 4px'
                  }}>
                    {format(new Date(msg.createdAt), 'HH:mm')}
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Action Chips */}
        <div style={{ padding: '0 20px 12px', display: 'flex', gap: '8px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {chips.map((chip) => (
            <button 
              key={chip.label} 
              onClick={() => setInputText(chip.label)}
              style={{ 
                background: chip.color, 
                color: chip.textColor, 
                border: 'none', 
                padding: '8px 16px', 
                borderRadius: '16px', 
                fontSize: '0.75rem', 
                fontWeight: 700, 
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Input Area */}
        <div style={{ padding: '0 20px 20px' }}>
          <form 
            onSubmit={handleSend}
            style={{ 
              background: '#ffffff', borderRadius: '32px', padding: '8px 8px 8px 16px', 
              display: 'flex', alignItems: 'center', gap: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}
          >
            <Plus size={24} color="#046b5e" style={{ cursor: 'pointer' }} />
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Tulis pesan untuk Apoteker..." 
              style={{ 
                flex: 1, border: 'none', outline: 'none', 
                fontFamily: '"Inter", sans-serif', fontSize: '0.875rem', color: '#1b1c1c',
                background: 'transparent'
              }}
            />
            <button 
              type="submit"
              style={{ 
                background: '#046b5e', border: 'none', width: 44, height: 44, 
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <Send size={20} color="#ffffff" />
            </button>
          </form>
        </div>

      </div>
    </PatientLayout>
  )
}
