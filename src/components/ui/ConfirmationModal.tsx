// ============================================================
// MESO App — Reusable Confirmation Modal
// Menggantikan window.confirm() yang memblokir UI thread.
// ============================================================
import { useEffect, useRef } from 'react'
import { clsx } from 'clsx'

export type ConfirmationVariant = 'danger' | 'warning' | 'info'

interface ConfirmationModalProps {
  isOpen: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: ConfirmationVariant
  isPending?: boolean
  onConfirm: () => void
  onCancel: () => void
}

const VARIANT_CONFIG = {
  danger: {
    iconBg: 'bg-[#b90c55]/10',
    iconColor: 'text-[#b90c55]',
    icon: 'report_problem',
    confirmBg: 'bg-[#b90c55] hover:bg-[#9a0a48] shadow-[#b90c55]/30',
    confirmText: 'text-white',
    borderAccent: 'border-[#b90c55]/20',
  },
  warning: {
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    icon: 'warning',
    confirmBg: 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30',
    confirmText: 'text-white',
    borderAccent: 'border-amber-200',
  },
  info: {
    iconBg: 'bg-primary-container/30',
    iconColor: 'text-primary',
    icon: 'info',
    confirmBg: 'bg-primary hover:bg-primary/90 shadow-primary/30',
    confirmText: 'text-on-primary',
    borderAccent: 'border-primary/20',
  },
} as const

export function ConfirmationModal({
  isOpen,
  title,
  description,
  confirmLabel = 'Konfirmasi',
  cancelLabel = 'Batal',
  variant = 'danger',
  isPending = false,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  const config = VARIANT_CONFIG[variant]
  const confirmButtonRef = useRef<HTMLButtonElement>(null)

  // Focus confirm button saat modal terbuka (accessibility)
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => confirmButtonRef.current?.focus(), 50)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Tutup modal saat tekan Escape
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onCancel])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
      className="fixed inset-0 z-[200] flex items-center justify-center p-6"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Modal Panel */}
      <div
        className={clsx(
          'relative bg-white w-full max-w-md rounded-[32px] shadow-2xl border-2 overflow-hidden',
          'animate-in zoom-in-95 fade-in duration-200',
          config.borderAccent
        )}
      >
        {/* Top accent bar */}
        <div className={clsx('h-1 w-full', variant === 'danger' ? 'bg-[#b90c55]' : variant === 'warning' ? 'bg-amber-500' : 'bg-primary')} />

        <div className="p-8 space-y-6">
          {/* Icon + Title */}
          <div className="flex items-start gap-5">
            <div className={clsx('w-14 h-14 rounded-2xl flex items-center justify-center shrink-0', config.iconBg)}>
              <span
                className={clsx('material-symbols-outlined text-3xl', config.iconColor)}
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {config.icon}
              </span>
            </div>
            <div className="space-y-1.5 pt-1">
              <h2
                id="modal-title"
                className="text-lg font-extrabold text-on-surface headline-font tracking-tight leading-tight"
              >
                {title}
              </h2>
              <p
                id="modal-description"
                className="text-sm text-stone-500 font-medium leading-relaxed"
              >
                {description}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-2">
            <button
              ref={confirmButtonRef}
              onClick={onConfirm}
              disabled={isPending}
              className={clsx(
                'w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest',
                'flex items-center justify-center gap-3 shadow-lg transition-all active:scale-95',
                'disabled:opacity-60 disabled:scale-100 disabled:cursor-not-allowed',
                config.confirmBg,
                config.confirmText
              )}
            >
              {isPending ? (
                <>
                  <span className="material-symbols-outlined text-xl animate-spin">progress_activity</span>
                  Memproses...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-xl">check_circle</span>
                  {confirmLabel}
                </>
              )}
            </button>
            <button
              onClick={onCancel}
              disabled={isPending}
              className="w-full h-12 rounded-2xl font-bold text-sm text-stone-500 hover:bg-stone-100 transition-all active:scale-95 disabled:opacity-50"
            >
              {cancelLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
