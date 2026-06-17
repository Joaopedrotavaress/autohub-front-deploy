import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthenticatedLayout } from '../components/layout'
import { useAppContext } from '../context/AppContext'
import { useOficinaContext } from '../context/OficinaContext'
import { useToast } from '../context/ToastContext'
import { createOrdem } from '../services/ordemService'
import { getAllVeiculos } from '../services/veiculoService'
import { getServicosByOficinaId } from '../services/servicoService'
import { getUserRole, ROLES } from '../utils/accessControl'

function getValue(source, keys, fallback = '') {
  for (const key of keys) {
    if (source && source[key] !== undefined && source[key] !== null && source[key] !== '') {
      return source[key]
    }
  }

  return fallback
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase()
}

function normalizeVehicle(vehicle) {
  return {
    id: String(getValue(vehicle, ['id', 'Id'], '')).trim(),
    nome: getValue(vehicle, ['nome', 'Nome'], 'Veículo sem nome'),
    marca: getValue(vehicle, ['marca', 'Marca'], ''),
    modelo: getValue(vehicle, ['modelo', 'Modelo'], ''),
    placa: getValue(vehicle, ['placa', 'Placa'], ''),
    ano: getValue(vehicle, ['ano', 'Ano'], ''),
    idUsuario: String(getValue(vehicle, ['idUsuario', 'IdUsuario', 'usuarioId', 'UsuarioId'], '')).trim(),
  }
}

function formatVehiclePlate(vehicle) {
  return String(getValue(vehicle, ['placa', 'Placa'], '')).trim() || 'Placa não informada'
}

function normalizeService(servico) {
  return {
    id: String(getValue(servico, ['id', 'Id'], '')).trim(),
    nome: getValue(servico, ['nome', 'Nome'], 'Serviço sem nome'),
    descricao: getValue(servico, ['descricao', 'Descricao'], ''),
    preco: Number(getValue(servico, ['preco', 'Preco'], 0)) || 0,
    status: getValue(servico, ['status', 'Status'], ''),
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0)
}

