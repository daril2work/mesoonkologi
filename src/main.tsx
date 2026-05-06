import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppRouter from './app/AppRouter'
import AppProviders from './app/AppProviders'
import { ErrorBoundary } from './components/ui/ErrorBoundary'

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
