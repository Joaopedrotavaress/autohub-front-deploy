import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppContext } from '../../context/AppContext'
import { useOficinaContext } from '../../context/OficinaContext'
import { useModal } from '../../context/ModalContext'
import { useToast } from '../../context/ToastContext'
import { Button, Card, Dialog, EmptyState, Field, Input, Notice, PageStack, SectionHeader, Select, Textarea, getButtonClasses } from '../ui'
import { deleteServico, getServicosByOficinaId, updateServico } from '../../services/servicoService'
import { getUserRole, ROLES } from '../../utils/accessControl'

const STATUS_LABELS = {
  PREVENCAO: 'Prevenção',
  MANUTENCAO: 'Manutenção',
  ESTETICA: 'Estética',
}

const STATUS_OPTIONS = ['PREVENCAO', 'MANUTENCAO', 'ESTETICA']

const STATUS_BADGE_CLASSES = {
  PREVENCAO: 'bg-amber-100 text-amber-900',
  MANUTENCAO: 'bg-sky-100 text-sky-900',
  ESTETICA: 'bg-emerald-100 text-emerald-900',
}

function getValue(source, keys, fallback = '') {
  for (const key of keys) {
    if (source && source[key] !== undefined && source[key] !== null && source[key] !== '') {
      return source[key]
    }
  }

  return fallback
}

function normalizeOffice(oficina) {
  return {
    id: String(getValue(oficina, ['id', 'Id'], '')).trim(),
    nome: String(getValue(oficina, ['nome', 'Nome'], '')).trim(),
  }
}

function normalizeStatusValue(value) {
  const rawValue = String(value ?? '').trim()
  if (!rawValue) return 'PREVENCAO'

  const normalized = rawValue.toUpperCase()
  if (STATUS_OPTIONS.includes(normalized)) return normalized

  const numericValue = Number(normalized)
  if (Number.isNaN(numericValue)) return 'PREVENCAO'

  if (numericValue === 0) return 'PREVENCAO'
  if (numericValue === 1) return 'MANUTENCAO'
  if (numericValue === 2) return 'ESTETICA'

  return 'PREVENCAO'
}

function normalizeServico(servico) {
  return {
    id: String(getValue(servico, ['id', 'Id'], '')).trim(),
    nome: String(getValue(servico, ['nome', 'Nome'], '')).trim(),
    descricao: String(getValue(servico, ['descricao', 'Descricao'], '')).trim(),
    preco: Number(getValue(servico, ['preco', 'Preco'], 0)),
    status: normalizeStatusValue(getValue(servico, ['status', 'Status'], '')),
    oficinaId: String(getValue(servico, ['oficinaId', 'OficinaId'], '')).trim(),
    tempoEstimado: String(
      getValue(servico, ['tempoEstimado', 'TempoEstimado', 'tempo_estimado', 'TempoEstimadoMinutos'], '')
    ).trim(),
  }
}

function formatCurrency(value) {
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue)) return 'R$ 0,00'

  return numberValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function formatCurrencyInput(value) {
  if (!value) return ''

  const normalized = String(value).replace(/\D/g, '')
  if (!normalized) return ''

  const cents = Number.parseInt(normalized, 10)
  if (!Number.isFinite(cents)) return ''

  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function parseCurrencyToDecimal(value) {
  if (typeof value !== 'string') return NaN

  const normalized = value.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '')
  if (!normalized.trim()) return NaN

  return Number.parseFloat(normalized)
}

function isValidGuid(value) {
  if (!value) return false

  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return guidRegex.test(value)
}

function getStatusLabel(status) {
  return STATUS_LABELS[status] || 'Sem status'
}