export function RegisterOrderPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAppContext()
  const { oficinas, oficinaAtivaId } = useOficinaContext()
  const userRole = getUserRole(user)
  const isAdmin = userRole === ROLES.ADMIN
  const isDonoOficina = userRole === ROLES.DONO_OFICINA

  const [selectedOfficeId, setSelectedOfficeId] = useState('')
  const [vehicleSearch, setVehicleSearch] = useState('')
  const [vehicleCandidates, setVehicleCandidates] = useState([])
  const [selectedVehicleData, setSelectedVehicleData] = useState(null)
  const [isVehicleSearchOpen, setIsVehicleSearchOpen] = useState(false)
  const [services, setServices] = useState([])
  const [serviceSearch, setServiceSearch] = useState('')
  const [selectedServiceIds, setSelectedServiceIds] = useState([])
  const [isServiceSearchOpen, setIsServiceSearchOpen] = useState(false)
  const [loadingVehicles, setLoadingVehicles] = useState(false)
  const [loadingServices, setLoadingServices] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState(null)

  const selectedOffice = useMemo(
    () => oficinas.find((office) => office.id === selectedOfficeId) || null,
    [oficinas, selectedOfficeId],
  )

  const filteredVehicles = useMemo(() => {
    const query = normalizeText(vehicleSearch)

    if (!query) {
      return vehicleCandidates
    }

    return vehicleCandidates.filter((vehicle) => {
      return normalizeText(`${vehicle.placa} ${vehicle.modelo} ${vehicle.nome}`).includes(query)
    })
  }, [vehicleCandidates, vehicleSearch])

  const filteredServices = useMemo(() => {
    const query = normalizeText(serviceSearch)

    if (!query) {
      return services
    }

    return services.filter((servico) => {
      return normalizeText(`${servico.nome} ${servico.descricao} ${servico.status}`).includes(query)
    })
  }, [services, serviceSearch])

  const selectedVehicle = useMemo(() => selectedVehicleData, [selectedVehicleData])

  const selectedServices = useMemo(
    () => services.filter((servico) => selectedServiceIds.includes(servico.id)),
    [services, selectedServiceIds],
  )

  useEffect(() => {
    if (selectedOfficeId) {
      return
    }

    if (oficinaAtivaId && oficinas.some((office) => office.id === oficinaAtivaId)) {
      setSelectedOfficeId(oficinaAtivaId)
      return
    }

    if (!oficinaAtivaId && oficinas.length > 0) {
      setSelectedOfficeId(oficinas[0].id)
    }
  }, [oficinaAtivaId, oficinas, selectedOfficeId])

  useEffect(() => {
    let cancelled = false

    const loadVehicles = async () => {
      if (!user?.id) {
        return
      }

      setLoadingVehicles(true)

      try {
        const vehiclesData = await getAllVeiculos()
        if (cancelled) return

        const normalizedVehicles = (Array.isArray(vehiclesData) ? vehiclesData : [])
          .map(normalizeVehicle)
          .filter((vehicle) => vehicle.id)

        setVehicleCandidates(normalizedVehicles)
      } catch (err) {
        if (!cancelled) {
          setVehicleCandidates([])
          setFeedback({ type: 'error', text: err.message || 'Não foi possível carregar os veículos disponíveis.' })
        }
      }

      if (!cancelled) {
        setLoadingVehicles(false)
      }
    }

    loadVehicles()

    return () => {
      cancelled = true
    }
  }, [user?.id])

  useEffect(() => {
    let cancelled = false

    const loadServices = async () => {
      if (!selectedOfficeId) {
        setServices([])
        return
      }

      setLoadingServices(true)
      setFeedback(null)

      try {
        const servicosData = await getServicosByOficinaId(selectedOfficeId)
        if (cancelled) return

        const lista = (Array.isArray(servicosData) ? servicosData : [])
          .map(normalizeService)
          .filter((servico) => servico.id)

        setServices(lista)
      } catch (err) {
        if (!cancelled) {
          setServices([])
          setFeedback({ type: 'error', text: err.message || 'Não foi possível carregar os serviços desta oficina.' })
        }
      } finally {
        if (!cancelled) {
          setLoadingServices(false)
        }
      }
    }

    loadServices()

    return () => {
      cancelled = true
    }
  }, [selectedOfficeId])

  useEffect(() => {
    setSelectedVehicleData(null)
    setIsVehicleSearchOpen(false)
    setVehicleSearch('')
    setSelectedServiceIds([])
    setServiceSearch('')
    setFeedback(null)
  }, [selectedOfficeId])

  const handleSelectVehicle = (vehicle) => {
    if (!vehicle?.id) {
      return
    }

    setSelectedVehicleData(vehicle)
    setIsVehicleSearchOpen(false)
    setSelectedServiceIds([])
    setFeedback(null)
  }

  const toggleService = (serviceId) => {
    setSelectedServiceIds((current) => {
      if (current.includes(serviceId)) {
        return current.filter((id) => id !== serviceId)
      }

      return [...current, serviceId]
    })
  }

  const validateForm = () => {
    if (!user?.id) {
      toast.error('É necessário estar autenticado para criar uma ordem de serviço.')
      return false
    }

    if (!selectedOfficeId) {
      toast.warning('Selecione uma oficina para continuar.')
      return false
    }

    if (!selectedVehicle?.id) {
      toast.warning('Selecione um veículo pela placa.')
      return false
    }

    if (selectedServiceIds.length === 0) {
      toast.warning('Selecione ao menos um serviço para a ordem.')
      return false
    }

    if (services.length === 0) {
      toast.warning('A oficina selecionada não possui serviços cadastrados.')
      return false
    }

    return true
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!validateForm()) {
      return
    }

    setSubmitting(true)
    setFeedback(null)

    try {
      const payload = {
        VeiculoId: selectedVehicle.id,
        UsuarioId: selectedVehicle.idUsuario,
        OficinaId: selectedOfficeId,
        Status: 1,
        DataInicio: new Date().toISOString(),
        DataConclusao: null,
        Itens: selectedServiceIds.map((serviceId) => ({
          ServicoId: serviceId,
          Quantidade: 1,
        })),
      }

      const ordemCriada = await createOrdem(payload)
      toast.success(`Ordem de serviço criada com sucesso${ordemCriada?.id ? `: ${ordemCriada.id}` : ''}.`)
      setFeedback({ type: 'success', text: 'A ordem foi cadastrada com status inicial Pendente.' })
      setSelectedServiceIds([])
    } catch (err) {
      if (err?.status === 400) {
        setFeedback({ type: 'error', text: err.data?.mensagem || err.message || 'Os dados informados são inválidos.' })
      } else if (err?.status === 404) {
        setFeedback({ type: 'error', text: err.data?.mensagem || 'Não foi possível localizar um dos registros selecionados.' })
      } else if (err?.status === 401 || err?.status === 403) {
        setFeedback({ type: 'error', text: 'Você não tem permissão para criar esta ordem de serviço.' })
      } else {
        setFeedback({ type: 'error', text: err.message || 'Não foi possível criar a ordem de serviço.' })
      }
    } finally {
      setSubmitting(false)
    }
  }

  const selectedOfficeHint = selectedOffice
    ? `${selectedOffice.nome || 'Oficina selecionada'}${selectedOffice.endereco ? ` • ${selectedOffice.endereco}` : ''}`
    : 'Nenhuma oficina selecionada'

  const vehicleSearchLabel = 'Buscar veículo por placa'
  const vehicleSearchPlaceholder = 'ex.: ABC1D23'

  const openVehicleSearch = () => {
    setVehicleSearch('')
    setIsVehicleSearchOpen(true)
  }

  const openServiceSearch = () => {
    if (!selectedOfficeId) {
      toast.warning('Selecione uma oficina para visualizar os serviços.')
      return
    }

    setServiceSearch('')
    setIsServiceSearchOpen(true)
  }

  return (
    <AuthenticatedLayout
      showPageHeader
      title="Nova ordem de serviço"
      description="Registre uma ordem para uma oficina, selecione o veículo pela placa e adicione os serviços executados."
      actions={(
        <>
          <Link className="rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-bold text-zinc-700 transition-colors hover:border-red-200 hover:text-red-600" to="/ordem">
            Acompanhamento
          </Link>
        </>
      )}
    >
      <div className="grid gap-8">
        <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-[0_18px_60px_rgba(25,28,29,0.06)] sm:p-8">
          {feedback ? (
            <div className={`mb-6 rounded-2xl border px-4 py-4 text-sm font-medium ${feedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-red-200 bg-red-50 text-red-900'}`}>
              {feedback.text}
            </div>
          ) : null}

          <form className="space-y-8" onSubmit={handleSubmit}>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-zinc-500">Passo 1</p>
                <h2 className="mt-2 text-xl font-black text-zinc-950">Selecionar oficina</h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">A ordem será vinculada à oficina escolhida abaixo.</p>
                <label className="mt-4 block text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500" htmlFor="office-select">
                  Oficina
                </label>
                <select
                  id="office-select"
                  className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 outline-none transition-colors focus:border-red-300 focus:ring-2 focus:ring-red-100"
                  value={selectedOfficeId}
                  onChange={(event) => setSelectedOfficeId(event.target.value)}
                  disabled={oficinas.length === 0}
                >
                  <option value="">Selecione uma oficina</option>
                  {oficinas.map((office) => (
                    <option key={office.id} value={office.id}>
                      {office.nome || 'Oficina sem nome'}
                    </option>
                  ))}
                </select>

                {oficinas.length === 0 && isDonoOficina ? (
                  <div className="mt-4 rounded-2xl border border-dashed border-zinc-300 bg-white p-4 text-sm text-zinc-600">
                    Você não possui oficinas cadastradas ainda. <Link className="font-bold text-red-600 hover:underline" to="/register/oficina">Cadastrar oficina</Link>
                  </div>
                ) : null}
              </div>

              <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-zinc-500">Passo 2</p>
                <h2 className="mt-2 text-xl font-black text-zinc-950">Selecionar veículo</h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                  Selecione o veículo apenas pela placa. O cliente será identificado automaticamente a partir desse veículo.
                </p>

                <button
                  type="button"
                  onClick={openVehicleSearch}
                  className="mt-4 flex w-full items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-left text-sm font-medium text-zinc-600 transition-colors hover:border-red-200 hover:text-zinc-900"
                  disabled={loadingVehicles}
                >
                  <span>
                    {selectedVehicle
                      ? `${formatVehiclePlate(selectedVehicle)}${selectedVehicle.modelo ? ` • ${selectedVehicle.modelo}` : ''}`
                      : vehicleSearchLabel}
                  </span>
                  <span className="material-symbols-outlined text-[20px] text-zinc-400">search</span>
                </button>

              
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5 lg:col-span-2">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-zinc-500">Passo 3</p>
                <h2 className="mt-2 text-xl font-black text-zinc-950">Adicionar serviços</h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">Abra a busca para escolher um ou mais serviços da oficina selecionada.</p>

                <button
                  type="button"
                  onClick={openServiceSearch}
                  className="mt-4 flex w-full items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-left text-sm font-medium text-zinc-600 transition-colors hover:border-red-200 hover:text-zinc-900"
                  disabled={loadingServices}
                >
                  <span>
                    {selectedServices.length > 0
                      ? `${selectedServices.length} serviço(s) selecionado(s)`
                      : 'Buscar serviço'}
                  </span>
                  <span className="material-symbols-outlined text-[20px] text-zinc-400">search</span>
                </button>

                <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700">
                  <span className="block text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Serviços selecionados</span>
                  {selectedServices.length > 0 ? (
                    <ul className="mt-3 space-y-2">
                      {selectedServices.map((servico) => (
                        <li key={servico.id} className="flex items-center justify-between gap-4 rounded-xl bg-zinc-50 px-3 py-2">
                          <span>{servico.nome}</span>
                          <span className="font-bold text-zinc-950">{formatCurrency(servico.preco)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm text-zinc-600">Nenhum serviço adicionado ainda.</p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-600/20 transition-transform hover:-translate-y-0.5 hover:bg-red-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Criando ordem...' : 'Criar ordem de serviço'}
              </button>

              <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-600">
                <span>{selectedServices.length} serviço(s) selecionado(s)</span>
                <span className="hidden sm:inline">•</span>
                <span>{selectedVehicle ? '1 veículo vinculado' : 'Selecione um veículo para continuar'}</span>
              </div>
            </div>
          </form>
        </section>
      </div>

      {isVehicleSearchOpen ? (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-zinc-950/55 px-4 py-10 backdrop-blur-sm"
          role="presentation"
          onClick={() => setIsVehicleSearchOpen(false)}
        >
          <div
            className="w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[0_35px_80px_rgba(15,23,42,0.28)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="vehicle-search-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-zinc-200 px-6 py-5 sm:px-7">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-zinc-500">Passo 2</p>
              <h2 id="vehicle-search-title" className="mt-2 text-2xl font-black tracking-tight text-zinc-950">
                Buscar veículo por placa
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                Pesquise e selecione apenas o veículo que será atendido. O cliente será vinculado automaticamente pelo veículo escolhido.
              </p>
            </div>

            <div className="px-6 py-6 sm:px-7">
              <label className="block text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500" htmlFor="vehicle-search-modal">
                {vehicleSearchLabel}
              </label>
              <input
                id="vehicle-search-modal"
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-red-300 focus:ring-2 focus:ring-red-100"
                placeholder={vehicleSearchPlaceholder}
                value={vehicleSearch}
                onChange={(event) => setVehicleSearch(event.target.value)}
                autoFocus
                disabled={loadingVehicles}
              />

              <div className="mt-5 max-h-[50vh] space-y-3 overflow-auto pr-1">
                {loadingVehicles ? <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">Carregando veículos...</div> : null}

                {!loadingVehicles && filteredVehicles.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-600">
                    Nenhum veículo foi encontrado com a placa informada.
                  </div>
                ) : null}

                {filteredVehicles.map((vehicle) => {
                  const isSelected = vehicle.id === selectedVehicle?.id

                  return (
                    <button
                      key={vehicle.id}
                      type="button"
                      onClick={() => handleSelectVehicle(vehicle)}
                      className={`w-full rounded-2xl border p-4 text-left transition-colors ${isSelected ? 'border-red-300 bg-red-50' : 'border-zinc-200 bg-white hover:border-red-200 hover:bg-red-50/50'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <strong className="block text-sm font-black text-zinc-950">{formatVehiclePlate(vehicle)}</strong>
                          <span className="mt-1 block text-sm text-zinc-600">
                            {vehicle.modelo || 'Modelo não informado'}
                          </span>
                        </div>
                        <span className="rounded-full bg-zinc-950 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white">
                          {isSelected ? 'Selecionado' : 'Escolher'}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsVehicleSearchOpen(false)}
                  className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 px-5 py-3 text-sm font-bold text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isServiceSearchOpen ? (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-zinc-950/55 px-4 py-10 backdrop-blur-sm"
          role="presentation"
          onClick={() => setIsServiceSearchOpen(false)}
        >
          <div
            className="w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[0_35px_80px_rgba(15,23,42,0.28)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-search-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-zinc-200 px-6 py-5 sm:px-7">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-zinc-500">3</p>
              <h2 id="service-search-title" className="mt-2 text-2xl font-black tracking-tight text-zinc-950">
                Buscar serviço
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                Pesquise e selecione os serviços que farão parte da ordem de serviço.
              </p>
            </div>

            <div className="px-6 py-6 sm:px-7">
              <label className="block text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500" htmlFor="service-search-modal">
                Buscar serviço
              </label>
              <input
                id="service-search-modal"
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-red-300 focus:ring-2 focus:ring-red-100"
                placeholder="Ex.: troca de óleo, alinhamento..."
                value={serviceSearch}
                onChange={(event) => setServiceSearch(event.target.value)}
                autoFocus
                disabled={loadingServices}
              />

              <div className="mt-5 max-h-[50vh] space-y-3 overflow-auto pr-1">
                {loadingServices ? <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">Carregando serviços...</div> : null}

                {!loadingServices && filteredServices.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-600">
                    {selectedOfficeId
                      ? 'Nenhum serviço encontrado para esta oficina.'
                      : 'Selecione uma oficina para visualizar os serviços disponíveis.'}
                  </div>
                ) : null}

                {filteredServices.map((servico) => {
                  const isChecked = selectedServiceIds.includes(servico.id)

                  return (
                    <button
                      key={servico.id}
                      type="button"
                      onClick={() => toggleService(servico.id)}
                      className={`w-full rounded-2xl border p-4 text-left transition-colors ${isChecked ? 'border-red-300 bg-red-50' : 'border-zinc-200 bg-white hover:border-red-200 hover:bg-red-50/50'}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <strong className="block text-sm font-black text-zinc-950">{servico.nome}</strong>
                          <span className="mt-1 block text-sm text-zinc-600">{servico.descricao || 'Sem descrição'}</span>
                          <span className="mt-2 inline-flex rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-zinc-600">
                            {formatCurrency(servico.preco)}
                          </span>
                        </div>
                        <span className="rounded-full bg-zinc-950 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white">
                          {isChecked ? 'Adicionado' : 'Adicionar'}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsServiceSearchOpen(false)}
                  className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 px-5 py-3 text-sm font-bold text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </AuthenticatedLayout>
  )
}

export default RegisterOrderPage