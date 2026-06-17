export function PersonalInfoSection({ values = {}, onChange = () => {} }) {
  const handleChange = (field, value) => {
    onChange('personal', { ...values, [field]: value })
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="w-8 h-[2px] bg-primary"></span>
        <h3 className="text-xs font-bold uppercase tracking-widest text-primary font-headline">
          Dados Pessoais
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2 col-span-full">
          <label className="text-sm font-semibold text-on-surface-variant ml-1">
            Nome completo
          </label>
          <input
            className="w-full h-14 px-5 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all outline-none"
            placeholder="Ex: Roberto Carlos"
            type="text"
            value={values.nome || ''}
            onChange={(e) => handleChange('nome', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-on-surface-variant ml-1">
            CPF
          </label>
          <input
            className="w-full h-14 px-5 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all outline-none"
            placeholder="000.000.000-00"
            type="text"
            value={values.cpf || ''}
            onChange={(e) => handleChange('cpf', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-on-surface-variant ml-1">
            Idade
          </label>
          <input
            className="w-full h-14 px-5 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all outline-none"
            placeholder="25"
            type="number"
            value={values.idade || ''}
            onChange={(e) => handleChange('idade', e.target.value)}
          />
        </div>
        <div className="space-y-2 col-span-full">
          <label className="text-sm font-semibold text-on-surface-variant ml-1">
            E-mail
          </label>
          <input
            className="w-full h-14 px-5 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all outline-none"
            placeholder="nome@exemplo.com"
            type="email"
            value={values.email || ''}
            onChange={(e) => handleChange('email', e.target.value)}
          />
        </div>
        <div className="space-y-2 relative">
          <label className="text-sm font-semibold text-on-surface-variant ml-1">
            Senha
          </label>
          <div className="relative group">
            <input
              className="w-full h-14 px-5 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all outline-none"
              placeholder="••••••••"
              type="password"
              value={values.senha || ''}
              onChange={(e) => handleChange('senha', e.target.value)}
            />
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-primary transition-colors"
              type="button"
            >
              <span
                className="material-symbols-outlined text-lg"
                style={{ fontVariationSettings: "'FILL' 0" }}
              >
                visibility
              </span>
            </button>
          </div>
        </div>
        <div className="space-y-2 relative">
          <label className="text-sm font-semibold text-on-surface-variant ml-1">
            Confirmar Senha
          </label>
          <div className="relative group">
            <input
              className="w-full h-14 px-5 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all outline-none"
              placeholder="••••••••"
              type="password"
              value={values.senhaConfirm || ''}
              onChange={(e) => handleChange('senhaConfirm', e.target.value)}
            />
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-primary transition-colors"
              type="button"
            >
              <span
                className="material-symbols-outlined text-lg"
                style={{ fontVariationSettings: "'FILL' 0" }}
              >
                visibility
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PersonalInfoSection
