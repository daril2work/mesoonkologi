// ============================================================
// UI Component — FormInput
// Reusable pill-shaped input for the Lumina Healing design system
// ============================================================
import { type InputHTMLAttributes, forwardRef } from 'react'

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
}

const baseStyle: React.CSSProperties = {
  width: '100%',
  height: 56,
  borderRadius: 999,
  border: 'none',
  background: '#eae8e6',
  padding: '0 20px',
  fontSize: 16,
  color: '#1b1c1b',
  outline: 'none',
  fontFamily: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif',
  boxSizing: 'border-box',
  transition: 'background 0.2s ease',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#3e4948',
  marginBottom: 8,
  letterSpacing: '0.01em',
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, style, onFocus, onBlur, ...props }, ref) => {
    return (
      <div>
        <label style={labelStyle}>{label}</label>
        <input
          ref={ref}
          style={{ ...baseStyle, ...style }}
          onFocus={(e) => {
            e.target.style.background = '#f0edeb'
            e.target.style.boxShadow = '0 0 0 2px rgba(26,122,122,0.3)'
            onFocus?.(e)
          }}
          onBlur={(e) => {
            e.target.style.background = '#eae8e6'
            e.target.style.boxShadow = 'none'
            onBlur?.(e)
          }}
          {...props}
        />
      </div>
    )
  }
)

FormInput.displayName = 'FormInput'
