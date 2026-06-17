import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../../context/AppContext'
import { getMinhasOficinas } from '../../services/oficinaService'
import { getServiceTrackingByOficinaId } from '../../services/serviceTrackingService'
import { Card, EmptyState, Field, Input, Notice, PageStack, SectionHeader, Select, StatusBadge, cn, getButtonClasses } from '../ui'
import { formatDateTime, getOrderReferenceTime, getOrderShortCode, getStatusMeta, normalizeSearchTerm } from './serviceTrackingShared'
import { getUserRole, ROLES } from '../../utils/accessControl'

export function ServiceTrackingSection({ initialVeiculoId = '', initialOficinaId = '' }) {
  const navigate = useNavigate()
  const { user } = useAppContext()
  const userRole = getUserRole(user)
  const [oficinas, setOficinas] = useState([])
  const [selectedOficinaId, setSelectedOficinaId] = useState(initialOficinaId)
  const [searchPlaca, setSearchPlaca] = useState('')
  const [trackingPanel, setTrackingPanel] = useState(null)
  const [expandedVehicleIds, setExpandedVehicleIds] = useState([])
  const [loadingPanel, setLoadingPanel] = useState(false)
  const [loadingOficinas, setLoadingOficinas] = useState(false)
  const [panelError, setPanelError] = useState('')
  const initialSelectionAppliedRef = useRef(false)
  const panelRequestRef = useRef(0)

  const vehicleGroups = useMemo(() => {
    const normalizedTerm = normalizeSearchTerm(searchPlaca)
    const groups = Array.isArray(trackingPanel?.veiculos) ? trackingPanel.veiculos : []

    return groups.filter((group) => {
      if (!normalizedTerm) return true
      return normalizeSearchTerm(group.placa).includes(normalizedTerm)
    })
  }, [searchPlaca, trackingPanel])

  const loadTrackingPanel = async (oficinaId) => {
    const requestId = panelRequestRef.current + 1
    panelRequestRef.current = requestId

    setLoadingPanel(true)
    setPanelError('')

    try {
      const response = await getServiceTrackingByOficinaId(oficinaId)
      if (panelRequestRef.current !== requestId) return null

      const veiculos = Array.isArray(response?.veiculos) ? response.veiculos : []
      const normalizedPanel = {
        ...response,
        veiculos: veiculos
          .map((vehicleGroup) => ({
            ...vehicleGroup,
            ordens: Array.isArray(vehicleGroup.ordens)
              ? [...vehicleGroup.ordens].sort((left, right) => getOrderReferenceTime(right) - getOrderReferenceTime(left))
              : [],
          }))
          .sort((left, right) => (getOrderReferenceTime(right.ordens?.[0]) - getOrderReferenceTime(left.ordens?.[0]))),
      }

      setTrackingPanel(normalizedPanel)

      setExpandedVehicleIds((currentIds) => {
        const availableIds = new Set(
          normalizedPanel.veiculos.map(
            (vehicleGroup) => vehicleGroup.veiculoId
          )
        )

        return currentIds.filter((vehicleId) =>
          availableIds.has(vehicleId)
        )
      })

      if (!initialSelectionAppliedRef.current && initialVeiculoId) {
        const hasVehicle = normalizedPanel.veiculos.some((vehicleGroup) => vehicleGroup.veiculoId === initialVeiculoId)
        if (hasVehicle) {
          setExpandedVehicleIds([initialVeiculoId])
          initialSelectionAppliedRef.current = true
        }
      }

      return normalizedPanel
    } catch (requestError) {
      if (panelRequestRef.current !== requestId) return null

      setTrackingPanel({ oficinaId, oficinaNome: '', totalOrdens: 0, totalVeiculos: 0, veiculos: [] })
      setExpandedVehicleIds([])
      setPanelError(requestError.message || 'Não foi possível carregar o painel de acompanhamento.')
      return null
    } finally {
      if (panelRequestRef.current === requestId) {
        setLoadingPanel(false)
      }
    }
  }

  useEffect(() => {
    let cancelled = false

    const loadOficinas = async () => {
      setLoadingOficinas(true)

      try {
        const data = await getMinhasOficinas()
        if (cancelled) return

        setOficinas(Array.isArray(data) ? data : [])
      } catch (err) {
        if (!cancelled) {
          setOficinas([])
        }
      } finally {
        if (!cancelled) setLoadingOficinas(false)
      }
    }

    loadOficinas()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const syncPanel = async () => {
      if (!selectedOficinaId.trim()) {
        panelRequestRef.current += 1
        if (!cancelled) {
          setTrackingPanel(null)
          setExpandedVehicleIds([])
          setPanelError('')
        }
        return
      }

      await loadTrackingPanel(selectedOficinaId)
    }

    syncPanel()

    return () => {
      cancelled = true
    }
  }, [selectedOficinaId])

  useEffect(() => {
    if (!selectedOficinaId.trim()) {
      return undefined
    }

    const intervalId = window.setInterval(() => {
      loadTrackingPanel(selectedOficinaId)
    }, 30000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [selectedOficinaId])

  const handleOficinaChange = (event) => {
    panelRequestRef.current += 1
    setSelectedOficinaId(event.target.value)
    setSearchPlaca('')
    setTrackingPanel(null)
    setExpandedVehicleIds([])
    setPanelError('')
  }

  const toggleVehicleExpansion = (vehicleId) => {
    setExpandedVehicleIds((currentIds) => (
      currentIds.includes(vehicleId)
        ? currentIds.filter((currentId) => currentId !== vehicleId)
        : [...currentIds, vehicleId]
    ))
  }

  const navigateToOrderDetails = (ordemId, veiculoId) => {
    const searchParams = new URLSearchParams()

    if (selectedOficinaId) {
      searchParams.set('oficinaId', selectedOficinaId)
    }

    if (veiculoId) {
      searchParams.set('veiculoId', veiculoId)
    }

    const query = searchParams.toString()
    const detailBasePath = userRole === ROLES.MOTORISTA
      ? `/ordem/acompanhar/${ordemId}`
      : `/ordem/${ordemId}`

    navigate(query ? `${detailBasePath}?${query}` : detailBasePath)
  }

  const hasVehicleGroups = vehicleGroups.length > 0
  const isBusy = loadingPanel

  const emptyOfficeTitle = loadingOficinas
    ? 'Carregando oficinas...'
    : oficinas.length === 0
      ? 'Nenhuma oficina disponível'
      : 'Nenhuma oficina selecionada'

  const emptyOfficeDescription = loadingOficinas
    ? 'Aguarde enquanto carregamos suas oficinas.'
    : oficinas.length === 0
      ? 'Você não tem nenhuma oficina cadastrada. Crie uma para começar.'
      : 'Selecione uma oficina para visualizar suas ordens de serviço.'

  return (
    <PageStack>
      <SectionHeader
        description="Selecione uma oficina e filtre os veículos por placa para acompanhar todas as ordens de serviço agrupadas por veículo."
        eyebrow="Acompanhamento de ordens"
        title="Ordens de Serviço por Oficina"
      />

      <Card className="p-5 md:p-6">
        <div className="grid gap-2">
          <strong className="text-base font-black text-zinc-950">Filtros de busca</strong>
          <p className="text-sm leading-relaxed text-zinc-600">Selecione a oficina e, opcionalmente, busque por placa do veículo.</p>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field htmlFor="office-select" label="Oficina">
            <Select id="office-select" value={selectedOficinaId} onChange={handleOficinaChange} disabled={isBusy || loadingOficinas || oficinas.length === 0}>
              <option value="">Selecione uma oficina</option>
              {oficinas.map((ofc) => (
                <option key={ofc.id} value={ofc.id}>
                  {ofc.nome}
                </option>
              ))}
            </Select>
          </Field>

          {selectedOficinaId ? (
            <Field htmlFor="placa-search" label="Buscar por placa">
              <Input
                id="placa-search"
                type="text"
                placeholder="Ex: ABC-1234"
                value={searchPlaca}
                onChange={(event) => setSearchPlaca(event.target.value)}
                disabled={isBusy}
              />
            </Field>
          ) : null}
        </div>
      </Card>

      {loadingPanel ? <Notice description="Carregando painel de ordens e veículos..." title="Sincronizando acompanhamento da oficina" /> : null}

      {panelError ? <Notice description={panelError} title="Não foi possível carregar o acompanhamento" variant="error" /> : null}

      {!selectedOficinaId ? (
        <EmptyState description={emptyOfficeDescription} title={emptyOfficeTitle} />
      ) : null}

      {selectedOficinaId && !hasVehicleGroups && !loadingPanel && !panelError ? (
        <EmptyState
          description={searchPlaca ? 'Nenhum veículo com essa placa encontrado.' : 'A oficina selecionada ainda não possui ordens registradas.'}
          title="Nenhuma ordem encontrada"
        />
      ) : null}

      {trackingPanel && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-[1.5rem] bg-zinc-50 p-5 shadow-none">
            <span className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">Oficina ativa</span>
            <strong className="mt-2 block text-xl font-black text-zinc-950">{trackingPanel.oficinaNome || 'Oficina selecionada'}</strong>
          </Card>
          <Card className="rounded-[1.5rem] bg-zinc-50 p-5 shadow-none">
            <span className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">Veículos no painel</span>
            <strong className="mt-2 block text-xl font-black text-zinc-950">{trackingPanel.totalVeiculos || 0}</strong>
          </Card>
          <Card className="rounded-[1.5rem] bg-zinc-50 p-5 shadow-none">
            <span className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">Ordens carregadas</span>
            <strong className="mt-2 block text-xl font-black text-zinc-950">{trackingPanel.totalOrdens || 0}</strong>
          </Card>
        </div>
      )}

      {hasVehicleGroups && (
        <div className="grid gap-4 md:grid-cols-12">
          {vehicleGroups.map((vehicleGroup) => {
            const { ordens: vehicleOrdens } = vehicleGroup
            const latestOrder = vehicleOrdens[0] || null
            const latestStatusMeta = getStatusMeta(latestOrder?.status)
            const isExpanded = expandedVehicleIds.includes(vehicleGroup.veiculoId)

            return (
              <article
                key={vehicleGroup.veiculoId}
                onClick={() => toggleVehicleExpansion(vehicleGroup.veiculoId)}
                className={cn(
                  'overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-[0_12px_40px_rgba(25,28,29,0.06)] transition-all duration-300 cursor-pointer',
                  isExpanded ? 'md:col-span-12' : 'md:col-span-4',
                )}
              >
                <div className="h-2 bg-gradient-to-r from-red-500 via-orange-500 to-amber-400" />
                <div className="p-5 md:p-6">
                  <button
                    type="button"
                    className="flex w-full flex-wrap items-start justify-between gap-4 text-left"
                    onClick={(event) => {
                      event.stopPropagation()
                      toggleVehicleExpansion(vehicleGroup.veiculoId)
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <span className="inline-flex items-center text-[11px] font-black uppercase tracking-[0.22em] text-red-700">Veículo no acompanhamento</span>
                      <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-950">{vehicleGroup.nome}</h2>
                      <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                        {[vehicleGroup.marca, vehicleGroup.modelo].filter(Boolean).join(' • ') || 'Veículo sem modelo informado'}
                        {vehicleGroup.placa ? ` • Placa ${vehicleGroup.placa}` : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {latestOrder ? <StatusBadge icon={latestStatusMeta.icon} tone={latestStatusMeta.tone}>{latestStatusMeta.label}</StatusBadge> : null}
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-700 transition-transform duration-300">
                        <span className={cn('material-symbols-outlined transition-transform duration-300', isExpanded ? 'rotate-180' : '')}>expand_more</span>
                      </span>
                    </div>
                  </button>
                  <div className={cn('grid overflow-hidden transition-[grid-template-rows,opacity,margin] duration-300 ease-out', isExpanded ? 'mt-6 grid-rows-[1fr] opacity-100' : 'mt-0 grid-rows-[0fr] opacity-0')}>
                    <div className="overflow-hidden">
                      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
                        {vehicleOrdens.map((ordem) => {
                          const ordemMeta = getStatusMeta(ordem.status)

                          return (
                            <button
                              key={ordem.id}
                              type="button"
                              className="rounded-[1.5rem] border border-zinc-200 bg-white p-4 text-left transition-all duration-200 hover:border-red-200 hover:bg-red-50/30 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2"
                              onClick={(event) => {
                                event.stopPropagation()
                                navigateToOrderDetails(ordem.id, vehicleGroup.veiculoId)
                              }}
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <StatusBadge icon={ordemMeta.icon} tone={ordemMeta.tone}>{ordemMeta.label}</StatusBadge>
                                <span className="rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-zinc-700">
                                  OS {getOrderShortCode(ordem.id)}
                                </span>
                              </div>
                              <strong className="mt-3 block text-base font-black text-zinc-950">Abrir detalhes da ordem</strong>
                              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                                {ordem.itens.length ? `${ordem.itens.length} item(ns) vinculados` : 'Sem itens detalhados'}
                              </p>
                              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
                                <span>{formatDateTime(ordem.criadoEm || ordem.dataInicio)}</span>
                                <span className={getButtonClasses({ variant: 'ghost', size: 'sm' })}>Ver detalhes</span>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </PageStack>
  )
}

export default ServiceTrackingSection