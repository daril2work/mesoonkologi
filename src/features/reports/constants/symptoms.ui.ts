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
}

export const SYMPTOMS_UI_CONFIG: SymptomUIDefinition[] = [
  {
    key: 'nausea',
    label: 'Mual',
    labelEn: 'Nausea',
    icon: '🤢',
    description: 'Perasaan ingin muntah',
  },
  {
    key: 'vomiting',
    label: 'Muntah',
    labelEn: 'Vomiting',
    icon: '🤮',
    description: 'Episode muntah aktual',
  },
  {
    key: 'diarrhea',
    label: 'Diare',
    labelEn: 'Diarrhea',
    icon: '🚽',
    description: 'BAB cair > 3 kali/hari',
  },
  {
    key: 'fatigue',
    label: 'Kelelahan',
    labelEn: 'Fatigue',
    icon: '😴',
    description: 'Rasa lelah ekstrem',
  },
  {
    key: 'pain',
    label: 'Nyeri',
    labelEn: 'Pain',
    icon: '🤕',
    description: 'Nyeri di bagian tubuh',
  },
  {
    key: 'mucositis',
    label: 'Sariawan',
    labelEn: 'Mucositis',
    icon: '👄',
    description: 'Luka/nyeri di mulut',
  },
  {
    key: 'neuropathy',
    label: 'Kesemutan',
    labelEn: 'Neuropathy',
    icon: '⚡',
    description: 'Kesemutan/kebas di tangan/kaki',
  },
  {
    key: 'skinReaction',
    label: 'Reaksi Kulit',
    labelEn: 'Skin Reaction',
    icon: '🩹',
    description: 'Ruam, kemerahan, atau gatal',
  },
  {
    key: 'appetiteLoss',
    label: 'Nafsu Makan',
    labelEn: 'Appetite Loss',
    icon: '🍽️',
    description: 'Penurunan keinginan makan',
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
