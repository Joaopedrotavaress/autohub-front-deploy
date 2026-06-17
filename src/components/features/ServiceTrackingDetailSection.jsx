import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  addServiceTrackingItem,
  getServiceTrackingAvailableServices,
  getServiceTrackingOrderDetail,
  getServiceTrackingStatusHistory,
  updateServiceTrackingStatus,
} from '../../services/serviceTrackingService'
import { useAppContext } from '../../context/AppContext'
import { formatCurrency } from '../../utils/helpers'
import { Card, Dialog, EmptyState, Field, Input, Notice, PageStack, SectionHeader, Select, StatusBadge, TIMELINE_MARKER_TONES, TIMELINE_STATE_TONES, cn, getButtonClasses } from '../ui'
import { getUserRole, ROLES } from '../../utils/accessControl'
import { buildStepState, formatDateTime, getHistoryReferenceTime, getStatusMeta, getTimelineEventMeta } from './serviceTrackingShared'

const STATUS_TIMELINE_STYLES = {
  pending: {
    container: 'border-zinc-200 bg-white',
    marker: 'border-zinc-300 bg-zinc-50 text-zinc-600',
  },
  active: {
    container: 'border-amber-200 bg-amber-50/60',
    marker: 'border-amber-300 bg-amber-50 text-amber-700',
  },
  done: {
    container: 'border-emerald-200 bg-emerald-50/60',
    marker: 'border-emerald-300 bg-emerald-50 text-emerald-700',
  },
  cancelled: {
    container: 'border-red-200 bg-red-50/60',
    marker: 'border-red-300 bg-red-50 text-red-700',
  },
}

function getTimelineStyles(statusTone) {
  return STATUS_TIMELINE_STYLES[statusTone] || STATUS_TIMELINE_STYLES.pending
}

function buildBackLink(initialOficinaId, initialVeiculoId) {
  const searchParams = new URLSearchParams()

  if (initialOficinaId) {
    searchParams.set('oficinaId', initialOficinaId)
  }

  if (initialVeiculoId) {
    searchParams.set('veiculoId', initialVeiculoId)
  }

  const query = searchParams.toString()
  return query ? `/ordem?${query}` : '/ordem'
}

