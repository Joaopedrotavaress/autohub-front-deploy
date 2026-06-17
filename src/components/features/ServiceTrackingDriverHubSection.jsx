import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getMyVeiculos } from '../../services/veiculoService'
import { getOrdensByVeiculoId } from '../../services/ordemService'
import { Card, EmptyState, Notice, PageStack, SectionHeader, StatusBadge, getButtonClasses } from '../ui'
import { formatCurrency } from '../../utils/helpers'
import { formatDateTime, getOrderReferenceTime, getOrderShortCode, getStatusMeta } from './serviceTrackingShared'

function getValue(source, keys, fallback = '') {
  for (const key of keys) {
    if (source && source[key] !== undefined && source[key] !== null && source[key] !== '') {
      return source[key]
    }
  }

  return fallback
}

function normalizeVehicle(vehicle) {
  return {
    id: String(getValue(vehicle, ['id', 'Id'], '')).trim(),
    nome: getValue(vehicle, ['nome', 'Nome'], 'Veículo'),
    marca: getValue(vehicle, ['marca', 'Marca'], ''),
    modelo: getValue(vehicle, ['modelo', 'Modelo'], ''),
    placa: getValue(vehicle, ['placa', 'Placa'], ''),
  }
}

export function ServiceTrackingDriverHubSection() {
  const [searchParams] = useSearchParams()
  const selectedVeiculoId = searchParams.get('veiculoId') || ''

  const [vehicles, setVehicles] = useState([])
  const [ordersByVehicle, setOrdersByVehicle] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadData = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true)
    }
    setError('')

    try {
      const vehiclesData = await getMyVeiculos()

      const normalizedVehicles = (Array.isArray(vehiclesData) ? vehiclesData : [vehiclesData])
        .filter(Boolean)
        .map(normalizeVehicle)

      setVehicles(normalizedVehicles)

      const trackingEntries = await Promise.all(
        normalizedVehicles.map(async (vehicle) => {
          const orders = await getOrdensByVeiculoId(vehicle.id)
          return [vehicle.id, Array.isArray(orders) ? orders : []]
        })
      )

      const nextOrdersByVehicle = Object.fromEntries(trackingEntries)
      setOrdersByVehicle(nextOrdersByVehicle)
    } catch (requestError) {
      setVehicles([])
      setOrdersByVehicle({})
      setError(requestError.message || 'Não foi possível carregar o acompanhamento do motorista.')
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      loadData(true)
    }, 25000)

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadData(true)
      }
    }

    const handleFocus = () => {
      loadData(true)
    }

    const handlePageShow = () => {
      loadData(true)
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
  }, [loadData])

  const vehicleGroups = useMemo(() => {
    const baseVehicles = selectedVeiculoId
      ? vehicles.filter((vehicle) => vehicle.id === selectedVeiculoId)
      : vehicles

    return baseVehicles
      .map((vehicle) => {
        const orders = [...(ordersByVehicle[vehicle.id] || [])]
          .sort((left, right) => getOrderReferenceTime(right) - getOrderReferenceTime(left))

        return {
          vehicle,
          orders,
        }
      })
      .filter((group) => group.orders.length > 0)
  }, [ordersByVehicle, vehicles, selectedVeiculoId])

  return (
    <PageStack>
      <SectionHeader
        eyebrow="Acompanhamento do motorista"
        title="Minhas ordens de serviço"
        description="Acompanhe o progresso das ordens dos seus veículos e abra a visão detalhada de cada ordem."
      />

      {loading ? <Notice title="Carregando ordens" description="Buscando ordens vinculadas aos seus veículos." /> : null}
      {error ? <Notice title="Não foi possível carregar" description={error} variant="error" /> : null}

      {!loading && !error && vehicles.length === 0 ? (
        <EmptyState
          title="Nenhum veículo encontrado"
          description="Cadastre um veículo para começar a acompanhar suas ordens."
          actions={(
            <Link className={getButtonClasses({ variant: 'primary' })} to="/register/veiculo">
              Cadastrar veículo
            </Link>
          )}
        />
      ) : null}

      {!loading && !error && vehicles.length > 0 && vehicleGroups.length === 0 ? (
        <EmptyState
          title="Nenhuma ordem encontrada"
          description={selectedVeiculoId ? 'Esse veículo ainda não possui ordens registradas.' : 'Seus veículos ainda não possuem ordens registradas.'}
          actions={(
            <Link className={getButtonClasses({ variant: 'secondary' })} to="/minha-garagem">
              Ver meus veículos
            </Link>
          )}
        />
      ) : null}

      {vehicleGroups.length > 0 ? (
        <div className="grid gap-4">
          {vehicleGroups.map(({ vehicle, orders }) => (
            <Card key={vehicle.id} className="p-5 md:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="inline-flex items-center text-[11px] font-black uppercase tracking-[0.22em] text-red-700">Veículo</span>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-950">{vehicle.nome}</h2>
                  <p className="mt-1 text-sm text-zinc-600">
                    {[vehicle.marca, vehicle.modelo].filter(Boolean).join(' • ') || 'Dados do veículo'}
                    {vehicle.placa ? ` • ${vehicle.placa}` : ''}
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-700">
                  {orders.length} ordem(ns)
                </span>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {orders.map((order) => {
                  const statusMeta = getStatusMeta(order.status)

                  return (
                    <Link
                      key={order.id}
                      to={`/ordem/acompanhar/${order.id}`}
                      className="rounded-[1.5rem] border border-zinc-200 bg-white p-4 text-left transition-all duration-200 hover:border-red-200 hover:bg-red-50/30 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <StatusBadge icon={statusMeta.icon} tone={statusMeta.tone}>{statusMeta.label}</StatusBadge>
                        <span className="rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-zinc-700">
                          OS {getOrderShortCode(order.id)}
                        </span>
                      </div>

                      <strong className="mt-3 block text-base font-black text-zinc-950">Acompanhar ordem</strong>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
                        <span>{formatDateTime(order.dataInicio || order.criadoEm)}</span>
                        <span>{formatCurrency(order.valorTotal || 0)}</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </Card>
          ))}
        </div>
      ) : null}
    </PageStack>
  )
}

export default ServiceTrackingDriverHubSection
