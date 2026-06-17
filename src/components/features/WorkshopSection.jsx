import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useUserLocation } from '../../hooks/useUserLocation'
import { getOficinaDetalhe } from '../../services/oficinaViewService'
import { getUsuario } from '../../services/authService'
import { buildWhatsAppLink, formatDistance, getPriceRangeLabel, normalizeOficina } from '../../utils/oficina'

const PLACEHOLDER_WORKSHOP_IMAGE = '/images/hero-workshop.jpg'

export function WorkshopSection({ initialWorkshopId = '' }) {
  const [workshop, setWorkshop] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const userLocation = useUserLocation({ enabled: Boolean(initialWorkshopId.trim()) })

  const hasRequestedId = useMemo(() => initialWorkshopId.trim().length > 0, [initialWorkshopId])
  const services = useMemo(
    () => (Array.isArray(workshop?.servicosOferecidos) ? workshop.servicosOferecidos : []).filter(Boolean),
    [workshop],
  )
  const specialities = useMemo(
    () => (Array.isArray(workshop?.especialidades) ? workshop.especialidades : []).filter(Boolean),
    [workshop],
  )

  const priceRangeLabel = useMemo(() => getPriceRangeLabel(workshop), [workshop])
  const imageUrls = useMemo(
    () => (Array.isArray(workshop?.imagensUrls) ? workshop.imagensUrls : []).filter(Boolean),
    [workshop],
  )
  const whatsappLink = useMemo(() => buildWhatsAppLink(workshop), [workshop])
  const mainImageUrl = workshop?.imagemUrl || imageUrls[0] || PLACEHOLDER_WORKSHOP_IMAGE

  useEffect(() => {
    let cancelled = false

    const fetchWorkshop = async () => {
      setLoading(true)
      setError('')

      try {
        const data = await getOficinaDetalhe(initialWorkshopId.trim(), {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          cepOrigem: userLocation.cep,
        })

        if (!cancelled) {
          setWorkshop(normalizeOficina(data))
        }
      } catch (requestError) {
        if (!cancelled) {
          setWorkshop(null)
          setError(requestError.message || 'Não foi possível carregar os dados completos da oficina.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    if (!hasRequestedId) {
      setWorkshop(null)
      setError('')
      setLoading(false)
      return () => {
        cancelled = true
      }
    }

    fetchWorkshop()

    return () => {
      cancelled = true
    }
  }, [hasRequestedId, initialWorkshopId, userLocation.latitude, userLocation.longitude])

  if (!hasRequestedId) {
    return (
      <section className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-dashed border-zinc-300 bg-white p-10 text-center shadow-[0_12px_40px_rgba(25,28,29,0.04)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <span className="material-symbols-outlined text-3xl">storefront</span>
          </div>
          <h2 className="mt-5 text-2xl font-black tracking-tight text-zinc-950">Nenhuma oficina foi selecionada</h2>
          <p className="mt-3 text-base text-zinc-600">
            Abra uma oficina pela listagem autenticada para consultar endereço, serviços e reputação em tempo real.
          </p>
          <Link
            to="/workshops"
            className="mt-6 inline-flex items-center justify-center rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-red-700"
          >
            Ver oficinas disponíveis
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.8fr)_minmax(320px,0.9fr)]">
        <article className="overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-[0_12px_40px_rgba(25,28,29,0.06)]">
          <div className="relative h-64 overflow-hidden sm:h-80">
            <img
              src={mainImageUrl}
              alt="Ambiente da oficina"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 via-zinc-950/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-3 text-white">
                <span className="rounded-full bg-white/16 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] backdrop-blur">
                  Oficina verificada
                </span>
                <span className="rounded-full bg-white/16 px-3 py-1 text-sm font-bold backdrop-blur">
                  {workshop?.quantidadeAvaliacoes > 0
                    ? `${workshop.mediaAvaliacoes.toFixed(1).replace('.', ',')} • ${workshop.quantidadeAvaliacoes} avaliação(ões)`
                    : 'Sem avaliações ainda'}
                </span>
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
                {workshop?.nome || 'Carregando oficina'}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/85 sm:text-base">
                {workshop?.endereco || 'Endereço em processamento'}
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {loading ? (
              <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6 text-zinc-700">
                Carregando dados completos da oficina...
              </div>
            ) : null}

            {!loading && error ? (
              <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-900">
                <strong className="block text-lg font-black">Não foi possível carregar a oficina</strong>
                <p className="mt-2 text-sm leading-relaxed">{error}</p>
              </div>
            ) : null}

            {!loading && !error && workshop ? (
              <div className="space-y-8">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-3xl bg-zinc-50 p-5">
                    <span className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">Distância</span>
                    <strong className="mt-3 block text-lg font-black text-zinc-950">
                      {workshop.distanciaKm != null ? `${formatDistance(workshop.distanciaKm)} de voce` : 'Localizacao nao informada'}
                    </strong>
                  </div>
                  <div className="rounded-3xl bg-zinc-50 p-5">
                    <span className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">Faixa de preço</span>
                    <strong className="mt-3 block text-lg font-black text-zinc-950">{priceRangeLabel}</strong>
                  </div>
                  <div className="rounded-3xl bg-zinc-50 p-5">
                    <span className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">Serviços</span>
                    <strong className="mt-3 block text-lg font-black text-zinc-950">{services.length} cadastrados</strong>
                  </div>
                 
                </div>

                <section>
                  <h2 className="text-2xl font-black tracking-tight text-zinc-950">Sobre a oficina</h2>
                  <p className="mt-3 text-base leading-relaxed text-zinc-600">{workshop.descricao}</p>
                </section>

                <section>
                  <h2 className="text-2xl font-black tracking-tight text-zinc-950">Imagens da oficina</h2>
                  {imageUrls.length > 0 ? (
                    <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
                      {imageUrls.map((url) => (
                        <img
                          key={url}
                          src={url}
                          alt="Imagem cadastrada da oficina"
                          className="aspect-[4/3] w-full rounded-2xl object-cover"
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 overflow-hidden rounded-2xl border border-dashed border-zinc-300 bg-zinc-50">
                      <img src={PLACEHOLDER_WORKSHOP_IMAGE} alt="Imagem padrão da oficina" className="h-48 w-full object-cover" />
                    </div>
                  )}
                </section>

                <section>
                  <h2 className="text-2xl font-black tracking-tight text-zinc-950">Serviços oferecidos</h2>
                  {services.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-3">
                      {services.map((service) => (
                        <span key={service} className="rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-bold text-zinc-700">
                          {service}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 p-5 text-sm text-zinc-600">
                      Nenhum serviço detalhado foi retornado pela API para esta oficina.
                    </div>
                  )}
                </section>

                <section>
                  <h2 className="text-2xl font-black tracking-tight text-zinc-950">Especialidades e avaliações</h2>
                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-[1.75rem] border border-zinc-200 bg-zinc-50 p-5">
                      <span className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">Especialidades</span>
                      {specialities.length > 0 ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {specialities.map((speciality) => (
                            <span key={speciality} className="rounded-full bg-white px-3 py-1.5 text-sm font-bold text-zinc-700 shadow-sm">
                              {speciality}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-4 text-sm text-zinc-600">Nenhuma especialidade foi informada pela API.</p>
                      )}
                    </div>

                    <div className="rounded-[1.75rem] border border-zinc-200 bg-zinc-50 p-5">
                      <span className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">Avaliações</span>
                      <div className="mt-4 flex items-end gap-3">
                        <strong className="text-4xl font-black tracking-tight text-zinc-950">
                          {workshop.mediaAvaliacoes.toFixed(1).replace('.', ',')}
                        </strong>
                        <p className="pb-1 text-sm text-zinc-600">
                          {workshop.quantidadeAvaliacoes > 0
                            ? `${workshop.quantidadeAvaliacoes} avaliação(ões) registradas`
                            : 'Ainda não há avaliações registradas'}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            ) : null}
          </div>
        </article>

        <aside className="space-y-6">
          <div className="overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-[0_12px_40px_rgba(25,28,29,0.06)]">
          
            <div className="p-6">
              <span className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">Localização</span>
              <h3 className="mt-3 text-2xl font-black tracking-tight text-zinc-950">Endereço e alcance</h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                {workshop?.endereco || 'Endereço indisponível no momento.'}
              </p>
              
            </div>
          </div>

          <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-[0_12px_40px_rgba(25,28,29,0.06)]">
            <span className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">Contato e próximo passo</span>
            <h3 className="mt-3 text-2xl font-black tracking-tight text-zinc-950">Planeje seu atendimento</h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">
              Use esta página para confirmar os dados públicos da oficina e avaliar se ela atende o serviço desejado.
            </p>
            <div className="mt-4 rounded-3xl bg-zinc-50 p-4 text-sm text-zinc-700">
              <span className="block text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">Celular da oficina</span>
              <strong className="mt-2 block text-base text-zinc-950">{workshop?.telefone || 'Não informado'}</strong>
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <Link
                to="/workshops"
                className="inline-flex items-center justify-center rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-zinc-800"
              >
                Voltar para oficinas
              </Link>
              <Link
                to="/ordem"
                className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 px-5 py-3 text-sm font-bold text-zinc-700 transition-colors hover:border-red-200 hover:text-red-600"
              >
                Acompanhar ordens
              </Link>
              {(() => {
                try {
                  const usuario = getUsuario()
                  if (usuario && String(usuario.tipo || '').toUpperCase() !== 'VISITANTE') {
                    return (
                      <Link
                        to={`/workshop/${workshop?.id}/avaliar`}
                        className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-red-700"
                      >
                        Avaliar oficina
                      </Link>
                    )
                  }
                } catch (e) {
                  // ignore
                }
                return null
              })()}
            </div>
          </div>
        </aside>
      </div>

      {whatsappLink ? (
        <a
  href={whatsappLink}
  target="_blank"
  rel="noreferrer"
  aria-label={`Falar com ${workshop?.nome || 'a oficina'} no WhatsApp`}
  title="Abrir WhatsApp"
  className="fixed bottom-24 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_16px_40px_rgba(0,0,0,0.25)] transition-transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-emerald-200 sm:bottom-6 sm:right-6"
>
  {/* Ícone SVG do WhatsApp */}
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className="h-7 w-7" // Define um tamanho proporcional para o botão de 14x14
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
</a>
      ) : null}
    </section>
  )
}

export default WorkshopSection
