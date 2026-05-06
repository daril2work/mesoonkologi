import React from 'react'
import PatientBottomNav from './PatientBottomNav'

interface PatientLayoutProps {
  children: React.ReactNode
}

export default function PatientLayout({ children }: PatientLayoutProps) {
  return (
    <div className="min-h-screen bg-surface-container-low relative font-body antialiased">
      {/* Main Content Area */}
      <main className="pb-24">
        {children}
      </main>

      {/* Bottom Navigation Bar */}
      <PatientBottomNav />
    </div>
  )
}

