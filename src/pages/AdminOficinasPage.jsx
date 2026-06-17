import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AuthenticatedLayout } from '../components/layout'
import { Button, Card, Dialog, Field, Notice, PageStack, SectionHeader, StatusBadge, SurfacePanel, cn } from '../components/ui'
import { useToast } from '../context/ToastContext'
import { getAllOficinas, deleteOficina } from '../services/oficinaViewService'
import { getAssinaturas } from '../services/assinaturaService'
import { getPlanos } from '../services/planoService'
import { getAllUsuarios } from '../services/usuarioService'

export function AdminOficinasPage() {
  const toast = useToast()
  const [oficinas, setOficinas] = useState([])
  const [assinaturas, setAssinaturas] = useState([])
  const [planos, setPlanos] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Search
  const [search, setSearch] = useState('')

  // Details dialog state
  const [selectedOficina, setSelectedOficina] = useState(null)

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [oficinasRes, subsResponse, plansResponse] = await Promise.all([
        getAllOficinas(),
        getAssinaturas().catch(() => []),
        getPlanos().catch(() => []),
      ])

      let usersResponse = []
      try {
        usersResponse = await getAllUsuarios()
      } catch (err) {
        console.warn('Failed to retrieve all users.', err)
      }

      setOficinas(oficinasRes)
      setAssinaturas(subsResponse)
      setPlanos(plansResponse)
      setUsuarios(usersResponse)
    } catch (err) {
      setError(err.message || 'Erro ao carregar dados das oficinas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Maps & Relations
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

  // Map Owner/User ID to their active subscription and plan
  const userSubscriptionMap = useMemo(() => {
    return assinaturas.reduce((acc, sub) => {
      const uId = String(sub.usuarioId).trim()
      // If there are multiple subscriptions, pick the active one or the most recent
      const existing = acc[uId]
      if (!existing || sub.status === 'ATIVO' || sub.status === 'PAGO') {
        acc[uId] = sub
      }
      return acc
    }, {})
  }, [assinaturas])

  // Filtered list
  const filteredOficinas = useMemo(() => {
    return oficinas.filter((oficina) => {
      const ownerId = String(oficina.usuarioId || oficina.idUsuario || '').trim()
      const owner = usuariosMap[ownerId]

      const text = `${oficina.nome || ''} ${oficina.cnpj || ''} ${oficina.endereco || ''}`.toLowerCase()
      const ownerText = owner ? `${owner.nome} ${owner.email}`.toLowerCase() : ''
      const query = search.toLowerCase()

      return text.includes(query) || ownerText.includes(query)
    })
  }, [oficinas, search, usuariosMap])

  const handleDeleteOficina = async (oficina) => {
    if (!window.confirm(`Tem certeza que deseja excluir permanentemente a oficina "${oficina.nome}"? Esta ação removerá o estabelecimento do AutoHub.`)) {
      return
    }

    try {
      await deleteOficina(oficina.id)
      toast.success('Oficina excluída com sucesso.')
      setSelectedOficina(null)
      loadData()
    } catch (err) {
      toast.error(err.message || 'Não foi possível excluir a oficina.')
    }
  }

  return (
    <AuthenticatedLayout>
      <PageStack>
        <SectionHeader
          eyebrow="Gerenciamento de Oficinas"
          title="Oficinas Cadastradas na Plataforma"
          description="Monitore os estabelecimentos parceiros do AutoHub, verifique o CNPJ, faça a auditoria cadastral e acompanhe o plano contratado."
          actions={
            <Button type="button" variant="secondary" onClick={loadData} disabled={loading}>
              Atualizar dados
            </Button>
          }
        />

        {error ? <Notice variant="error" title="Erro de carregamento" description={error} /> : null}

        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Buscar por nome da oficina, CNPJ ou proprietário..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950"
            />
          </div>
        </div>

        <SurfacePanel>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-zinc-950">Estabelecimentos Credenciados</h2>
            <StatusBadge tone="neutral" icon="store">
              {filteredOficinas.length} oficina(s)
            </StatusBadge>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-zinc-600">
              <thead>
                <tr className="border-b border-zinc-100 text-[11px] font-black uppercase tracking-[0.22em] text-zinc-400">
                  <th className="pb-3 pr-4">Nome & Endereço</th>
                  <th className="pb-3 pr-4">CNPJ</th>
                  <th className="pb-3 pr-4">Celular</th>
                  <th className="pb-3 pr-4">Proprietário</th>
                  <th className="pb-3 pr-4">Plano Atual</th>
                  <th className="pb-3 pr-4">Status do Plano</th>
                  <th className="pb-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-zinc-400">
                      Carregando estabelecimentos...
                    </td>
                  </tr>
                ) : filteredOficinas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-zinc-400">
                      Nenhuma oficina encontrada.
                    </td>
                  </tr>
                ) : (
                  filteredOficinas.map((oficina) => {
                    const ownerId = String(oficina.usuarioId || oficina.idUsuario || '').trim()
                    const owner = usuariosMap[ownerId]
                    const subscription = userSubscriptionMap[ownerId]
                    const currentPlano = subscription ? planosMap[subscription.planoId] : null

                    const subStatus = subscription ? subscription.status : 'SEM ASSINATURA'
                    const statusTone =
                      subStatus === 'ATIVO' || subStatus === 'PAGO' ? 'done' :
                      subStatus === 'PENDENTE' ? 'warning' : 'neutral'

                    return (
                      <tr key={oficina.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="py-4 pr-4">
                          <div className="font-bold text-zinc-950">{oficina.nome || 'Oficina sem nome'}</div>
                          <div className="text-xs text-zinc-400 max-w-xs truncate">{oficina.endereco || 'Endereço não cadastrado'}</div>
                        </td>
                        <td className="py-4 pr-4 font-mono text-xs text-zinc-700">{oficina.cnpj || 'N/A'}</td>
                        <td className="py-4 pr-4 text-zinc-700">{oficina.telefone || 'N/A'}</td>
                        <td className="py-4 pr-4">
                          <div className="font-semibold text-zinc-900">{owner?.nome || 'Id: ' + ownerId.substring(0,8)}</div>
                          <div className="text-xs text-zinc-400">{owner?.email || 'N/A'}</div>
                        </td>
                        <td className="py-4 pr-4">
                          {currentPlano ? (
                            <span className="font-semibold text-zinc-950">{currentPlano.nome}</span>
                          ) : (
                            <span className="text-zinc-400">Nenhum plano</span>
                          )}
                        </td>
                        <td className="py-4 pr-4">
                          {subscription ? (
                            <Link
                              to="/admin/assinaturas"
                              className="group inline-flex items-center gap-1.5 focus:outline-none"
                              title="Visualizar faturamento e detalhes da assinatura"
                            >
                              <StatusBadge tone={statusTone} icon="credit_card">
                                {subStatus}
                              </StatusBadge>
                              <span className="material-symbols-rounded text-sm text-zinc-400 group-hover:text-zinc-900 transition-colors">
                                open_in_new
                              </span>
                            </Link>
                          ) : (
                            <StatusBadge tone="neutral" icon="cancel">
                              {subStatus}
                            </StatusBadge>
                          )}
                        </td>
                        <td className="py-4 text-right whitespace-nowrap">
                          <div className="inline-flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => setSelectedOficina(oficina)}
                            >
                              Detalhar
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="danger"
                              onClick={() => handleDeleteOficina(oficina)}
                            >
                              Excluir
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </SurfacePanel>

        {/* Details Dialog */}
        <Dialog
          isOpen={Boolean(selectedOficina)}
          onClose={() => setSelectedOficina(null)}
          eyebrow="Ficha de Auditoria"
          title={selectedOficina?.nome || 'Detalhes da Oficina'}
          description="Ficha cadastral completa do estabelecimento com coordenadas georreferenciadas."
          footer={
            <div className="flex justify-between w-full">
              <Button type="button" variant="danger" size="sm" onClick={() => selectedOficina && handleDeleteOficina(selectedOficina)}>
                Excluir Oficina
              </Button>
              <Button type="button" onClick={() => setSelectedOficina(null)}>
                Fechar Auditoria
              </Button>
            </div>
          }
        >
          {selectedOficina && (
            <div className="space-y-6">
              {selectedOficina.imagemUrl && (
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-zinc-100 bg-zinc-50">
                  <img
                    src={selectedOficina.imagemUrl}
                    alt={selectedOficina.nome}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">Descrição Comercial</h4>
                  <p className="mt-1 text-sm text-zinc-700 leading-relaxed">
                    {selectedOficina.descricao || 'Nenhuma descrição detalhada informada.'}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-zinc-50 p-4 border border-zinc-100">
                    <span className="block text-xs font-black uppercase tracking-wider text-zinc-400">CNPJ</span>
                    <strong className="mt-1 block text-sm text-zinc-950 font-mono">{selectedOficina.cnpj || 'Não informado'}</strong>
                  </div>

                  <div className="rounded-2xl bg-zinc-50 p-4 border border-zinc-100">
                    <span className="block text-xs font-black uppercase tracking-wider text-zinc-400">Celular</span>
                    <strong className="mt-1 block text-sm text-zinc-950">{selectedOficina.telefone || 'Não informado'}</strong>
                  </div>

                  <div className="rounded-2xl bg-zinc-50 p-4 border border-zinc-100">
                    <span className="block text-xs font-black uppercase tracking-wider text-zinc-400">ID Único (Database)</span>
                    <strong className="mt-1 block text-sm text-zinc-950 font-mono text-xs truncate">{selectedOficina.id}</strong>
                  </div>
                </div>

                <div className="rounded-2xl bg-zinc-50 p-4 border border-zinc-100 space-y-2">
                  <span className="block text-xs font-black uppercase tracking-wider text-zinc-400">Dados de Geolocalização</span>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Endereço:</span>
                      <span className="font-semibold text-zinc-950 text-right">{selectedOficina.endereco || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Latitude:</span>
                      <span className="font-mono text-zinc-950">{selectedOficina.latitude ?? 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Longitude:</span>
                      <span className="font-mono text-zinc-950">{selectedOficina.longitude ?? 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Dialog>
      </PageStack>
    </AuthenticatedLayout>
  )
}

export default AdminOficinasPage
