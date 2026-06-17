export function ExplainerCardsSection() {
  const cards = [
    {
      icon: 'verified_user',
      title: 'Cuidado Especializado',
      color: 'primary',
      description: 'Cada oficina em nossa plataforma passa por uma inspeção rigorosa de 50 pontos. Garantimos que tenham a tecnologia de diagnóstico mais recente e técnicos certificados para sua marca específica.',
      link: 'Saiba mais sobre verificação',
    },
    {
      icon: 'payments',
      title: 'Preços Transparentes',
      color: 'tertiary',
      description: 'Sem mais taxas ocultas ou cobranças misteriosas. Compare orçamentos com taxa fixa de vários especialistas locais e pague com segurança através da plataforma com nossa garantia de correspondência de preço.',
      link: 'Ver modelo de preços',
    },
    {
      icon: 'event_available',
      title: 'Agendamento Fácil',
      color: 'on-secondary-container',
      description: 'Agende manutenção em segundos. De trocas de óleo a reconstruções de motor, gerencie o histórico completo de serviços do seu carro e receba atualizações em tempo real através de nosso painel intuitivo.',
      link: 'Agendar uma demo',
    },
  ]

  const getColorClasses = (color) => {
    const colorMap = {
      primary: 'text-primary',
      tertiary: 'text-tertiary',
      'on-secondary-container': 'text-on-secondary-container',
    }
    const bgMap = {
      primary: 'bg-primary/10',
      tertiary: 'bg-tertiary/10',
      'on-secondary-container': 'bg-on-secondary-container/10',
    }
    return { text: colorMap[color], bg: bgMap[color] }
  }

  return (
    <section className="py-32 px-8 max-w-screen-2xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        {cards.map((card, index) => {
          const colors = getColorClasses(card.color)
          return (
            <div
              key={index}
              className="flex flex-col gap-6 p-8 rounded-3xl bg-surface-container-lowest shadow-[0_12px_40px_rgba(25,28,29,0.06)] group hover:scale-[1.02] transition-transform duration-300"
            >
              <div className={`w-16 h-16 rounded-2xl ${colors.bg} flex items-center justify-center ${colors.text}`}>
                <span
                  className="material-symbols-outlined text-3xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {card.icon}
                </span>
              </div>
              <h3 className="text-3xl font-bold font-headline tracking-tight text-on-surface">
                {card.title}
              </h3>
              <p className="text-zinc-500 leading-relaxed">{card.description}</p>
              <a
                className={`mt-auto ${colors.text} font-bold inline-flex items-center gap-2 group-hover:underline`}
                href="#"
              >
                {card.link}
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </a>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default ExplainerCardsSection
