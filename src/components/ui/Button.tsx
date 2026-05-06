// ============================================================
// UI Component — Button
// Primary action button for the Lumina Healing design system
// ============================================================
import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean
  children: ReactNode
  variant?: 'primary' | 'ghost'
  type?: 'button' | 'submit' | 'reset'
}

export function Button({ isLoading, children, variant = 'primary', disabled, type = 'button', style, ...props }: ButtonProps) {
  const isPrimary = variant === 'primary'
  const isDisabled = disabled || isLoading

  return (
    <button
      type={type}
      disabled={isDisabled}
      style={{
        width: '100%',
        height: 58,
        borderRadius: 999,
        border: 'none',
        background: isDisabled && isPrimary
          ? '#a5cece'
          : isPrimary
            ? 'linear-gradient(135deg, #006060 0%, #1a7a7a 100%)'
            : 'transparent',
        color: isPrimary ? '#ffffff' : '#1a7a7a',
        fontSize: 17,
        fontWeight: 700,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        fontFamily: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif',
        letterSpacing: '-0.01em',
        boxShadow: isDisabled || !isPrimary ? 'none' : '0 4px 20px rgba(26,122,122,0.4)',
        transition: 'all 0.15s ease',
        opacity: isDisabled ? 0.8 : 1,
        ...style,
      }}
      onMouseDown={(e) => {
        if (!isDisabled) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.98)'
        props.onMouseDown?.(e)
      }}
      onMouseUp={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'
        props.onMouseUp?.(e)
      }}
      onTouchStart={(e) => {
        if (!isDisabled) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.98)'
        props.onTouchStart?.(e)
      }}
      onTouchEnd={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'
        props.onTouchEnd?.(e)
      }}
      {...props}
    >
      {isLoading ? 'Memproses...' : children}
    </button>
  )
}
