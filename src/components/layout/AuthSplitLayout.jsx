import { Card } from '../ui/Card'

export function AuthSplitLayout({ badge, title, description, imageSrc, imageAlt, children }) {
  return (
    <main className="min-h-screen bg-zinc-100 md:grid md:grid-cols-[minmax(320px,0.95fr)_minmax(0,1.05fr)]">
      <section className="relative hidden overflow-hidden bg-zinc-950 md:flex">
        <img alt={imageAlt} className="absolute inset-0 h-full w-full object-cover opacity-60 mix-blend-luminosity" src={imageSrc} />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/35 to-zinc-950/60" />
        <div className="relative z-10 mt-auto p-12 lg:p-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-white backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            {badge}
          </div>
          <h1 className="mt-6 text-5xl font-black leading-[0.92] tracking-tight text-white lg:text-6xl">{title}</h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-white/70">{description}</p>
        </div>
      </section>

      <section className="flex min-h-screen flex-col bg-white">
        
        <div className="flex flex-1 items-center justify-center px-4 py-6 md:px-8 lg:px-12">
          <Card className="w-full max-w-xl rounded-[2rem] p-6 shadow-[0_18px_60px_rgba(25,28,29,0.06)] md:p-8">
            {children}
          </Card>
        </div>

        <footer className="flex flex-col items-center justify-between gap-2 border-t border-zinc-200 px-4 py-4 text-center md:flex-row">
          <span className="text-base font-black text-zinc-950">Autohub</span>
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">© 2026</span>
        </footer>
      </section>
    </main>
  )
}

export default AuthSplitLayout