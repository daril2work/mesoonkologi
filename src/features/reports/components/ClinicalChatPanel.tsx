// ============================================================
// PharmacistPatientDetail — Sub-komponen: Clinical Chat Panel
// Single Responsibility: UI percakapan apoteker ↔ pasien
// ============================================================
import { useRef, useEffect, useState } from 'react'
import { clsx } from 'clsx'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { useChatMessages, useSendMessage } from '../api/useChat'
import { useAuthStore } from '@features/auth/store'

interface ClinicalChatPanelProps {
  patientId: string
  patientFirstName: string
}

export function ClinicalChatPanel({ patientId, patientFirstName }: ClinicalChatPanelProps) {
  const { user: currentUser } = useAuthStore()
  const { data: messages } = useChatMessages(patientId)
  const sendMessage = useSendMessage()
  const [inputValue, setInputValue] = useState('')
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll ke pesan terbaru
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = () => {
    if (!inputValue.trim()) return
    sendMessage.mutate({ receiverId: patientId, content: inputValue })
    setInputValue('')
  }

  return (
    <section className="bg-surface-container rounded-2xl flex flex-col h-[550px] overflow-hidden shadow-sm border border-stone-100">
      {/* Header */}
      <div className="p-6 bg-white flex items-center justify-between border-b border-stone-50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
          <h3 className="font-bold font-headline text-on-surface">Diskusi Pasien</h3>
        </div>
        <span className="text-[9px] font-black bg-stone-100 px-3 py-1 rounded-lg text-stone-500 uppercase tracking-widest">
          Live Connect
        </span>
      </div>

      {/* Messages Area */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide"
      >
        {messages?.map((msg) => {
          const isMe = msg.senderId === currentUser?.id
          return (
            <div
              key={msg.id}
              className={clsx(
                'flex flex-col max-w-[90%]',
                isMe ? 'items-end self-end ml-auto' : 'items-start'
              )}
            >
              <div className={clsx(
                'p-4 rounded-2xl text-sm font-medium leading-relaxed shadow-sm',
                isMe
                  ? 'bg-primary text-on-primary rounded-tr-none shadow-primary/10'
                  : 'bg-white text-stone-600 rounded-tl-none'
              )}>
                {msg.content}
              </div>
              <span className={clsx(
                'text-[9px] font-black text-stone-300 mt-2 uppercase tracking-widest',
                isMe ? 'mr-1' : 'ml-1'
              )}>
                {isMe ? 'Anda' : patientFirstName} • {format(new Date(msg.createdAt), 'HH:mm', { locale: localeId })}
              </span>
            </div>
          )
        })}

        {(!messages || messages.length === 0) && (
          <div className="h-full flex flex-col items-center justify-center text-center p-10 opacity-40">
            <span className="material-symbols-outlined text-4xl mb-2">chat_bubble</span>
            <p className="text-xs font-bold uppercase tracking-widest">Belum ada percakapan</p>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-5 bg-white border-t border-stone-50 shrink-0">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend() }}
          className="relative flex items-center"
        >
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full bg-stone-50 border-none rounded-full py-4 pl-6 pr-16 text-sm font-medium focus:ring-2 focus:ring-primary/10 placeholder:text-stone-300 outline-none"
            placeholder="Ketik instruksi klinis..."
            type="text"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || sendMessage.isPending}
            className="absolute right-2.5 w-11 h-11 bg-primary text-on-primary rounded-full flex items-center justify-center hover:scale-105 transition-all shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50 disabled:scale-100"
          >
            <span className="material-symbols-outlined text-xl">send</span>
          </button>
        </form>
      </div>
    </section>
  )
}
