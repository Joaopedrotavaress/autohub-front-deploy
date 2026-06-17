import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getServiceTrackingDriverView } from '../../services/serviceTrackingService'
import { formatCurrency } from '../../utils/helpers'
import { Card, EmptyState, Notice, PageStack, SectionHeader, StatusBadge, TIMELINE_MARKER_TONES, TIMELINE_STATE_TONES, cn, getButtonClasses } from '../ui'
import { formatDateTime, getHistoryReferenceTime, getStatusMeta, getTimelineEventMeta } from './serviceTrackingShared'

export function ServiceTrackingDriverSection({ ordemId = '' }) {
  const [driverTracking, setDriverTracking] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const requestRef = useRef(0)

  const loadTracking = async ({ silent = false } = {}) => {
    if (!ordemId) {
      setDriverTracking(null)
      setError('')
      return
    }

    const requestId = requestRef.current + 1
    requestRef.current = requestId

    if (!silent) {
      setLoading(true)
    }
    setError('')

    try {
      const response = await getServiceTrackingDriverView(ordemId)
      if (requestRef.current !== requestId) return

      const timeline = Array.isArray(response?.timeline)
        ? [...response.timeline].sort((left, right) => getHistoryReferenceTime(left) - getHistoryReferenceTime(right))
        : []

      setDriverTracking({ ...response, timeline })
    } catch (requestError) {
      if (requestRef.current !== requestId) return
      setDriverTracking(null)
      setError(requestError.message || 'Não foi possível carregar o acompanhamento desta ordem.')
    } finally {
      if (requestRef.current === requestId && !silent) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    loadTracking()
  }, [ordemId])

  useEffect(() => {
    if (!ordemId) {
      return undefined
    }

    const intervalId = window.setInterval(() => {
      loadTracking({ silent: true })
    }, 25000)

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadTracking({ silent: true })
      }
    }

    const handleFocus = () => {
      loadTracking({ silent: true })
    }

    const handlePageShow = () => {
      loadTracking({ silent: true })
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('pageshow', handlePageShow)

    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('pageshow', handlePageShow)
    }
  }, [ordemId])

  const ordem = driverTracking?.ordem || null
  const timeline = driverTracking?.timeline || []
  const statusMeta = getStatusMeta(ordem?.status || 'PENDENTE')
  const progressPercent = Math.max(0, Math.min(100, Number(driverTracking?.progressoPercentual || 0)))

  if (!ordemId) {
    return (
      <PageStack>
        <EmptyState title="Nenhuma ordem informada" description="Informe uma ordem válida para acompanhar o progresso do serviço." />
      </PageStack>
    )
  }

  return (
    <PageStack>
      <SectionHeader
        eyebrow="Acompanhamento do motorista"
        title="Sua ordem em tempo real"
        description="Visualize o progresso da ordem, serviços vinculados e últimas atualizações da oficina em uma visão simples e otimizada para mobile."
      />

      <div className="flex flex-wrap items-center gap-3">
        <Link className={getButtonClasses({ variant: 'secondary', size: 'sm' })} to="/ordem">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Voltar para ordens
        </Link>
      </div>

      {loading ? <Notice title="Sincronizando ordem" description="Atualizando informações do seu acompanhamento." /> : null}
      {error ? <Notice title="Não foi possível carregar" description={error} variant="error" /> : null}

      {!loading && !error && !ordem ? (
        <EmptyState title="Ordem indisponível" description="A ordem solicitada não foi encontrada ou não está disponível para consulta." />
      ) : null}

      {ordem ? (
        <>
          <Card className="p-5 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <StatusBadge icon={statusMeta.icon} tone={statusMeta.tone}>{statusMeta.label}</StatusBadge>
                <h2 className="mt-3 text-2xl font-black tracking-tight text-zinc-950">{driverTracking?.progressoLabel || 'Acompanhamento da ordem'}</h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">{statusMeta.description}</p>
              </div>
              <span className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-700">
                {progressPercent}% concluído
              </span>
            </div>

            <div className="mt-5 h-3 w-full overflow-hidden rounded-full bg-zinc-200">
              <div className="h-full rounded-full bg-gradient-to-r from-red-500 via-orange-500 to-amber-400 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="rounded-[1.5rem] bg-zinc-50 p-4 shadow-none">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">Veículo</span>
                <strong className="mt-2 block text-base font-black text-zinc-950">{ordem.veiculo?.nome || 'Veículo'}</strong>
                <p className="mt-1 text-sm text-zinc-600">{ordem.veiculo?.placa || '-'}</p>
              </Card>
              <Card className="rounded-[1.5rem] bg-zinc-50 p-4 shadow-none">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">Oficina</span>
                <strong className="mt-2 block text-base font-black text-zinc-950">{ordem.oficina?.nome || 'Oficina'}</strong>
              </Card>
              <Card className="rounded-[1.5rem] bg-zinc-50 p-4 shadow-none">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">Valor total</span>
                <strong className="mt-2 block text-base font-black text-zinc-950">{formatCurrency(ordem.valorTotal || 0)}</strong>
              </Card>
              <Card className="rounded-[1.5rem] bg-zinc-50 p-4 shadow-none">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">Última atualização</span>
                <strong className="mt-2 block text-base font-black text-zinc-950">{formatDateTime(timeline[timeline.length - 1]?.alteradoEm || ordem.atualizadoEm || ordem.criadoEm)}</strong>
              </Card>
            </div>
          </Card>

          <Card className="p-5 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center text-[11px] font-black uppercase tracking-[0.2em] text-red-700">Atualizações</span>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-950">Timeline da ordem</h2>
              </div>
              <StatusBadge tone={statusMeta.tone}>{statusMeta.label}</StatusBadge>
            </div>

            {timeline.length > 0 ? (
              <div className="mt-5 grid gap-3">
                {timeline.map((eventItem, index) => {
                  const eventMeta = getTimelineEventMeta(eventItem.tipoEvento)
                  const eventStatusMeta = getStatusMeta(eventItem.statusAtual || ordem.status)
                  const stepState = eventItem.statusAtual === 'CANCELADO'
                    ? 'cancelled'
                    : index === timeline.length - 1
                      ? 'active'
                      : 'completed'

                  return (
                    <div className={cn('grid gap-4 rounded-[1.5rem] border p-4 md:grid-cols-[auto_1fr]', TIMELINE_STATE_TONES[stepState] || TIMELINE_STATE_TONES.neutral)} key={`${eventItem.id || eventItem.alteradoEm}-${index}`}>
                      <div className={cn('flex h-10 w-10 items-center justify-center rounded-full border', TIMELINE_MARKER_TONES[stepState] || TIMELINE_MARKER_TONES.neutral)}>
                        <span className="material-symbols-outlined">{eventMeta.icon}</span>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <strong className="text-base font-black text-zinc-950">{eventMeta.label}</strong>
                          <span className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">{formatDateTime(eventItem.alteradoEm)}</span>
                        </div>
                        <div className="mt-2">
                          <StatusBadge icon={eventStatusMeta.icon} tone={eventStatusMeta.tone}>{eventStatusMeta.label}</StatusBadge>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-zinc-600">{eventItem.descricao || 'Atualização registrada na ordem.'}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <Notice className="mt-5" title="Sem atualizações" description="Ainda não há atualizações registradas para esta ordem." />
            )}
          </Card>

          <Card className="p-5 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center text-[11px] font-black uppercase tracking-[0.2em] text-red-700">Serviços executados</span>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-950">Itens da ordem</h2>
              </div>
              <span className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-700">{ordem.itens?.length || 0} item(ns)</span>
            </div>

            {ordem.itens?.length ? (
              <div className="mt-5 grid gap-3">
                {ordem.itens.map((item) => (
                  <Card className="rounded-[1.5rem] bg-zinc-50 p-4 shadow-none" key={item.id || `${item.nome}-${item.quantidade}`}>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <strong className="block text-base font-black text-zinc-950">{item.nome}</strong>
                        <p className="mt-2 text-sm leading-relaxed text-zinc-600">{item.descricao || 'Descrição não informada.'}</p>
                      </div>
                      <div className="grid gap-2 text-right">
                        <span className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">Qtd {item.quantidade}</span>
                        <strong className="text-base font-black text-zinc-950">{formatCurrency(item.subtotal || item.precoUnitario || 0)}</strong>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Notice className="mt-5" title="Sem serviços" description="Nenhum serviço foi vinculado a esta ordem até o momento." />
            )}
          </Card>
        </>
      ) : null}
    </PageStack>
  )
}

export default ServiceTrackingDriverSection