export function ServiceTrackingDetailSection({ ordemId = '', initialOficinaId = '', initialVeiculoId = '' }) {
  const { user } = useAppContext()
  const userRole = getUserRole(user)
  const canManageOrder = userRole === ROLES.ADMIN || userRole === ROLES.DONO_OFICINA || userRole === ROLES.MECANICO

  const [ordem, setOrdem] = useState(null)
  const [timelineEvents, setTimelineEvents] = useState([])
  const [pendingStatus, setPendingStatus] = useState('')
  const [loadingOrder, setLoadingOrder] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [addingService, setAddingService] = useState(false)
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false)
  const [availableServices, setAvailableServices] = useState([])
  const [loadingServices, setLoadingServices] = useState(false)
  const [serviceError, setServiceError] = useState('')
  const [serviceForm, setServiceForm] = useState({ servicoId: '', quantidade: 1, precoUnitario: '' })
  const [error, setError] = useState('')
  const [historyError, setHistoryError] = useState('')
  const orderRequestRef = useRef(0)
  const historyRequestRef = useRef(0)

  const currentStatus = ordem?.status || 'PENDENTE'
  const statusMeta = getStatusMeta(currentStatus)
  const nextStatuses = ['PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO'].filter((status) => status !== currentStatus)
  const activeItems = ordem?.itens || []
  const statusTimelineEvents = useMemo(
    () => timelineEvents.filter((eventItem) => eventItem.tipoEvento !== 'SERVICO_ADICIONADO'),
    [timelineEvents]
  )
  const serviceTimelineEvents = useMemo(
    () => timelineEvents.filter((eventItem) => eventItem.tipoEvento === 'SERVICO_ADICIONADO'),
    [timelineEvents]
  )
  const backLink = useMemo(() => buildBackLink(initialOficinaId || ordem?.oficina?.id, initialVeiculoId || ordem?.veiculo?.id), [initialOficinaId, initialVeiculoId, ordem])
  const selectedService = useMemo(() => availableServices.find((service) => service.servicoId === serviceForm.servicoId) || null, [availableServices, serviceForm.servicoId])
  const parsedQuantity = Number(serviceForm.quantidade)
  const parsedUnitPrice = Number(serviceForm.precoUnitario)
  const serviceSubtotal = Number.isFinite(parsedQuantity) && Number.isFinite(parsedUnitPrice)
    ? Math.max(parsedQuantity, 0) * Math.max(parsedUnitPrice, 0)
    : 0

  const loadOrder = async ({ silent = false } = {}) => {
    if (!ordemId) {
      setOrdem(null)
      setError('')
      return
    }

    const requestId = orderRequestRef.current + 1
    orderRequestRef.current = requestId
    if (!silent) {
      setLoadingOrder(true)
    }
    setError('')

    try {
      const response = await getServiceTrackingOrderDetail(ordemId)
      if (orderRequestRef.current !== requestId) return
      setOrdem(response)
    } catch (requestError) {
      if (orderRequestRef.current !== requestId) return
      setOrdem(null)
      setError(requestError.message || 'Não foi possível carregar os detalhes da ordem.')
    } finally {
      if (orderRequestRef.current === requestId && !silent) {
        setLoadingOrder(false)
      }
    }
  }

  const loadTimeline = async ({ silent = false } = {}) => {
    if (!ordemId) {
      historyRequestRef.current += 1
      setTimelineEvents([])
      setHistoryError('')
      return
    }

    const requestId = historyRequestRef.current + 1
    historyRequestRef.current = requestId
    if (!silent) {
      setLoadingHistory(true)
    }
    setHistoryError('')

    try {
      const response = await getServiceTrackingStatusHistory(ordemId)
      if (historyRequestRef.current !== requestId) return
      const history = Array.isArray(response)
        ? [...response].sort((left, right) => getHistoryReferenceTime(left) - getHistoryReferenceTime(right))
        : []
      setTimelineEvents(history)
    } catch (requestError) {
      if (historyRequestRef.current !== requestId) return
      setTimelineEvents([])
      setHistoryError(requestError.message || 'Não foi possível carregar o histórico da ordem.')
    } finally {
      if (historyRequestRef.current === requestId && !silent) {
        setLoadingHistory(false)
      }
    }
  }

  useEffect(() => {
    loadOrder()
  }, [ordemId])

  useEffect(() => {
    loadTimeline()
  }, [ordemId])

  useEffect(() => {
    if (!ordemId) {
      return undefined
    }

    const intervalId = window.setInterval(() => {
      loadOrder({ silent: true })
      loadTimeline({ silent: true })
    }, 25000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [ordemId])

  useEffect(() => {
    if (!pendingStatus) {
      setPendingStatus(nextStatuses[0] || '')
    }
  }, [ordem?.id, nextStatuses, pendingStatus])

  useEffect(() => {
    if (!serviceDialogOpen || !ordem?.id || !canManageOrder) {
      return
    }

    setLoadingServices(true)
    setServiceError('')

    getServiceTrackingAvailableServices(ordem.id)
      .then((services) => {
        const normalizedServices = Array.isArray(services) ? services : []
        setAvailableServices(normalizedServices)
        setServiceForm((currentForm) => {
          const selectedId = normalizedServices.some((item) => item.servicoId === currentForm.servicoId)
            ? currentForm.servicoId
            : normalizedServices[0]?.servicoId || ''

          const selectedItem = normalizedServices.find((item) => item.servicoId === selectedId)

          return {
            servicoId: selectedId,
            quantidade: currentForm.quantidade || 1,
            precoUnitario: selectedItem ? String(selectedItem.precoBase ?? '') : '',
          }
        })
      })
      .catch((requestError) => {
        setAvailableServices([])
        setServiceError(requestError.message || 'Não foi possível carregar os serviços disponíveis para esta ordem.')
      })
      .finally(() => {
        setLoadingServices(false)
      })
  }, [serviceDialogOpen, ordem?.id, canManageOrder])

  useEffect(() => {
    if (!selectedService) {
      return
    }

    setServiceForm((currentForm) => ({
      ...currentForm,
      precoUnitario: currentForm.precoUnitario === '' ? String(selectedService.precoBase ?? '') : currentForm.precoUnitario,
    }))
  }, [selectedService])

  const handleStatusUpdate = async () => {
    if (!ordem?.id || !pendingStatus || !canManageOrder) {
      return
    }

    setUpdatingStatus(true)
    setError('')
    setHistoryError('')

    try {
      const updatedOrder = await updateServiceTrackingStatus(ordem.id, pendingStatus)
      setOrdem(updatedOrder)
      await loadOrder({ silent: true })
      await loadTimeline({ silent: true })
    } catch (requestError) {
      setError(requestError.message || 'Não foi possível atualizar o status da ordem.')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleServiceSelect = (nextServiceId) => {
    const service = availableServices.find((item) => item.servicoId === nextServiceId)

    setServiceForm((currentForm) => ({
      ...currentForm,
      servicoId: nextServiceId,
      precoUnitario: service ? String(service.precoBase ?? '') : currentForm.precoUnitario,
    }))
  }

  const handleAddService = async () => {
    if (!ordem?.id || !canManageOrder) {
      return
    }

    const quantidade = Number(serviceForm.quantidade)
    const precoUnitario = Number(serviceForm.precoUnitario)

    if (!serviceForm.servicoId) {
      setServiceError('Selecione um serviço para adicionar.')
      return
    }

    if (!Number.isFinite(quantidade) || quantidade <= 0) {
      setServiceError('Informe uma quantidade válida maior que zero.')
      return
    }

    if (!Number.isFinite(precoUnitario) || precoUnitario < 0) {
      setServiceError('Informe um valor unitário válido.')
      return
    }

    setAddingService(true)
    setServiceError('')
    setError('')

    try {
      const updatedOrder = await addServiceTrackingItem(ordem.id, {
        servicoId: serviceForm.servicoId,
        quantidade,
        precoUnitario,
      })

      setOrdem(updatedOrder)
      await loadTimeline({ silent: true })
      setServiceDialogOpen(false)
    } catch (requestError) {
      setServiceError(requestError.message || 'Não foi possível adicionar o serviço à ordem.')
    } finally {
      setAddingService(false)
    }
  }

  if (!ordemId) {
    return (
      <PageStack>
        <EmptyState description="Selecione uma ordem na listagem principal para acessar os detalhes." title="Nenhuma ordem selecionada" />
      </PageStack>
    )
  }

  return (
    <PageStack>
      <SectionHeader
        description="Acompanhe o histórico, os itens e o status atual da ordem selecionada em uma visão dedicada."
        eyebrow="Detalhes da ordem"
        title="Acompanhamento completo da ordem"
      />

      <div className="flex flex-wrap items-center gap-3">
        <Link className={getButtonClasses({ variant: 'secondary', size: 'sm' })} to={backLink}>
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Voltar para listagem
        </Link>
        <Link className={getButtonClasses({ variant: 'ghost', size: 'sm' })} to={`/ordem/acompanhar/${ordemId}`}>
          <span className="material-symbols-outlined text-[18px]">smartphone</span>
          Visão do motorista
        </Link>
        {ordem?.oficina?.id ? (
          <Link className={getButtonClasses({ variant: 'ghost', size: 'sm' })} to={`/workshop/${ordem.oficina.id}`}>
            <span className="material-symbols-outlined text-[18px]">storefront</span>
            Ver oficina
          </Link>
        ) : null}
      </div>

      {loadingOrder ? <Notice description="Carregando dados completos da ordem..." title="Sincronizando ordem" /> : null}
      {error ? <Notice description={error} title="Não foi possível carregar a ordem" variant="error" /> : null}

      {!loadingOrder && !error && !ordem ? (
        <EmptyState description="A ordem solicitada não foi encontrada ou não está mais disponível." title="Ordem indisponível" />
      ) : null}

      {ordem ? (
        <>
          <Card className="p-5 md:p-6">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.8fr)]">
              <div>
                <StatusBadge icon={statusMeta.icon} tone={statusMeta.tone}>{statusMeta.label}</StatusBadge>
                <h2 className="mt-4 text-2xl font-black tracking-tight text-zinc-950">Detalhes da ordem</h2>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-600">{statusMeta.description}</p>
              </div>

            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Card className="rounded-[1.5rem] bg-zinc-50 p-5 shadow-none">
                <span className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">Veículo</span>
                <strong className="mt-2 block text-base font-black text-zinc-950">{ordem.veiculo?.nome || 'Veículo vinculado'}</strong>
                <small className="mt-1 block text-sm text-zinc-600">{ordem.veiculo?.placa || ''}</small>
              </Card>
              <Card className="rounded-[1.5rem] bg-zinc-50 p-5 shadow-none">
                <span className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">Oficina vinculada</span>
                <strong className="mt-2 block text-base font-black text-zinc-950">{ordem.oficina?.nome || 'Oficina não informada'}</strong>
              </Card>
             
              <Card className="rounded-[1.5rem] bg-zinc-50 p-5 shadow-none">
                <span className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">Valor total</span>
                <strong className="mt-2 block text-base font-black text-zinc-950">{formatCurrency(ordem.valorTotal || 0)}</strong>
              </Card>
            </div>

            {canManageOrder ? (
              <div className="mt-5 grid gap-4 rounded-[1.75rem] border border-zinc-200 bg-white p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                <Field htmlFor="tracking-status-select" label="Atualizar status da ordem">
                  <Select
                    id="tracking-status-select"
                    value={pendingStatus}
                    onChange={(event) => setPendingStatus(event.target.value)}
                    disabled={updatingStatus || nextStatuses.length === 0}
                  >
                    {nextStatuses.length === 0 ? <option value="">Sem status disponíveis</option> : null}
                    {nextStatuses.map((status) => (
                      <option key={status} value={status}>
                        {getStatusMeta(status).label}
                      </option>
                    ))}
                  </Select>
                </Field>

                <button
                  type="button"
                  className={getButtonClasses({ variant: 'primary' })}
                  disabled={!pendingStatus || nextStatuses.length === 0 || updatingStatus}
                  onClick={handleStatusUpdate}
                >
                  {updatingStatus ? 'Atualizando...' : 'Atualizar status'}
                </button>
              </div>
            ) : (
              <Notice className="mt-5" description="Esta visão é somente leitura para seu perfil de acesso." title="Acompanhamento sem edição" />
            )}
          </Card>

          <Card className="p-5 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center text-[11px] font-black uppercase tracking-[0.22em] text-red-700">Histórico real</span>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-950">Timeline de status</h2>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-600">
                  As alterações de status aparecem nesta linha do tempo. Movimentações de serviço ficam logo abaixo, em um bloco separado.
                </p>
              </div>
              <StatusBadge tone={statusMeta.tone}>{statusMeta.label}</StatusBadge>
            </div>

            {loadingHistory ? <Notice className="mt-5" description="Carregando alterações registradas da ordem." title="Sincronizando timeline" /> : null}
            {historyError ? <Notice className="mt-5" description={historyError} title="Não foi possível carregar a timeline" variant="error" /> : null}

            {statusTimelineEvents.length > 0 ? (
              <div className="mt-5 grid gap-3">
                {statusTimelineEvents.map((historyItem, index) => {
                  const historyMeta = getStatusMeta(historyItem.statusAtual || currentStatus)
                  const eventMeta = getTimelineEventMeta(historyItem.tipoEvento)
                  const timelineStyles = getTimelineStyles(historyMeta.tone)

                  return (
                    <div className={cn('relative grid gap-4 rounded-[1.5rem] border p-4 md:grid-cols-[auto_1fr]', timelineStyles.container)} key={`${historyItem.id || historyItem.alteradoEm}-${historyItem.statusAtual || historyItem.tipoEvento}-${index}`}>
                      <div className={cn('flex h-10 w-10 items-center justify-center rounded-full border', timelineStyles.marker)}>
                        <span className="material-symbols-outlined">{historyMeta.icon}</span>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <strong className="text-base font-black text-zinc-950">{eventMeta.label}</strong>
                          <span className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">{formatDateTime(historyItem.alteradoEm)}</span>
                        </div>
                        {historyItem.statusAtual ? (
                          <div className="mt-2">
                            <StatusBadge icon={historyMeta.icon} tone={historyMeta.tone}>{historyMeta.label}</StatusBadge>
                          </div>
                        ) : null}
                        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                          {historyItem.descricao
                            || (historyItem.statusAnterior
                              ? `Status alterado de ${getStatusMeta(historyItem.statusAnterior).label} para ${historyMeta.label}.`
                              : `Registro inicial da ordem em ${historyMeta.label}.`)}
                        </p>
                        {historyItem.tipoEvento === 'SERVICO_ADICIONADO' ? (
                          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                            {historyItem.servicoNome || 'Serviço'}
                            {historyItem.quantidade ? ` • Quantidade ${historyItem.quantidade}` : ''}
                            {historyItem.subtotal ? ` • Subtotal ${formatCurrency(historyItem.subtotal)}` : ''}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : !loadingHistory && !historyError ? (
              <Notice className="mt-5" description="Ainda não há alterações de status registradas para esta ordem." title="Sem histórico de status" />
            ) : null}

            <div className="mt-6 border-t border-zinc-200 pt-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <span className="inline-flex items-center text-[11px] font-black uppercase tracking-[0.22em] text-red-700">Histórico de serviços</span>
                  <h3 className="mt-2 text-xl font-black tracking-tight text-zinc-950">Serviços adicionados na ordem</h3>
                  <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-600">
                    Esse bloco registra apenas inclusão de serviços e seus valores, sem misturar com o fluxo de status.
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-700">
                  {serviceTimelineEvents.length} evento(s)
                </span>
              </div>

              {serviceTimelineEvents.length > 0 ? (
                <div className="mt-5 grid gap-3">
                  {serviceTimelineEvents.map((historyItem, index) => {
                    const eventMeta = getTimelineEventMeta(historyItem.tipoEvento)

                    return (
                      <div className="grid gap-4 rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-4 md:grid-cols-[auto_1fr]" key={`${historyItem.id || historyItem.alteradoEm}-service-${index}`}>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-700">
                          <span className="material-symbols-outlined">{eventMeta.icon}</span>
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <strong className="text-base font-black text-zinc-950">{historyItem.servicoNome || eventMeta.label}</strong>
                            <span className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">{formatDateTime(historyItem.alteradoEm)}</span>
                          </div>
                          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                            {historyItem.descricao || 'Serviço adicionado à ordem.'}
                          </p>
                          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                            {historyItem.quantidade ? <span className="rounded-full bg-white px-3 py-1">Qtd {historyItem.quantidade}</span> : null}
                            {historyItem.precoUnitario ? <span className="rounded-full bg-white px-3 py-1">Unit. {formatCurrency(historyItem.precoUnitario)}</span> : null}
                            {historyItem.subtotal ? <span className="rounded-full bg-white px-3 py-1">Subtotal {formatCurrency(historyItem.subtotal)}</span> : null}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : !loadingHistory && !historyError ? (
                <Notice className="mt-5" description="Ainda não há serviços adicionados por evento nesta ordem." title="Sem histórico de serviços" />
              ) : null}
            </div>
          </Card>

          <Card className="p-5 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center text-[11px] font-black uppercase tracking-[0.22em] text-red-700">Itens da ordem</span>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-950">Serviços vinculados</h2>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-600">
                  Aqui ficam os serviços já vinculados à ordem. Se precisar incluir outro item, use o botão ao lado.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-zinc-700">{activeItems.length} item(ns)</span>
                {canManageOrder ? (
                  <button
                    type="button"
                    className={getButtonClasses({ variant: 'secondary', size: 'sm' })}
                    disabled={loadingServices || addingService}
                    onClick={() => setServiceDialogOpen(true)}
                  >
                    <span className="material-symbols-outlined text-[18px]">playlist_add</span>
                    Adicionar serviço
                  </button>
                ) : null}
              </div>
            </div>

            {activeItems.length > 0 ? (
              <div className="mt-5 grid gap-3">
                {activeItems.map((item) => (
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
              <Notice className="mt-5" description="Esta ordem não possui itens detalhados retornados pela API." title="Sem itens detalhados" />
            )}
          </Card>
        </>
      ) : null}

      <Dialog
        isOpen={serviceDialogOpen && canManageOrder}
        onClose={() => {
          if (!addingService) {
            setServiceDialogOpen(false)
            setServiceError('')
          }
        }}
        eyebrow="Adicionar serviço"
        title="Incluir novo serviço na ordem"
        description="Selecione um serviço da oficina, defina quantidade e ajuste o valor unitário quando necessário."
        maxWidth="max-w-2xl"
        footer={(
          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              className={getButtonClasses({ variant: 'secondary' })}
              disabled={addingService}
              onClick={() => setServiceDialogOpen(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className={getButtonClasses({ variant: 'primary' })}
              disabled={addingService || loadingServices || !availableServices.length}
              onClick={handleAddService}
            >
              {addingService ? 'Adicionando...' : 'Adicionar serviço'}
            </button>
          </div>
        )}
      >
        {loadingServices ? <Notice title="Carregando serviços" description="Buscando catálogo da oficina para esta ordem." /> : null}
        {serviceError ? <Notice title="Não foi possível adicionar o serviço" description={serviceError} variant="error" /> : null}

        {!loadingServices && !availableServices.length ? (
          <EmptyState title="Nenhum serviço disponível" description="Cadastre serviços para esta oficina antes de vinculá-los à ordem." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <Field htmlFor="tracking-add-service" label="Serviço">
              <Select
                id="tracking-add-service"
                value={serviceForm.servicoId}
                onChange={(event) => handleServiceSelect(event.target.value)}
                disabled={addingService || loadingServices}
              >
                {!serviceForm.servicoId ? <option value="">Selecione um serviço</option> : null}
                {availableServices.map((service) => (
                  <option key={service.servicoId} value={service.servicoId}>
                    {service.nome}
                  </option>
                ))}
              </Select>
            </Field>

            <Field htmlFor="tracking-add-quantity" label="Quantidade">
              <Input
                id="tracking-add-quantity"
                type="number"
                min="1"
                value={serviceForm.quantidade}
                onChange={(event) => setServiceForm((currentForm) => ({ ...currentForm, quantidade: event.target.value }))}
                disabled={addingService || loadingServices}
              />
            </Field>

            <Field htmlFor="tracking-add-price" label="Preço unitário (R$)">
              <Input
                id="tracking-add-price"
                type="number"
                min="0"
                step="0.01"
                value={serviceForm.precoUnitario}
                onChange={(event) => setServiceForm((currentForm) => ({ ...currentForm, precoUnitario: event.target.value }))}
                disabled={addingService || loadingServices}
              />
            </Field>

            <Card className="rounded-[1.5rem] bg-zinc-50 p-4 shadow-none">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">Subtotal estimado</span>
              <strong className="mt-2 block text-xl font-black tracking-tight text-zinc-950">{formatCurrency(serviceSubtotal)}</strong>
              <p className="mt-2 text-sm text-zinc-600">A ordem será atualizada automaticamente após a inclusão.</p>
            </Card>

            {selectedService?.descricao ? (
              <Card className="md:col-span-2 rounded-[1.5rem] bg-zinc-50 p-4 shadow-none">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">Descrição do serviço</span>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">{selectedService.descricao}</p>
              </Card>
            ) : null}
          </div>
        )}
      </Dialog>
    </PageStack>
  )
}

export default ServiceTrackingDetailSection