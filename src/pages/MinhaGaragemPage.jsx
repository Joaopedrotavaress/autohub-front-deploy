import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthenticatedLayout } from '../components/layout'
import { Button, EmptyState, MetricCard, Notice, PageStack, SectionHeader, getButtonClasses } from '../components/ui'
import { useAppContext } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { getMyVeiculos } from '../services/veiculoService'
import { getUserRole, ROLES } from '../utils/accessControl'

function getValue(source, keys, fallback = '') {
  for (const key of keys) {
    if (source && source[key] !== undefined && source[key] !== null && source[key] !== '') {
      return source[key]
    }
  }

  return fallback
}

function formatAno(value) {
  if (value === undefined || value === null || value === '') {
    return '-'
  }

  const rawValue = String(value).trim()
  if (!rawValue) return '-'

  if (/^\d{4}$/.test(rawValue)) {
    return rawValue
  }

  const parsedDate = new Date(rawValue)
  if (!Number.isNaN(parsedDate.getTime())) {
    return String(parsedDate.getFullYear())
  }

  return rawValue
}

function normalizeVehicle(vehicle) {
  return {
    id: String(getValue(vehicle, ['id', 'Id'], '')).trim(),
    nome: getValue(vehicle, ['nome', 'Nome'], 'Veículo sem nome'),
    marca: getValue(vehicle, ['marca', 'Marca'], ''),
    modelo: getValue(vehicle, ['modelo', 'Modelo'], ''),
    ano: formatAno(getValue(vehicle, ['ano', 'Ano'], '')),
    placa: getValue(vehicle, ['placa', 'Placa'], ''),
    idUsuario: String(getValue(vehicle, ['idUsuario', 'IdUsuario', 'usuarioId', 'UsuarioId'], '')).trim(),
  }
}

