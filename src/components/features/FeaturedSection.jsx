import { Card, getButtonClasses } from '../ui'

export function FeaturedSection() {
  return (
    <section className="pb-32 px-8 max-w-screen-2xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 h-auto md:h-[600px]">
        <div className="md:col-span-8 relative rounded-3xl overflow-hidden group">
          <img
            alt="Afinação de Precisão"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            src="/images/engine-tuning.jpg"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-12 flex flex-col justify-end">
            <h4 className="text-4xl font-bold text-white font-headline mb-4">
              Conectando Clientes às Melhores Oficinas
            </h4>
            <p className="text-white/70 max-w-lg">
              Somos o elo de confiança entre você e as oficinas mais qualificadas. Cuidamos de cada detalhe para garantir a melhor experiência em seu serviço.
            </p>
          </div>
        </div>

        <div className="md:col-span-4 flex flex-col gap-8">
          <Card className="flex-1 rounded-3xl bg-zinc-100 p-8 shadow-none flex flex-col justify-center">
            <div className="text-primary font-black text-5xl mb-2">450+</div>
            <div className="text-sm font-bold uppercase tracking-widest text-zinc-400 font-headline">
              Oficinas Parceiras
            </div>
            <p className="mt-4 text-on-surface-variant font-medium">
              Rede de oficinas selecionadas e verificadas em todo o país, prontas para atender você com excelência.
            </p>
          </Card>

          <Card className="relative flex-1 overflow-hidden rounded-3xl bg-red-600 p-8 text-white shadow-none flex flex-col justify-center group">
            <div className="relative z-10">
              <h5 className="text-2xl font-bold font-headline mb-2">Sua Oficina Conosco?</h5>
              <p className="text-white/80 mb-6">Faça parte da rede AutoHub e alcance mais clientes em busca de qualidade.</p>
              <button className={getButtonClasses({ variant: 'secondary', className: 'text-red-600' })}>
                Saiba Mais
              </button>
            </div>
            <span
              className="material-symbols-outlined absolute -bottom-4 -right-4 text-9xl opacity-10 group-hover:rotate-12 transition-transform duration-500"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              settings
            </span>
          </Card>
        </div>
      </div>
    </section>
  )
}

export default FeaturedSection
