import { Link } from 'react-router-dom'
import { getButtonClasses } from '../ui'

export function HeroSection() {
  return (
    <section className="relative min-h-[870px] flex items-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          alt="Luxury Car Workshop"
          className="w-full h-full object-cover brightness-[0.4]"
          src="/images/hero-workshop.jpg"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
      </div>

      <div className="relative z-10 max-w-screen-2xl mx-auto px-8 w-full">
        <div className="max-w-3xl">
          <span className="inline-block py-1 px-3 mb-6 rounded-full bg-primary/10 text-primary font-bold text-xs tracking-widest uppercase font-headline">
            O Marketplace de Precisão
          </span>
          <h1 className="text-6xl md:text-8xl font-black text-white leading-[0.9] tracking-tighter font-headline mb-8">
            O melhor amigo do seu <span className="text-primary">carro.</span>                
          </h1>
          <p className="text-xl text-zinc-300 mb-10 max-w-xl leading-relaxed">
            Descubra e reserve oficinas de alta qualidade e verificadas para seu veículo. Manutenção premium encontra precisão clínica no mundo mais confiável de atelier automotivo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/workshops"
              className={getButtonClasses({ variant: 'primary', size: 'lg', className: 'px-8 text-lg shadow-xl' })}
            >
              Explorar Oficinas
            </Link>
            <button className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-8 py-4 text-lg font-bold text-white backdrop-blur-md transition-colors hover:bg-white/20">
              Como funciona
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
