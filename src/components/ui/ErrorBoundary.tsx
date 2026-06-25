// ============================================================
// MESO App — Error Boundary (Refactored)
// S-06: Migrasi dari 40+ inline style{} ke Tailwind utilities
// Logger integration dipertahankan.
// ============================================================
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { logger } from '@utils/logger'

interface Props {
  children: ReactNode
  /** Opsional: fallback UI kustom */
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Uncaught component error caught by Boundary', error, {
      componentStack: errorInfo.componentStack,
    })
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = '/'
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        // S-06: Semua inline style{} → Tailwind utility classes
        <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-clinical-alert-muted rounded-full flex items-center justify-center mb-8 text-clinical-alert">
            <AlertTriangle size={40} />
          </div>

          {/* Heading */}
          <h1 className="font-headline text-3xl font-extrabold text-on-surface mb-4 tracking-tight">
            Terjadi Kendala Teknis
          </h1>

          {/* Description */}
          <p className="text-on-surface-variant text-base leading-relaxed max-w-md mb-10">
            Mohon maaf atas ketidaknyamanannya. Kami menemui sedikit hambatan saat memuat halaman ini.
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-4 w-full max-w-[280px]">
            <button
              onClick={this.handleReset}
              className="bg-primary text-on-primary py-4 rounded-3xl font-bold text-sm flex items-center justify-center gap-3 shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-95"
            >
              <RefreshCw size={18} />
              Coba Segarkan Halaman
            </button>
            <button
              onClick={this.handleGoHome}
              className="bg-transparent text-on-surface-variant border border-outline-variant py-4 rounded-3xl font-semibold text-sm flex items-center justify-center gap-3 hover:bg-surface-container transition-all active:scale-95"
            >
              <Home size={18} />
              Kembali ke Beranda
            </button>
          </div>

          {/* Dev error detail */}
          {import.meta.env.DEV && this.state.error && (
            <details className="mt-12 text-left w-full max-w-xl">
              <summary className="text-clinical-alert cursor-pointer font-semibold text-sm">
                Detail Error (Development Only)
              </summary>
              <pre className="bg-white p-4 rounded-xl text-xs overflow-x-auto mt-3 border border-clinical-alert-muted text-clinical-alert">
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }
}

// ============================================================
// S-06: FeatureErrorBoundary — Lightweight wrapper untuk
// membungkus fitur secara per-domain, bukan hanya global.
// Memberikan fallback lebih compact tanpa full-page redirect.
// ============================================================
interface FeatureProps {
  children: ReactNode
  featureName?: string
}

interface FeatureState {
  hasError: boolean
}

export class FeatureErrorBoundary extends Component<FeatureProps, FeatureState> {
  public state: FeatureState = { hasError: false }

  public static getDerivedStateFromError(): FeatureState {
    return { hasError: true }
  }

  public componentDidCatch(error: Error, info: ErrorInfo) {
    logger.error(`[FeatureBoundary] Error in "${this.props.featureName ?? 'unknown'}"`, error, {
      componentStack: info.componentStack,
    })
  }

  private handleRetry = () => this.setState({ hasError: false })

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 rounded-2xl bg-clinical-alert-muted border-2 border-clinical-alert/20 flex flex-col items-center gap-4 text-center">
          <span className="material-symbols-outlined text-4xl text-clinical-alert" style={{ fontVariationSettings: "'FILL' 1" }}>
            error
          </span>
          <p className="font-bold text-on-surface font-headline">
            {this.props.featureName ? `Gagal memuat: ${this.props.featureName}` : 'Terjadi error pada komponen ini'}
          </p>
          <button
            onClick={this.handleRetry}
            className="text-xs font-black text-clinical-alert uppercase tracking-widest hover:underline"
          >
            Coba Lagi
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
