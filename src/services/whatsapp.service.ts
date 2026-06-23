import { supabase } from '@lib/supabase'

export interface WAOptions {
  target: string    // Phone number (e.g., 628123456789)
  message: string   // Content of the message
  delay?: number    // Delay in seconds
  schedule?: number // Unix timestamp in seconds for scheduled sending
}

export const whatsappService = {
  /**
   * Send a WhatsApp message via Supabase Edge Function
   */
  async sendMessage({ target, message, schedule }: WAOptions) {
    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp', {
        body: { target, message, schedule }
      })

      if (error) throw error
      
      if (!data.status) {
        // Fallback untuk Meta Graph API yang mungkin mengembalikan format berbeda
        if (data.messages && data.messages.length > 0) {
           return data
        }
        throw new Error(data.reason || data.error?.message || 'Gagal mengirim pesan WA via Edge Function')
      }

      return data
    } catch (error) {
      console.error('[WhatsAppService Error]', error)
      throw error
    }
  },

  /**
   * Format reminder message for patient
   */
  formatReminderMessage(patientName: string, date: string, time: string, title: string) {
    return `Halo Ibu/Bapak *${patientName}*,\n\nKami dari tim *Sahabat Pejuang* ingin mengingatkan jadwal *${title}* Anda pada:\n\n🗓️ Tanggal: *${date}*\n⏰ Jam: *${time}*\n\nMohon hadir tepat waktu. Jika ada kendala, silakan hubungi kami melalui fitur chat di aplikasi. Terima kasih.`
  }
}
