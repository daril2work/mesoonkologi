import { useState, useRef, useEffect } from 'react'
import { MessageSquare, MoreHorizontal, Clock, Send } from 'lucide-react'
import { clsx } from 'clsx'
import { useChatMessages, useSendMessage } from '../api/useChat'

interface PatientChatPanelProps {
  patientId: string
}

export default function PatientChatPanel({ patientId }: PatientChatPanelProps) {
  const { data: messages } = useChatMessages(patientId)
  const { mutate: sendMessage } = useSendMessage()
  const [inputText, setInputText] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || !patientId) return
    sendMessage({ receiverId: patientId, content: inputText })
    setInputText('')
  }

  return (
    <section className="bg-white rounded-[48px] border border-clinical-border shadow-clinical-lg flex flex-col h-[640px] overflow-hidden border-b-4 border-b-clinical-teal/10">
      <div className="px-10 py-8 border-b border-clinical-border flex items-center justify-between bg-clinical-surface/30 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-clinical-teal-soft rounded-xl flex items-center justify-center text-clinical-teal border border-clinical-teal/10">
            <MessageSquare size={20} strokeWidth={2.5} />
          </div>
          <h3 className="font-display font-black text-clinical-text uppercase tracking-widest text-sm m-0">Konsultasi Personal</h3>
        </div>
        <button className="w-10 h-10 rounded-xl hover:bg-clinical-surface flex items-center justify-center text-clinical-text-soft transition-all border border-transparent hover:border-clinical-border">
          <MoreHorizontal size={22} />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-hide bg-[radial-gradient(#f1eeec_1.5px,transparent_1.5px)] [background-size:24px_24px]">
        {messages?.map((msg, idx) => {
          const isMe = msg.senderId !== patientId
          return (
            <div key={idx} className={clsx("flex flex-col", isMe ? "items-end" : "items-start")}>
              <div className={clsx(
                "max-w-[85%] p-5 text-sm font-bold leading-relaxed shadow-sm",
                isMe 
                  ? "bg-clinical-teal text-white rounded-[24px] rounded-tr-none shadow-clinical-teal/20" 
                  : "bg-white text-clinical-text border border-clinical-border rounded-[24px] rounded-tl-none"
              )}>
                {msg.content}
              </div>
              <span className="text-[10px] font-black text-clinical-text-soft uppercase tracking-widest mt-3 px-2 flex items-center gap-2">
                <Clock size={10} />
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )
        })}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-8 bg-white border-t border-clinical-border shrink-0">
        <div className="flex items-center gap-4">
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ketik anjuran atau edukasi..." 
            className="flex-1 bg-clinical-surface border border-transparent rounded-[20px] px-6 py-[18px] text-sm font-sans font-bold focus:bg-white focus:border-clinical-teal/20 focus:ring-4 focus:ring-clinical-teal/5 outline-none transition-all placeholder:text-clinical-text-soft/60"
          />
          <button 
            type="submit"
            className="w-14 h-14 bg-clinical-teal text-white rounded-[20px] flex items-center justify-center shadow-xl shadow-clinical-teal/30 hover:scale-105 active:scale-95 transition-all"
          >
            <Send size={22} strokeWidth={2.5} />
          </button>
        </div>
      </form>
    </section>
  )
}