export function ServiceManagementSection() {
  const navigate = useNavigate()
  const { user } = useAppContext()
  const { oficinas, oficinaAtiva, oficinaAtivaId, setOficinaAtiva, loading: loadingOficinasContext } = useOficinaContext()
  const modal = useModal()
  const toast = useToast()
  const userRole = getUserRole(user)
  const [oficina, setOficina] = useState(null)
  const [servicos, setServicos] = useState([])
  const [loadingOficina, setLoadingOficina] = useState(true)
  const [loadingServicos, setLoadingServicos] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState('')
  const [error, setError] = useState('')
  const [editingServico, setEditingServico] = useState(null)
  const [editForm, setEditForm] = useState({
    nome: '',
    descricao: '',
    precoInput: '',
    status: 'PREVENCAO',
  })

  useEffect(() => {
    let cancelled = false

    const loadOficina = async () => {
      setLoadingOficina(true)
      setError('')

      if (userRole !== ROLES.DONO_OFICINA && userRole !== ROLES.ADMIN) {
        if (!cancelled) {
          setOficina(null)
          setLoadingOficina(false)
          setError('Esta tela esta disponivel apenas para perfis profissionais autorizados.')
        }
        return
      }

      if (!user?.id && !user?.Id) {
        if (!cancelled) {
          setOficina(null)
          setLoadingOficina(false)
          setError('Não foi possível identificar o usuário logado.')
        }
        return
      }

      try {
        if (!cancelled) {
          if (!oficinaAtiva) {
            setOficina(null)
            setError('Nenhuma oficina vinculada foi encontrada para o usuario logado.')
          } else {
            setOficina(normalizeOffice(oficinaAtiva))
          }
        }
      } catch (err) {
        if (!cancelled) {
          setOficina(null)
          setError(err?.message || 'Erro ao carregar a oficina vinculada.')
        }
      } finally {
        if (!cancelled) {
          setLoadingOficina(false)
        }
      }
    }

    loadOficina()

    return () => {
      cancelled = true
    }
  }, [user?.id, user?.Id, userRole, oficinaAtiva?.id])

  useEffect(() => {
    const oficinaId = oficina?.id || ''
    if (!oficinaId) {
      setServicos([])
      setLoadingServicos(false)
      return
    }

    let cancelled = false

    const load = async () => {
      setLoadingServicos(true)
      try {
        const result = await getServicosByOficinaId(oficinaId)
        if (!cancelled) {
          const lista = Array.isArray(result) ? result.map(normalizeServico).filter((item) => item.id) : []
          setServicos(lista)
        }
      } catch (err) {
        if (!cancelled) {
          setServicos([])
          setError(err?.message || 'Erro ao buscar os serviços da oficina.')
        }
      } finally {
        if (!cancelled) {
          setLoadingServicos(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [oficina?.id])

  const handleEditChange = (event) => {
    const { name, value } = event.target
    setEditForm((prev) => ({ ...prev, [name]: value }))
  }

  const openEditModal = (servico) => {
    setError('')
    setEditingServico(servico)
    setEditForm({
      nome: servico.nome,
      descricao: servico.descricao,
      precoInput: servico.preco ? formatCurrencyInput(String(Math.round(servico.preco * 100))) : '',
      status: STATUS_OPTIONS.includes(servico.status) ? servico.status : 'PREVENCAO',
    })
  }

  const closeEditModal = () => {
    if (saving) return
    setEditingServico(null)
  }

  const validateEditForm = () => {
    if (!oficina?.id) {
      toast.error('A oficina vinculada ao usuário logado não foi encontrada.')
      return false
    }

    if (!editingServico?.id) {
      toast.error('Não foi possível identificar o serviço selecionado.')
      return false
    }

    if (!editForm.nome.trim()) {
      toast.warning('Informe o nome do serviço.')
      return false
    }

    if (!editForm.descricao.trim()) {
      toast.warning('Informe a descrição do serviço.')
      return false
    }

    if (!STATUS_OPTIONS.includes(editForm.status)) {
      toast.warning('Selecione um status válido para o serviço.')
      return false
    }

    if (!isValidGuid(oficina.id)) {
      toast.error('A oficina vinculada possui um identificador inválido.')
      return false
    }

    const precoDecimal = parseCurrencyToDecimal(editForm.precoInput)
    if (!Number.isFinite(precoDecimal) || precoDecimal <= 0) {
      toast.warning('Informe um preço maior do que zero.')
      return false
    }

    return true
  }

  const handleEditSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!validateEditForm()) {
      return
    }

    setSaving(true)

    try {
      const payload = {
        nome: editForm.nome.trim(),
        descricao: editForm.descricao.trim(),
        preco: parseCurrencyToDecimal(editForm.precoInput),
        status: editForm.status,
        oficinaId: oficina.id,
      }

      const servicoAtualizado = await updateServico(editingServico.id, payload)
      const normalized = normalizeServico(servicoAtualizado)

      setServicos((prev) => prev.map((item) => (item.id === normalized.id ? normalized : item)))
      setEditingServico(null)
      toast.success(`Serviço atualizado com sucesso: ${normalized.nome || payload.nome}.`)
    } catch (err) {
      toast.error(err?.message || 'Erro ao editar o serviço. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (servico) => {
    if (!servico?.id) {
      toast.error('Não foi possível identificar o serviço selecionado para exclusão.')
      return
    }

    const shouldDelete = await modal.confirmDeletion({
      title: servico.nome || 'Excluir serviço',
      description: 'Esta ação é permanente. Depois de apagar, o serviço será removido da listagem da oficina.',
      confirmLabel: 'Confirmar exclusão',
      cancelLabel: 'Cancelar',
    })

    if (!shouldDelete) {
      return
    }

    setDeletingId(servico.id)
    setError('')

    try {
      await deleteServico(servico.id)
      setServicos((prev) => prev.filter((item) => item.id !== servico.id))
      toast.success('Serviço apagado com sucesso.')
    } catch (err) {
      toast.error(err?.message || 'Erro ao apagar o serviço. Tente novamente.')
    } finally {
      setDeletingId('')
    }
  }

  const canManage = (userRole === ROLES.DONO_OFICINA || userRole === ROLES.ADMIN) && Boolean(oficina?.id)

  return (
    <PageStack>
        <SectionHeader
          actions={oficina?.id ? <Link className={getButtonClasses({ variant: 'primary' })} to={`/servico/cadastrar/${oficina.id}`}>Novo serviço</Link> : null}
          description="Visualize, edite e apague os serviços cadastrados para a sua oficina."
          eyebrow="Gestão da oficina"
          title="Meus Serviços"
        />

        {loadingOficina && (
          <Notice description="Carregando a oficina vinculada ao usuário logado..." title="Buscando contexto profissional" />
        )}

        {oficinas.length > 1 && !loadingOficinasContext && (
          <Card className="rounded-3xl bg-zinc-50 p-4 shadow-none">
            <Field className="max-w-xl" htmlFor="service-management-oficina" label="Oficina ativa">
              <Select id="service-management-oficina" value={oficinaAtivaId} onChange={(event) => setOficinaAtiva(event.target.value)}>
                {oficinas.map((item) => (
                  <option key={item.id} value={item.id}>{item.nome}</option>
                ))}
              </Select>
            </Field>
          </Card>
        )}

        {error ? <Notice description={error} title="Não foi possível concluir a operação" variant="error" /> : null}

        {!loadingOficina && oficina?.id && (
          <Notice title="Oficina vinculada" variant="neutral">
            <span>Você está gerenciando os serviços de <strong>{oficina.nome || 'Oficina do usuário logado'}</strong>.</span>
          </Notice>
        )}

        {!loadingOficina && !oficina?.id && !error && (
          <Notice
            description="Nenhuma oficina vinculada encontrada. Cadastre sua oficina para liberar a gestão de serviços."
            title="Nenhuma oficina vinculada"
          />
        )}

        <Card className="p-5 md:p-6">
          {!canManage && !loadingOficina && (
            <EmptyState
              description="Você precisa estar autenticado com um perfil profissional autorizado e possuir uma oficina vinculada para visualizar os serviços."
              title="Gestão indisponível"
            />
          )}

          {canManage && loadingServicos ? (
            <EmptyState description="Carregando serviços cadastrados..." title="Buscando catálogo da oficina" />
          ) : null}

          {canManage && !loadingServicos && servicos.length === 0 && !error && (
            <EmptyState
              actions={oficina?.id ? (
                <Button onClick={() => navigate(`/servico/cadastrar/${oficina.id}`)}>
                  Cadastrar serviço
                </Button>
              ) : null}
              description="Cadastre o primeiro serviço da sua oficina para começar a gerenciar preços, descrições e status."
              title="Nenhum serviço encontrado"
            />
          )}

          {canManage && !loadingServicos && servicos.length > 0 && (
            <div className="grid gap-4 xl:grid-cols-2">
              {servicos.map((servico) => (
                <Card className="grid gap-4 rounded-[1.75rem] bg-gradient-to-b from-white to-zinc-50 p-5 shadow-none" key={servico.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <span className="inline-flex items-center text-[11px] font-black uppercase tracking-[0.22em] text-red-700">Serviço cadastrado</span>
                      <h3 className="mt-2 text-xl font-black text-zinc-950">{servico.nome || 'Serviço sem nome'}</h3>
                    </div>

                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${STATUS_BADGE_CLASSES[servico.status] || 'bg-zinc-200 text-zinc-800'}`}>
                      {getStatusLabel(servico.status)}
                    </span>
                  </div>

                  <p className="text-sm leading-relaxed text-zinc-600">{servico.descricao || 'Sem descrição informada.'}</p>

                  <dl className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <dt className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">Preço</dt>
                      <dd className="mt-1 text-sm font-bold text-zinc-950">{formatCurrency(servico.preco)}</dd>
                    </div>
                  </dl>

                  <div className="flex flex-wrap items-center gap-3">
                    <Button variant="secondary" type="button" onClick={() => openEditModal(servico)}>
                      Editar
                    </Button>
                    <Button variant="danger" type="button" onClick={() => handleDelete(servico)}>
                      {deletingId === servico.id ? 'Apagando...' : 'Apagar'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      

      <Dialog
        description="Atualize o nome, a descrição, o preço e o status do serviço sem alterar o fluxo de gestão atual."
        eyebrow="Editar serviço"
        isOpen={Boolean(editingServico)}
        maxWidth="max-w-2xl"
        onClose={closeEditModal}
        title={editingServico?.nome || 'Serviço'}
      >
        <form className="grid gap-4" onSubmit={handleEditSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field htmlFor="edit-nome" label="Nome">
              <Input id="edit-nome" name="nome" value={editForm.nome} onChange={handleEditChange} disabled={saving} required />
            </Field>

            <Field htmlFor="edit-precoInput" label="Preço">
              <Input
                id="edit-precoInput"
                name="precoInput"
                value={editForm.precoInput}
                onChange={(event) => setEditForm((prev) => ({ ...prev, precoInput: formatCurrencyInput(event.target.value) }))}
                disabled={saving}
                placeholder="0,00"
                required
              />
            </Field>

            <Field className="md:col-span-2" htmlFor="edit-descricao" label="Descrição">
              <Textarea id="edit-descricao" name="descricao" value={editForm.descricao} onChange={handleEditChange} disabled={saving} required />
            </Field>

            <Field htmlFor="edit-status" label="Status">
              <Select id="edit-status" name="status" value={editForm.status} onChange={handleEditChange} disabled={saving} required>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {STATUS_LABELS[option]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={closeEditModal} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </div>
        </form>
      </Dialog>
    </PageStack>
  )
}

export default ServiceManagementSection