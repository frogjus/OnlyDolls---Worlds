export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--od-bg-base)]">
      {/* Gradient mesh — dark, subtle, multi-point */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            'radial-gradient(ellipse 80% 60% at 20% 30%, rgba(20,184,166,0.07) 0%, transparent 60%)',
            'radial-gradient(ellipse 60% 50% at 80% 70%, rgba(124,58,237,0.05) 0%, transparent 55%)',
            'radial-gradient(ellipse 70% 50% at 50% 100%, rgba(6,182,212,0.04) 0%, transparent 50%)',
          ].join(', '),
        }}
      />
      {/* Fine grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />
      {/* Vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_rgba(0,0,0,0.4)_100%)]" />
      <div className="relative z-10">{children}</div>
    </main>
  )
}
