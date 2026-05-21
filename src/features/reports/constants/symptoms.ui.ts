// ============================================================
// MESO App — UI & Presentation Symptom Configuration
// This file only contains display data (icons, translations, formatting)
// ============================================================
import type { SymptomKey } from './symptoms.domain'

export interface SymptomUIDefinition {
  key: SymptomKey
  label: string
  labelEn: string
  icon: string
  description: string
  isSentinel?: boolean
  scaleLabels?: string[]
}

export const SYMPTOMS_UI_CONFIG: SymptomUIDefinition[] = [
  {
    key: 'nausea',
    label: 'Mual',
    labelEn: 'Nausea',
    icon: '🤢',
    description: 'Perasaan tidak nyaman di perut, ingin muntah',
    scaleLabels: [
      'Tidak Ada',
      'Ringan (tidak mengganggu aktivitas)',
      'Sedang (mengganggu aktivitas, butuh obat)',
      'Berat (tidak bisa makan/ minum, rawat inap)',
    ],
  },
  {
    key: 'vomiting',
    label: 'Muntah',
    labelEn: 'Vomiting',
    icon: '🤮',
    description: 'Mengeluarkan isi perut',
    scaleLabels: [
      'Tidak Ada',
      'Ringan (1-2 kali/hari)',
      'Sedang (3-5 kali/hari)',
      'Berat (>5 kali/hari, dehidrasi)',
    ],
  },
  {
    key: 'diarrhea',
    label: 'Diare',
    labelEn: 'Diarrhea',
    icon: '🚽',
    description: 'BAB cair dengan frekuensi tinggi',
    scaleLabels: [
      'Tidak Ada',
      'Ringan (≤4 kali/hari)',
      'Sedang (5-6 kali/hari)',
      'Berat (≥7 kali/hari, dehidrasi)',
    ],
  },
  {
    key: 'constipation',
    label: 'Sembelit',
    labelEn: 'Constipation',
    icon: '💩',
    description: 'Kesulitan buang air besar',
    scaleLabels: [
      'Tidak Ada',
      'Ringan (1-2 hari tidak BAB)',
      'Sedang (3-4 hari tidak BAB)',
      'Berat (>5 hari, perlu tindakan medis)',
    ],
  },
  {
    key: 'mucositis',
    label: 'Sariawan',
    labelEn: 'Mucositis',
    icon: '👄',
    description: 'Luka/nyeri pada bibir, gusi, atau mulut',
    scaleLabels: [
      'Tidak Ada',
      'Ringan (sedikit nyeri, bisa makan)',
      'Sedang (nyeri, sulit makan padat)',
      'Berat (tidak bisa makan/ minum, butuh cairan IV)',
    ],
  },
  {
    key: 'alopecia',
    label: 'Rambut Rontok',
    labelEn: 'Alopecia',
    icon: '👩‍🦲',
    description: 'Kerontokan atau penipisan rambut',
    scaleLabels: [
      'Tidak Ada',
      'Ringan (penipisan)',
      'Sedang (rontok jelas, perlu penutup kepala)',
      'Berat (rontok total)',
    ],
  },
  {
    key: 'fatigue',
    label: 'Lelah',
    labelEn: 'Fatigue',
    icon: '😴',
    description: 'Rasa lelah berlebih atau kurang tenaga',
    scaleLabels: [
      'Tidak Ada',
      'Ringan (sedikit lelah, bisa aktivitas)',
      'Sedang (butuh istirahat sering)',
      'Berat (tidak mampu aktivitas dasar)',
    ],
  },
  {
    key: 'neuropathy',
    label: 'Nyeri Kesemutan',
    labelEn: 'Neuropathy',
    icon: '⚡',
    description: 'Rasa nyeri, kebas, atau kesemutan di tangan/kaki',
    scaleLabels: [
      'Tidak Ada',
      'Ringan (tidak mengganggu aktivitas)',
      'Sedang (mengganggu aktivitas sehari-hari)',
      'Berat (tidak bisa berjalan/ aktivitas)',
    ],
  },
  {
    key: 'insomnia',
    label: 'Gangguan Tidur',
    labelEn: 'Insomnia',
    icon: '🌙',
    description: 'Kesulitan untuk tidur atau sering terbangun',
    scaleLabels: [
      'Tidak Ada',
      'Ringan (kadang sulit tidur)',
      'Sedang (sering terbangun, butuh obat)',
      'Berat (tidak bisa tidur sama sekali)',
    ],
  },
  {
    key: 'appetiteLoss',
    label: 'Nafsu Makan Turun',
    labelEn: 'Appetite Loss',
    icon: '🍽️',
    description: 'Kehilangan atau penurunan nafsu makan',
    scaleLabels: [
      'Tidak Ada',
      'Ringan (makan berkurang sedikit)',
      'Sedang (berkurang banyak, BB menurun)',
      'Berat (tidak mau makan sama sekali)',
    ],
  },
  {
    key: 'skinReaction',
    label: 'Reaksi Kulit',
    labelEn: 'Skin Reaction',
    icon: '🩹',
    description: 'Ruam, kemerahan, atau gatal',
    scaleLabels: [
      'Tidak Ada',
      'Ringan',
      'Sedang',
      'Berat',
    ],
  },
  {
    key: 'fever',
    label: 'Demam',
    labelEn: 'Fever',
    icon: '🌡️',
    description: 'Suhu tubuh ≥ 38°C — SENTINEL',
    isSentinel: true,
  },
  {
    key: 'dyspnea',
    label: 'Sesak Napas',
    labelEn: 'Dyspnea',
    icon: '😮‍💨',
    description: 'Kesulitan bernapas — SENTINEL',
    isSentinel: true,
  },
]
