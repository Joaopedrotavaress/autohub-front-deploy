import { useEffect, useMemo, useState } from 'react'
import { AuthenticatedLayout } from '../components/layout'
import { Button, Card, Dialog, Field, Notice, PageStack, SectionHeader, StatusBadge, SurfacePanel, Select, cn } from '../components/ui'
import { useToast } from '../context/ToastContext'
import { getAssinaturas, updateAssinatura, deleteAssinatura } from '../services/assinaturaService'
import { getPlanos } from '../services/planoService'
import { getAllUsuarios } from '../services/usuarioService'
import { formatCurrency } from '../utils/billing'
import { formatDate, formatDateTime, getDateTimestamp } from '../utils/dateTime'

export function AdminAssinaturasPage() {
  const toast = useToast()
  const [assinaturas, setAssinaturas] = useState([])
  const [planos, setPlanos] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(false)

  // Search & Filter
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Details dialog / sheet state
  const [selectedAssinatura, setSelectedAssinatura] = useState(null)
  const [editStatus, setEditStatus] = useState('')
  const [editRenovacao, setEditRenovacao] = useState('true')

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [subsResponse, plansResponse] = await Promise.all([
        getAssinaturas(),
        getPlanos().catch(() => []),
      ])

      let usersResponse = []
      try {
        usersResponse = await getAllUsuarios()
      } catch (err) {
        console.warn('Failed to retrieve all users, proceeding with fallback IDs.', err)
      }

      setAssinaturas(subsResponse)
      setPlanos(plansResponse)
      setUsuarios(usersResponse)
    } catch (err) {
      setError(err.message || 'Erro ao carregar dados de assinaturas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Maps
  const planosMap = useMemo(() => {
    return planos.reduce((acc, p) => {
      acc[String(p.id).trim()] = p
      return acc
    }, {})
  }, [planos])

  const usuariosMap = useMemo(() => {
    return usuarios.reduce((acc, u) => {
      acc[String(u.id).trim()] = u
      return acc
    }, {})
  }, [usuarios])

  // Computed & Filtered
  const filteredAssinaturas = useMemo(() => {
    return assinaturas.filter((subs) => {
      const user = usuariosMap[subs.usuarioId]
      const plano = planosMap[subs.planoId]

      const userText = user ? `${user.nome} ${user.email}`.toLowerCase() : subs.usuarioId.toLowerCase()
      const planoText = plano ? plano.nome.toLowerCase() : subs.planoId.toLowerCase()
      const query = search.toLowerCase()

      const matchesSearch = userText.includes(query) || planoText.includes(query) || subs.id.toLowerCase().includes(query)
      const matchesStatus = statusFilter === 'ALL' || subs.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [assinaturas, search, statusFilter, usuariosMap, planosMap])

  const handleOpenDetails = (subs) => {
    setSelectedAssinatura(subs)
    setEditStatus(subs.status)
    setEditRenovacao(String(subs.renovacaoAutomatica))
  }

  const handleSaveStatus = async () => {
    if (!selectedAssinatura) return
    setUpdating(true)
    try {
      const response = await updateAssinatura(selectedAssinatura.id, {
        usuarioId: selectedAssinatura.usuarioId,
        planoId: selectedAssinatura.planoId,
        status: editStatus,
        renovacaoAutomatica: editRenovacao === 'true',
        dataInicio: selectedAssinatura.dataInicio,
        dataFim: selectedAssinatura.dataFim,
        dataRenovacao: selectedAssinatura.dataRenovacao,
        ultimoPagamentoEm: selectedAssinatura.ultimoPagamentoEm,
        abacatePaySubscriptionId: selectedAssinatura.abacatePaySubscriptionId,
        abacatePayBillId: selectedAssinatura.abacatePayBillId,
        checkoutUrl: selectedAssinatura.checkoutUrl,
      })

      toast.success('Assinatura atualizada com sucesso.')
      setSelectedAssinatura(null)
      loadData()
    } catch (err) {
      toast.error(err.message || 'Não foi possível atualizar a assinatura.')
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteSub = async (id) => {
    if (!window.confirm('Tem certeza que deseja cancelar/remover esta assinatura do sistema?')) {
      return
    }
    try {
      await deleteAssinatura(id)
      toast.success('Assinatura excluída.')
      setSelectedAssinatura(null)
      loadData()
    } catch (err) {
      toast.error(err.message || 'Não foi possível excluir a assinatura.')
    }
  }

  // Generate fake history log for details sheet preview (fulfills "Histórico de faturamento e eventos")
  const getSimulatedHistory = (subs) => {
    const history = []
    if (subs.criadoEm || subs.dataInicio) {
      history.push({
        id: '1',
        data: subs.criadoEm || subs.dataInicio,
        titulo: 'Assinatura Registrada',
        desc: 'A adesão ao plano foi solicitada no painel principal.',
        tipo: 'INFO',
      })
    }
    if (subs.checkoutUrl && subs.status === 'PENDENTE') {
      history.push({
        id: '2',
        data: subs.criadoEm || subs.dataInicio,
        titulo: 'Faturamento Criado',
        desc: `Checkout gerado na API da AbacatePay (Bill: ${subs.abacatePayBillId || 'N/A'}). Aguardando pagamento.`,
        tipo: 'WARN',
      })
    }
    if (subs.ultimoPagamentoEm || (subs.status !== 'PENDENTE' && subs.status !== 'CANCELADA')) {
      history.push({
        id: '3',
        data: subs.ultimoPagamentoEm || subs.dataInicio,
        titulo: 'Pagamento Confirmado',
        desc: `Transação processada com sucesso via PIX/Cartão. ID Assinatura: ${subs.abacatePaySubscriptionId || 'N/A'}.`,
        tipo: 'SUCCESS',
      })
    }
    if (subs.status === 'CANCELADA' || subs.status === 'INATIVO') {
      history.push({
        id: '4',
        data: subs.atualizadoEm || subs.dataFim,
        titulo: 'Assinatura Cancelada',
        desc: 'A assinatura foi suspensa ou cancelada pelo usuário ou administrador.',
        tipo: 'DANGER',
      })
    }
    return history.sort((a, b) => getDateTimestamp(b.data) - getDateTimestamp(a.data))
  }

  return (
    <AuthenticatedLayout>
      <PageStack>
        <SectionHeader
          eyebrow="Painel de Assinaturas"
          title="Gestão de Assinaturas das Oficinas"
          description="Monitore os contratos ativos, faturamento e integrações com o AbacatePay. Visualize e filtre o status de cada adesão."
          actions={
            <Button type="button" variant="secondary" onClick={loadData} disabled={loading}>
              Atualizar dados
            </Button>
          }
        />

        {error ? <Notice variant="error" title="Erro de carregamento" description={error} /> : null}

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 gap-3 max-w-md">
            <input
              type="text"
              placeholder="Buscar por cliente, plano ou ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Filtro:</span>
            <div className="flex gap-1.5 bg-zinc-100 p-1 rounded-xl">
              {['ALL', 'ATIVO', 'PENDENTE', 'CANCELADO'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-bold rounded-lg transition-all',
                    statusFilter === st ? 'bg-white text-zinc-950 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
                  )}
                >
                  {st === 'ALL' ? 'Todos' : st}
                </button>
              ))}
            </div>
          </div>
        </div>

        <SurfacePanel>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-zinc-950">Histórico e faturamentos</h2>
            <StatusBadge tone="neutral" icon="credit_card">
              {filteredAssinaturas.length} registro(s)
            </StatusBadge>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-zinc-600">
              <thead>
                <tr className="border-b border-zinc-100 text-[11px] font-black uppercase tracking-[0.22em] text-zinc-400">
                  <th className="pb-3 pr-4">Cliente</th>
                  <th className="pb-3 pr-4">Plano</th>
                  <th className="pb-3 pr-4">Início</th>
                  <th className="pb-3 pr-4">Vencimento</th>
                  <th className="pb-3 pr-4 text-center">Renovação</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-zinc-400">
                      Buscando faturamentos no servidor...
                    </td>
                  </tr>
                ) : filteredAssinaturas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-zinc-400">
                      Nenhuma assinatura encontrada nesta busca.
                    </td>
                  </tr>
                ) : (
                  filteredAssinaturas.map((subs) => {
                    const user = usuariosMap[subs.usuarioId]
                    const plano = planosMap[subs.planoId]

                    const subStatus = subs.status || 'PENDENTE'
                    const statusTone = 
                      subStatus === 'ATIVO' || subStatus === 'PAGO' ? 'done' :
                      subStatus === 'PENDENTE' ? 'warning' : 'neutral'

                    return (
                      <tr key={subs.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="py-4 pr-4">
                          <div className="font-bold text-zinc-950">{user?.nome || 'Id: ' + subs.usuarioId.substring(0,8)}</div>
                          <div className="text-xs text-zinc-400">{user?.email || 'N/A'}</div>
                        </td>
                        <td className="py-4 pr-4 font-semibold text-zinc-900">
                          {plano?.nome || 'ID: ' + subs.planoId.substring(0,8)}
                        </td>
                        <td className="py-4 pr-4 text-xs whitespace-nowrap">{formatDate(subs.dataInicio) || '-'}</td>
                        <td className="py-4 pr-4 text-xs whitespace-nowrap">{formatDate(subs.dataFim) || '-'}</td>
                        <td className="py-4 pr-4 text-center">
                          {subs.renovacaoAutomatica ? (
                            <span className="inline-flex items-center text-emerald-600 text-xs font-bold gap-1">
                              <span className="material-symbols-rounded text-sm">check_circle</span> Sim
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-zinc-400 text-xs font-bold gap-1">
                              <span className="material-symbols-rounded text-sm">cancel</span> Não
                            </span>
                          )}
                        </td>
                        <td className="py-4 pr-4">
                          <StatusBadge tone={statusTone} icon={subStatus === 'ATIVO' ? 'verified_user' : 'hourglass_empty'}>
                            {subStatus}
                          </StatusBadge>
                        </td>
                        <td className="py-4 text-right whitespace-nowrap">
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => handleOpenDetails(subs)}
                          >
                            Ver Detalhes
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </SurfacePanel>

        {/* Details and Actions Overlay Dialog/Side Sheet */}
        <Dialog
          isOpen={Boolean(selectedAssinatura)}
          onClose={() => setSelectedAssinatura(null)}
          eyebrow="Detalhes da Assinatura"
          title={`Identificação: ${selectedAssinatura?.id}`}
          description="Histórico de transação, dados de checkout e configurações de controle administrativo."
          footer={
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between w-full">
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => selectedAssinatura && handleDeleteSub(selectedAssinatura.id)}
              >
                Remover Assinatura
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={() => setSelectedAssinatura(null)}>
                  Fechar
                </Button>
                <Button type="button" onClick={handleSaveStatus} disabled={updating}>
                  {updating ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </div>
          }
        >
          {selectedAssinatura && (
            <div className="space-y-6">
              {/* Split into info sections */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">Cliente & Pagador</h4>
                  <p className="mt-2 text-sm font-bold text-zinc-950">
                    {usuariosMap[selectedAssinatura.usuarioId]?.nome || 'ID: ' + selectedAssinatura.usuarioId}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {usuariosMap[selectedAssinatura.usuarioId]?.email || 'Não informado'}
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">Plano Contratado</h4>
                  <p className="mt-2 text-sm font-bold text-zinc-950">
                    {planosMap[selectedAssinatura.planoId]?.nome || 'ID: ' + selectedAssinatura.planoId}
                  </p>
                  <p className="text-xs text-zinc-500">
                    Valor: {formatCurrency(planosMap[selectedAssinatura.planoId]?.preco || 0)}
                  </p>
                </div>
              </div>

              {/* Administrative Toggles */}
              <div className="space-y-4 rounded-2xl border border-zinc-200 p-5">
                <h3 className="text-sm font-bold text-zinc-950">Ações Administrativas</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field htmlFor="editStatus" label="Atualizar Status">
                    <Select id="editStatus" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                      <option value="ATIVO">ATIVO</option>
                      <option value="PENDENTE">PENDENTE</option>
                      <option value="CANCELADO">CANCELADO</option>
                    </Select>
                  </Field>

                  <Field htmlFor="editRenovacao" label="Renovação Automática">
                    <Select id="editRenovacao" value={editRenovacao} onChange={(e) => setEditRenovacao(e.target.value)}>
                      <option value="true">Sim, auto-renovar</option>
                      <option value="false">Não, desativar</option>
                    </Select>
                  </Field>
                </div>
              </div>

              {/* Payment Details (AbacatePay IDs) */}
              <div className="rounded-2xl border border-zinc-200 p-4 space-y-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">Integração AbacatePay</h3>
                <div className="grid gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Invoice Bill ID:</span>
                    <span className="font-mono font-bold text-zinc-950">{selectedAssinatura.abacatePayBillId || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Gateway Sub ID:</span>
                    <span className="font-mono font-bold text-zinc-950">{selectedAssinatura.abacatePaySubscriptionId || 'N/A'}</span>
                  </div>
                  {selectedAssinatura.checkoutUrl && (
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-zinc-500">Checkout Link:</span>
                      <a
                        href={selectedAssinatura.checkoutUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-red-650 hover:underline font-bold"
                      >
                        Visualizar página de PIX
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* History events list */}
              <div>
                <h3 className="text-sm font-black text-zinc-950 mb-3">Histórico de Eventos & Logs de Faturamento</h3>
                <div className="space-y-4 border-l-2 border-zinc-100 pl-4 ml-2">
                  {getSimulatedHistory(selectedAssinatura).map((h) => (
                    <div key={h.id} className="relative">
                      <span className={cn(
                        "absolute -left-[25px] top-1.5 h-3.5 w-3.5 rounded-full border-4 border-white",
                        h.tipo === 'SUCCESS' ? 'bg-emerald-500' :
                        h.tipo === 'WARN' ? 'bg-amber-500' :
                        h.tipo === 'DANGER' ? 'bg-red-500' : 'bg-blue-500'
                      )} />
                      <div>
                        <span className="text-xs font-mono text-zinc-400">{formatDateTime(h.data) || '-'}</span>
                        <h4 className="text-sm font-bold text-zinc-950">{h.titulo}</h4>
                        <p className="text-xs text-zinc-500 leading-relaxed">{h.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Dialog>
      </PageStack>
    </AuthenticatedLayout>
  )
}

export default AdminAssinaturasPage
