import { useEffect, useMemo, useState } from 'react'
import { WorkshopCard } from '../shop/WorkshopCard'
import { useUserLocation } from '../../hooks/useUserLocation'
import { useToast } from '../../context/ToastContext'
import { getAllOficinas, getOficinasProximas } from '../../services/oficinaViewService'
import { filterWorkshops, getDistinctSpecialities, normalizeOficina } from '../../utils/oficina'

export function WorkshopsCatalogSection() {
  const [workshops, setWorkshops] = useState([])
  const [filters, setFilters] = useState({ 
    termo: '', 
    especialidade: '', 
    raioKm: 25,
    avaliacaoMinima: '',
    precoMin: '',
    precoMax: ''
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const toast = useToast()
  const userLocation = useUserLocation()

  useEffect(() => {
    let cancelled = false

    const fetchWorkshops = async () => {
      setLoading(true)
      setError('')

      try {
        const hasLocation = userLocation.latitude != null && userLocation.longitude != null
        const publicCatalogPromise = getAllOficinas()
        const data = hasLocation
          ? await getOficinasProximas({
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            cepOrigem: userLocation.cep,
            raioKm: filters.raioKm,
            especialidade: filters.especialidade || undefined,
            avaliacaoMinima: filters.avaliacaoMinima ? Number(filters.avaliacaoMinima) : undefined,
            precoMin: filters.precoMin ? Number(filters.precoMin) : undefined,
            precoMax: filters.precoMax ? Number(filters.precoMax) : undefined,
          })
          : await publicCatalogPromise
        const publicCatalog = hasLocation ? await publicCatalogPromise : data
        const publicCatalogById = new Map(
          (Array.isArray(publicCatalog) ? publicCatalog : [])
            .map(normalizeOficina)
            .map((workshop) => [workshop.id, workshop]),
        )

        if (!cancelled) {
          setWorkshops((Array.isArray(data) ? data : []).map((workshop) => {
            const normalized = normalizeOficina(workshop)
            const catalogWorkshop = publicCatalogById.get(normalized.id)

            if (!normalized.imagemUrl && catalogWorkshop?.imagemUrl) {
              return {
                ...normalized,
                imagemUrl: catalogWorkshop.imagemUrl,
                imagensUrls: catalogWorkshop.imagensUrls,
              }
            }

            return normalized
          }))
        }
      } catch (requestError) {
        if (!cancelled) {
          setWorkshops([])
          const message = requestError.message || 'Nao foi possivel carregar as oficinas cadastradas.'
          setError(message)
          toast.error(message)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchWorkshops()

    return () => {
      cancelled = true
    }
  }, [filters.raioKm, filters.especialidade, filters.avaliacaoMinima, filters.precoMin, filters.precoMax, userLocation.latitude, userLocation.longitude])

  const visibleWorkshops = useMemo(() => filterWorkshops(workshops, filters), [workshops, filters])
  const availableSpecialities = useMemo(() => getDistinctSpecialities(workshops), [workshops])

  const workshopCountLabel = useMemo(() => {
    const total = visibleWorkshops.length
    return total === 1 ? '1 oficina cadastrada' : `${total} oficinas cadastradas`
  }, [visibleWorkshops])

  const locationStatusMessage = useMemo(() => {
    if (userLocation.status === 'ready') return 'Oficinas ordenadas pela sua localizacao atual.'
    if (userLocation.status === 'cached') return 'Usando sua ultima localizacao salva para estimar proximidade.'
    if (userLocation.status === 'refreshing' || userLocation.status === 'loading') return 'Atualizando sua localizacao para buscar oficinas proximas.'
    if (userLocation.status === 'denied') return 'Sem permissao de geolocalizacao. Exibindo o catalogo publico completo.'
    if (userLocation.status === 'unsupported') return 'Seu navegador nao suporta geolocalizacao. Exibindo o catalogo publico completo.'
    return 'Explore oficinas publicas, avaliacoes e faixa de preco.'
  }, [userLocation.status])

  const handleFilterChange = (event) => {
    const { name, value } = event.target
    setFilters((current) => ({ ...current, [name]: value }))
  }

  return (
    <section className="mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-[0_20px_60px_rgba(25,28,29,0.06)]">
        <header className="border-b border-zinc-200 bg-[linear-gradient(135deg,rgba(239,68,68,0.08),rgba(249,115,22,0.06),transparent)] px-6 py-8 sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              
              <h1 className="mt-4 text-4xl font-black tracking-tight text-zinc-950">Encontre a oficina certa perto de voce</h1>
              <p className="mt-3 text-base leading-relaxed text-zinc-600">Veja distancia estimada, avaliacao media, faixa de preco e especialidades usando os endpoints publicos ja disponiveis no backend.</p>
            </div>

            
          </div>

          <p className="mt-4 text-sm font-medium text-zinc-500">{locationStatusMessage}</p>
        </header>

        <div className="border-b border-zinc-200 bg-zinc-50 px-6 py-5 sm:px-8">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            <div className="sm:col-span-2">
              <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Buscar oficina</label>
              <input
                name="termo"
                value={filters.termo}
                onChange={handleFilterChange}
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                placeholder="Nome, endereco ou descricao"
              />
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Especialidade</label>
              <select
                name="especialidade"
                value={filters.especialidade}
                onChange={handleFilterChange}
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
              >
                <option value="">Todas</option>
                {availableSpecialities.map((speciality) => (
                  <option key={speciality} value={speciality}>{speciality}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Raio</label>
              <select
                name="raioKm"
                value={filters.raioKm}
                onChange={handleFilterChange}
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
              >
                {[5, 10, 25, 50, 100].map((radius) => (
                  <option key={radius} value={radius}>{radius} km</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Avaliacao minima</label>
              <select
                name="avaliacaoMinima"
                value={filters.avaliacaoMinima}
                onChange={handleFilterChange}
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
              >
                <option value="">Qualquer uma</option>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <option key={rating} value={rating}>{rating} ⭐ ou mais</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Preco min (R$)</label>
              <input
                type="number"
                name="precoMin"
                value={filters.precoMin}
                onChange={handleFilterChange}
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                placeholder="0"
                min="0"
              />
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Preco max (R$)</label>
              <input
                type="number"
                name="precoMax"
                value={filters.precoMax}
                onChange={handleFilterChange}
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                placeholder="Ilimitado"
                min="0"
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-8 sm:px-8">
          {loading && (
            <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6 text-zinc-700">
              Carregando oficinas publicas...
            </div>
          )}

          {!loading && error && (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-900">{error}</div>
          )}

          {!loading && !error && visibleWorkshops.length === 0 && (
            <div className="rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center">
              <h2 className="text-2xl font-black text-zinc-950">Nenhuma oficina encontrada</h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600">Ajuste os filtros ou amplie o raio para consultar mais oficinas cadastradas.</p>
            </div>
          )}

          {!loading && !error && visibleWorkshops.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {visibleWorkshops.map((workshop, index) => (
                <WorkshopCard key={workshop.id || `${workshop.nome}-${index}`} workshop={workshop} index={index} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default WorkshopsCatalogSection