export function MinhaGaragemPage() {
  const { user } = useAppContext()
  const navigate = useNavigate()
  const toast = useToast()
  const role = getUserRole(user)
  const [veiculos, setVeiculos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedVehicleId, setExpandedVehicleId] = useState('')

  const loadVehicles = useCallback(async (showErrorToast = false) => {
    setLoading(true)
    setError('')

    try {
      if (!user?.id) {
        throw new Error('Não foi possível identificar o usuário autenticado.')
      }

      const vehiclesData = await getMyVeiculos()
      const normalizedVehicles = (Array.isArray(vehiclesData) ? vehiclesData : [vehiclesData])
        .filter(Boolean)
        .map(normalizeVehicle)

      setVeiculos(normalizedVehicles)
      setExpandedVehicleId((currentId) => {
        if (normalizedVehicles.some((vehicle) => vehicle.id === currentId)) {
          return currentId
        }

        return normalizedVehicles[0]?.id || ''
      })
    } catch (requestError) {
      setVeiculos([])
      setExpandedVehicleId('')

      const message = requestError.message || 'Não foi possível carregar os veículos da garagem.'
      setError(message)

      if (showErrorToast) {
        toast.error(message)
      }
    } finally {
      setLoading(false)
    }
  }, [toast, user?.id])

  useEffect(() => {
    loadVehicles(false)
  }, [loadVehicles])

  const registerVehiclePath = '/register/veiculo'

  const toggleVehicleDetails = (vehicleId) => {
    setExpandedVehicleId((currentId) => (currentId === vehicleId ? '' : vehicleId))
  }

  return (
    <AuthenticatedLayout>
      <PageStack>
          <SectionHeader
            actions={(
              <>
                <Button type="button" onClick={() => navigate(registerVehiclePath)}>
                  <span className="material-symbols-outlined text-[20px]">add_circle</span>
                  Cadastrar novo veículo
                </Button>
                <Link to="/ordem/motorista" className={getButtonClasses({ variant: 'secondary' })}>
                  <span className="material-symbols-outlined text-[20px]">route</span>
                  Acompanhar serviços
                </Link>
              </>
            )}
            description="Acompanhe sua frota particular em uma garagem virtual, com acesso rápido aos dados principais e aos serviços vinculados."
            eyebrow="Minha garagem"
            title="Veja todos os veículos cadastrados na sua conta"
          />

          {loading && (
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-[0_12px_40px_rgba(25,28,29,0.05)]"
                >
                  <div className="h-3 w-28 rounded-full bg-zinc-100" />
                  <div className="mt-5 h-7 w-3/4 rounded-2xl bg-zinc-100" />
                  <div className="mt-3 h-5 w-full rounded-full bg-zinc-100" />
                  <div className="mt-8 grid grid-cols-2 gap-3">
                    <div className="h-16 rounded-2xl bg-zinc-100" />
                    <div className="h-16 rounded-2xl bg-zinc-100" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && error && (
            <Notice className="mt-2" title="Não foi possível carregar sua garagem" description={error} variant="error">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <Button type="button" variant="danger" onClick={() => loadVehicles(true)}>
                  Tentar novamente
                </Button>
              </div>
            </Notice>
          )}

          {!loading && !error && veiculos.length === 0 && (
            <EmptyState
              title="Você ainda não possui veículos cadastrados na sua garagem"
              description="Cadastre seu primeiro veículo para começar a acompanhar histórico e serviços vinculados."
              actions={(
                <>
                  <Button type="button" onClick={() => navigate(registerVehiclePath)}>
                    <span className="material-symbols-outlined text-[20px]">directions_car</span>
                    Cadastrar veículo
                  </Button>
                  <Link to="/ordem/motorista" className={getButtonClasses({ variant: 'secondary' })}>
                    <span className="material-symbols-outlined text-[20px]">route</span>
                    Acompanhar serviços
                  </Link>
                </>
              )}
            />
          )}

          {!loading && !error && veiculos.length > 0 && (
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {veiculos.map((vehicle) => {
                const isExpanded = expandedVehicleId === vehicle.id
                const vehicleTitle = vehicle.nome || `${vehicle.marca} ${vehicle.modelo}`.trim() || 'Veículo'
                const vehicleSubtitle = [vehicle.marca, vehicle.modelo].filter(Boolean).join(' • ')

                return (
                  <article
                    key={vehicle.id || `${vehicleTitle}-${vehicle.placa}`}
                    className="group overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-[0_12px_40px_rgba(25,28,29,0.06)] transition-transform duration-300 hover:-translate-y-1"
                  >
                    <div className="h-2 bg-gradient-to-r from-red-500 via-orange-500 to-amber-400" />
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                              directions_car
                            </span>
                          </div>
                          <div>
                            <span className="inline-flex rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-zinc-600">
                              Veículo ativo
                            </span>
                            <h2 className="mt-3 text-2xl font-black tracking-tight text-zinc-950">
                              {vehicleTitle}
                            </h2>
                            <p className="mt-1 text-sm font-medium text-zinc-500">
                              {vehicleSubtitle || 'Dados principais do veículo'}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-right">
                          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">
                            Placa
                          </p>
                          <p className="mt-1 text-sm font-black tracking-[0.18em] text-zinc-950">
                            {vehicle.placa || '-'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 grid grid-cols-2 gap-3">
                        <MetricCard eyebrow="Ano" title={vehicle.ano || '-'} />
                        <MetricCard eyebrow="Marca" title={vehicle.marca || '-'} />
                      </div>

                      <MetricCard className="mt-3" eyebrow="Modelo" title={vehicle.modelo || '-'} />

                      <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        <Link
                          to={`/ordem/motorista?veiculoId=${encodeURIComponent(vehicle.id)}`}
                          className={getButtonClasses({ variant: 'primary', size: 'sm' })}
                        >
                          <span className="material-symbols-outlined text-[18px]">route</span>
                          Acompanhar serviços
                        </Link>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
      </PageStack>
    </AuthenticatedLayout>
  )
}

export default MinhaGaragemPage