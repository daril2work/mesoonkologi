// ============================================================
// MESO App — Pharmacist Chat Portal
// Dashboard pesan untuk apoteker berkomunikasi dengan pasien.
// ============================================================
import React, { useState, useEffect, useRef } from 'react'
import PharmacistLayout from '../components/PharmacistLayout'
import { useLocation } from 'react-router-dom'
import { useAuthStore } from '@features/auth/store'
import { useChatMessages, useSendMessage, usePharmacistChatRooms } from '../api/useChat'
import { format } from 'date-fns'
import { clsx } from 'clsx'

export default function PharmacistChat() {
  const location = useLocation()
  const { user } = useAuthStore()
  const { data: chatRooms, isLoading: isLoadingRooms } = usePharmacistChatRooms()
  
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
    location.state?.patientId || null
  )
  const [inputText, setInputText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: messages, isLoading: isLoadingMessages } = useChatMessages(selectedPatientId || undefined)
  const sendMessage = useSendMessage()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || !selectedPatientId) return

    sendMessage.mutate({
      receiverId: selectedPatientId,
      content: inputText.trim()
    })
    setInputText('')
  }

  const selectedPatient = chatRooms?.find(p => p.id === selectedPatientId)

  return (
    <PharmacistLayout>
      <div className="h-[calc(100vh-64px)] flex overflow-hidden">
        {/* LEFT: ROOM LIST */}
        <aside className="w-80 bg-stone-50 border-r border-stone-100 flex flex-col">
          <div className="p-6 border-b border-stone-100 bg-white">
            <h3 className="font-bold text-lg headline-font">Pusat Pesan</h3>
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-1">Konsultasi Pasien</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {isLoadingRooms ? (
              <div className="py-10 text-center animate-pulse text-stone-300 font-bold uppercase text-[10px] tracking-widest">Memuat Chat...</div>
            ) : chatRooms?.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <p className="text-xs text-stone-400 font-medium">Belum ada percakapan aktif.</p>
              </div>
            ) : (
              chatRooms?.map(room => (
                <button
                  key={room.id}
                  onClick={() => setSelectedPatientId(room.id)}
                  className={clsx(
                    "w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left",
                    selectedPatientId === room.id ? "bg-white shadow-sm ring-1 ring-stone-100" : "hover:bg-stone-100"
                  )}
                >
                  <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center font-bold text-primary text-sm shrink-0 border border-primary/10">
                    {room.full_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-on-surface truncate">{room.full_name}</p>
                    <p className="text-[10px] text-stone-400 uppercase font-black tracking-tighter">Pasien Aktif</p>
                  </div>
                  {selectedPatientId === room.id && <div className="w-2 h-2 rounded-full bg-primary"></div>}
                </button>
              ))
            )}
          </div>
        </aside>

        {/* RIGHT: CHAT WINDOW */}
        <main className="flex-1 flex flex-col bg-white">
          {selectedPatientId ? (
            <>
              {/* Chat Header */}
              <header className="px-8 py-4 border-b border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center font-bold text-stone-400 border border-stone-200">
                    {selectedPatient?.full_name?.charAt(0) || 'P'}
                  </div>
                  <div>
                    <h4 className="font-bold text-on-surface">{selectedPatient?.full_name || 'Pasien'}</h4>
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-teal-600 uppercase tracking-widest">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                      Terhubung
                    </div>
                  </div>
                </div>
                <button className="text-stone-400 hover:text-on-surface transition-colors">
                  <span className="material-symbols-outlined">more_vert</span>
                </button>
              </header>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-stone-50/30">
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center h-full text-stone-300 font-bold uppercase text-[10px] tracking-widest animate-pulse">Menyelaraskan Pesan...</div>
                ) : (
                  messages?.map(msg => {
                    const isMe = msg.senderId === user?.id
                    return (
                      <div key={msg.id} className={clsx(
                        "max-w-[70%] flex flex-col gap-1.5",
                        isMe ? "ml-auto items-end" : "mr-auto items-start"
                      )}>
                        <div className={clsx(
                          "px-6 py-4 rounded-[28px] text-sm leading-relaxed shadow-sm",
                          isMe 
                            ? "bg-primary text-on-primary rounded-tr-none" 
                            : "bg-white text-on-surface rounded-tl-none border border-stone-100"
                        )}>
                          {msg.content}
                        </div>
                        <span className="text-[9px] font-black text-stone-400 px-2 uppercase tracking-widest">
                          {format(new Date(msg.createdAt), 'HH:mm')}
                        </span>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-8 border-t border-stone-100">
                <form onSubmit={handleSend} className="flex gap-4">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Tulis saran klinis atau balas pesan pasien..."
                    className="flex-1 bg-stone-100 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                  <button
                    type="submit"
                    disabled={sendMessage.isPending || !inputText.trim()}
                    className="w-14 h-14 rounded-2xl bg-primary text-on-primary flex items-center justify-center hover:opacity-90 transition-all active:scale-95 disabled:opacity-40"
                  >
                    <span className="material-symbols-outlined">send</span>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-20 text-center text-stone-300">
              <span className="material-symbols-outlined text-6xl mb-6 opacity-20">forum</span>
              <h3 className="font-bold text-xl text-stone-400 mb-2">Pilih Percakapan</h3>
              <p className="text-sm max-w-xs font-medium">Pilih pasien dari daftar di samping untuk memulai konsultasi klinis.</p>
            </div>
          )}
        </main>
      </div>
    </PharmacistLayout>
  )
}
