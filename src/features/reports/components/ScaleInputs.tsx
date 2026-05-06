// ============================================================
// MESO App — Symptom Scale Input Components
// Reusable input components for the CTCAE-based report form
// ============================================================

interface EmoticonScaleProps {
  value: number | null
  onChange: (val: number) => void
}

const EMOTICON_OPTIONS = [
  { level: 0, emoji: '😃', label: 'Tidak Ada' },
  { level: 1, emoji: '😐', label: 'Ringan' },
  { level: 2, emoji: '😨', label: 'Sedang' },
  { level: 3, emoji: '😫', label: 'Berat' },
] as const

export function EmoticonScale({ value, onChange }: EmoticonScaleProps) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
      {EMOTICON_OPTIONS.map((opt) => {
        const isSelected = value === opt.level
        return (
          <button
            key={opt.level}
            type="button"
            onClick={() => onChange(opt.level)}
            aria-label={`${opt.label} (${opt.level})`}
            aria-pressed={isSelected}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 4px',
              borderRadius: '16px',
              border: isSelected ? '2px solid #046b5e' : '2px solid transparent',
              background: isSelected ? '#e5f9f5' : '#f9f6f6',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{
              fontSize: '1.75rem',
              filter: isSelected ? 'none' : 'grayscale(100%) opacity(60%)',
              transition: 'all 0.2s ease'
            }}>
              {opt.emoji}
            </div>
            <span style={{
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              fontSize: '0.65rem',
              fontWeight: 700,
              color: isSelected ? '#046b5e' : '#727878',
              textAlign: 'center'
            }}>
              {opt.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

interface BinaryScaleProps {
  value: number | null
  onChange: (val: number) => void
}

export function BinaryScale({ value, onChange }: BinaryScaleProps) {
  return (
    <div style={{ display: 'flex', gap: '12px' }}>
      <button
        type="button"
        onClick={() => onChange(0)}
        aria-pressed={value === 0}
        style={{
          flex: 1,
          height: '48px',
          borderRadius: '16px',
          border: value === 0 ? '2px solid #046b5e' : '1px solid rgba(194, 200, 199, 0.3)',
          background: value === 0 ? '#e5f9f5' : '#ffffff',
          color: value === 0 ? '#046b5e' : '#727878',
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          fontWeight: 700,
          fontSize: '0.875rem',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        Tidak
      </button>
      <button
        type="button"
        onClick={() => onChange(1)}
        aria-pressed={value === 1}
        style={{
          flex: 1,
          height: '48px',
          borderRadius: '16px',
          border: value === 1 ? '2px solid #b90c55' : '1px solid rgba(194, 200, 199, 0.3)',
          background: value === 1 ? '#ffe9ec' : '#ffffff',
          color: value === 1 ? '#b90c55' : '#727878',
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          fontWeight: 700,
          fontSize: '0.875rem',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        Ya
      </button>
    </div>
  )
}

// --- NUTRITION INPUTS ---

interface CounterInputProps {
  value: number | null
  onChange: (val: number) => void
  min?: number
  max?: number
}

export function CounterInput({ value = 0, onChange, min = 0, max = 20 }: CounterInputProps) {
  const current = value || 0
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', padding: '8px 0' }}>
      <button
        type="button"
        disabled={current <= min}
        onClick={() => onChange(Math.max(min, current - 1))}
        style={{
          width: '48px', height: '48px', borderRadius: '16px',
          background: '#f5f5f5', border: 'none',
          fontSize: '1.5rem', fontWeight: 700, color: '#046b5e',
          cursor: 'pointer', opacity: current <= min ? 0.3 : 1
        }}
      >
        -
      </button>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', fontWeight: 800, color: '#046b5e', lineHeight: 1 }}>
          {current}
        </div>
        <div style={{ fontSize: '0.75rem', color: '#727878', fontWeight: 600, marginTop: '4px' }}>
          Gelas
        </div>
      </div>
      <button
        type="button"
        disabled={current >= max}
        onClick={() => onChange(Math.min(max, current + 1))}
        style={{
          width: '48px', height: '48px', borderRadius: '16px',
          background: '#f5f5f5', border: 'none',
          fontSize: '1.5rem', fontWeight: 700, color: '#046b5e',
          cursor: 'pointer', opacity: current >= max ? 0.3 : 1
        }}
      >
        +
      </button>
    </div>
  )
}

interface PortionScaleProps {
  value: number | null
  onChange: (val: number) => void
}

const PORTION_OPTIONS = [
  { level: 1, label: 'Sangat Sedikit', color: '#b90c55' },
  { level: 2, label: 'Kurang', color: '#e65100' },
  { level: 3, label: 'Cukup', color: '#046b5e' },
  { level: 4, label: 'Baik', color: '#046b5e' },
  { level: 5, label: 'Sangat Baik', color: '#046b5e' },
]

export function PortionScale({ value, onChange }: PortionScaleProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', gap: '6px' }}>
        {PORTION_OPTIONS.map((opt) => {
          const isSelected = value === opt.level
          const isAtLeast = (value || 0) >= opt.level
          
          return (
            <button
              key={opt.level}
              type="button"
              onClick={() => onChange(opt.level)}
              style={{
                flex: 1, height: '40px', borderRadius: '10px',
                background: isAtLeast ? opt.color : '#f0f0f0',
                border: 'none', cursor: 'pointer',
                transition: 'all 0.2s ease',
                opacity: isSelected ? 1 : isAtLeast ? 0.6 : 1
              }}
            />
          )
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 4px' }}>
        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#727878' }}>Sangat Sedikit</span>
        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#727878' }}>Porsi Penuh</span>
      </div>
    </div>
  )
}
