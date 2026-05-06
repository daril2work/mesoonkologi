// ============================================================
// UI Component — Toggle
// Accessible switch toggle for the Lumina Healing design system
// ============================================================

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  id?: string
}

export function Toggle({ checked, onChange, label, id }: ToggleProps) {
  const toggleId = id ?? `toggle-${label.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
      <label
        htmlFor={toggleId}
        style={{ fontSize: 16, fontWeight: 600, color: '#1b1c1b', cursor: 'pointer' }}
      >
        {label}
      </label>

      <button
        id={toggleId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        style={{
          width: 52,
          height: 30,
          borderRadius: 999,
          border: 'none',
          background: checked
            ? 'linear-gradient(135deg, #006060, #1a7a7a)'
            : '#e5e2e0',
          cursor: 'pointer',
          position: 'relative',
          transition: 'background 0.25s ease',
          padding: 0,
          minWidth: 52,
          flexShrink: 0,
          boxShadow: checked ? '0 2px 8px rgba(26,122,122,0.35)' : 'none',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 3,
            left: checked ? 'calc(100% - 27px)' : 3,
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: '#ffffff',
            transition: 'left 0.25s ease',
            boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          }}
        />
      </button>
    </div>
  )
}
