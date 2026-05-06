// ============================================================
// UI Component — AppLoader
// Full-screen loading spinner, consistent across the app
// ============================================================

export function AppLoader({ message = 'Memuat MESO...' }: { message?: string }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f6f3f1' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            border: '3px solid rgba(26,122,122,0.15)',
            borderTopColor: '#1a7a7a',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <p style={{ color: '#6e7979', fontSize: '0.875rem', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
          {message}
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
