export function VehicleInfoSection({ values = {}, onChange = () => {} }) {
  const handleChange = (field, value) => {
    onChange('vehicle', { ...values, [field]: value })
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="w-8 h-[2px] bg-primary"></span>
        <h3 className="text-xs font-bold uppercase tracking-widest text-primary font-headline">
          Cadastro do Veículo
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-on-surface-variant ml-1">
            Ano
          </label>
          <input
            className="w-full h-14 px-5 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all outline-none"
            placeholder="2024"
            type="text"
            value={values.ano || ''}
            onChange={(e) => handleChange('ano', e.target.value)}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-semibold text-on-surface-variant ml-1">
            Modelo
          </label>
          <input
            className="w-full h-14 px-5 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all outline-none"
            placeholder="Ex: Porsche 911 Carrera"
            type="text"
            value={values.modelo || ''}
            onChange={(e) => handleChange('modelo', e.target.value)}
          />
        </div>
        <div className="space-y-2 col-span-full">
          <label className="text-sm font-semibold text-on-surface-variant ml-1">
            Quilometragem
          </label>
          <div className="relative">
            <input
              className="w-full h-14 px-5 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all outline-none"
              placeholder="0"
              type="number"
              value={values.quilometragem || ''}
              onChange={(e) => handleChange('quilometragem', e.target.value)}
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 uppercase tracking-widest">
              km
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default VehicleInfoSection
