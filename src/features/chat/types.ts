// ============================================================
// Chat Domain — Types
// ============================================================
import type { AuthUser } from '@features/auth/types'
import type { PatientProfile } from '@features/auth/types'

export type ChatRoomStatus = 'open' | 'closed'

export interface ChatMessage {
  id: string
  roomId: string
  senderId: string
  message: string
  isRead: boolean
  timestamp: string
  sender?: AuthUser
}

export interface ChatRoom {
  id: string
  patientId: string
  status: ChatRoomStatus
  createdAt: string
  patient?: PatientProfile
  messages?: ChatMessage[]
  lastMessage?: ChatMessage
}
