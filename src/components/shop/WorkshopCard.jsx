import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatDistance, getPriceRangeLabel } from '../../utils/oficina'

const PLACEHOLDER_WORKSHOP_IMAGE = '/images/hero-workshop.jpg'

export function WorkshopCard({ workshop, index = 0 }) {
  const imageUrls = Array.isArray(workshop.imagensUrls) && workshop.imagensUrls.length > 0
    ? workshop.imagensUrls
    : [workshop.imagemUrl || PLACEHOLDER_WORKSHOP_IMAGE]
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const currentImageUrl = imageUrls[currentImageIndex] || PLACEHOLDER_WORKSHOP_IMAGE
  const hasCarousel = imageUrls.length > 1
  const ratingLabel = workshop.quantidadeAvaliacoes > 0
    ? `${workshop.mediaAvaliacoes.toFixed(1).replace('.', ',')} (${workshop.quantidadeAvaliacoes})`
    : 'Sem avaliacoes'

  const handlePreviousImage = () => {
    setCurrentImageIndex((current) => (current === 0 ? imageUrls.length - 1 : current - 1))
  }

  const handleNextImage = () => {
    setCurrentImageIndex((current) => (current + 1) % imageUrls.length)
  }

  useEffect(() => {
    if (currentImageIndex >= imageUrls.length) {
      setCurrentImageIndex(0)
    }
  }, [currentImageIndex, imageUrls.length])

  return (
    <article className="group overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white shadow-[0_20px_40px_rgba(25,28,29,0.06)] transition-transform hover:-translate-y-1">
      <div className="relative mb-4 aspect-[4/3] overflow-hidden">
        <img
          className="h-full w-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
          alt={workshop.nome || 'Oficina cadastrada'}
          src={currentImageUrl}
        />
        {hasCarousel && (
          <>
            <button
              type="button"
              onClick={handlePreviousImage}
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/92 text-zinc-800 shadow-sm backdrop-blur transition-colors hover:bg-white"
              aria-label="Imagem anterior da oficina"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <button
              type="button"
              onClick={handleNextImage}
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/92 text-zinc-800 shadow-sm backdrop-blur transition-colors hover:bg-white"
              aria-label="Próxima imagem da oficina"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-zinc-950/45 px-2 py-1 backdrop-blur">
              {imageUrls.map((url, imageIndex) => (
                <button
                  key={`${url}-${imageIndex}`}
                  type="button"
                  onClick={() => setCurrentImageIndex(imageIndex)}
                  className={[
                    'h-1.5 rounded-full transition-all',
                    imageIndex === currentImageIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/55 hover:bg-white/80',
                  ].join(' ')}
                  aria-label={`Ver imagem ${imageIndex + 1} da oficina`}
                />
              ))}
            </div>
          </>
        )}
        <div className="absolute left-4 top-4 rounded-2xl bg-white/92 px-3 py-1.5 shadow-sm backdrop-blur-md">
          <span className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-600">
            {workshop.distanciaKm != null ? `${formatDistance(workshop.distanciaKm)} de voce` : 'Catalogo publico'}
          </span>
        </div>
        <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-2xl bg-white/92 px-3 py-1.5 shadow-sm backdrop-blur-md">
          <span className="material-symbols-outlined text-sm text-yellow-500" style={{ fontVariationSettings: "'FILL' 1" }}>
            star
          </span>
          <span className="text-xs font-black font-headline">{ratingLabel}</span>
        </div>
      </div>

      <div className="space-y-4 px-5 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold font-headline tracking-tight text-on-surface transition-colors group-hover:text-primary">
              {workshop.nome || 'Oficina sem nome'}
            </h3>
            <p className="text-sm font-medium text-zinc-500">{workshop.endereco || 'Endereco nao informado'}</p>
          </div>

          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-600">
            {getPriceRangeLabel(workshop)}
          </span>
        </div>

        <p className="line-clamp-3 text-sm text-zinc-600">
          {workshop.descricao || 'Descricao nao informada.'}
        </p>

        <div className="flex flex-wrap gap-2">
          {workshop.especialidades.slice(0, 3).map((speciality) => (
            <span key={speciality} className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
              {speciality}
            </span>
          ))}
          {workshop.especialidades.length === 0 && (
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-500">
              Especialidades em atualizacao
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">Servicos</p>
            <p className="mt-1 text-sm font-semibold text-zinc-700">
              {workshop.servicosOferecidos.length > 0 ? `${workshop.servicosOferecidos.length} cadastrados` : 'Sob consulta'}
            </p>
          </div>

          {workshop.id ? (
            <Link
              className="inline-flex items-center justify-center rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-red-600"
              to={`/workshop/${workshop.id}`}
            >
              Ver oficina
            </Link>
          ) : (
            <span className="text-sm font-semibold text-zinc-400">Detalhes indisponiveis</span>
          )}
        </div>
      </div>
    </article>
  )
}

export default WorkshopCard
