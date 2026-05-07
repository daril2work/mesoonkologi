import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppRouter from './app/AppRouter'
import AppProviders from './app/AppProviders'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { registerSW } from 'virtual:pwa-register'

// Register PWA Service Worker for offline support and auto-updates
if ('serviceWorker' in navigator) {
  registerSW({ immediate: true })
}

const rootElement = document.getElementById('root')!

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <AppProviders>
        <AppRouter />
      </AppProviders>
    </ErrorBoundary>
  </StrictMode>
)
