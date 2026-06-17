import { useEffect, useState, useMemo } from 'react'
import { AuthenticatedLayout } from '../components/layout'
import { Button, Card, Notice, PageStack, SectionHeader, StatusBadge, SurfacePanel, MetricCard } from '../components/ui'
import { getPlanos } from '../services/planoService'
import { getAssinaturas } from '../services/assinaturaService'
import { getAllOficinas } from '../services/oficinaViewService'
import { Link } from 'react-router-dom'
import { createKafkaMonitorStream, getKafkaMonitorEvents, normalizeKafkaEvent } from '../services/kafkaMonitorService'
import { formatDateTime } from '../utils/dateTime'

export function AdminDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [streaming, setStreaming] = useState(false)
  
  const [planos, setPlanos] = useState([])
  const [assinaturas, setAssinaturas] = useState([])
  const [oficinas, setOficinas] = useState([])
  
  const [kafkaEvents, setKafkaLog] = useState([])

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [planosRes, assinaturasRes, oficinasRes] = await Promise.all([
        getPlanos(),
        getAssinaturas(),
        getAllOficinas(),
      ])

      setPlanos(planosRes || [])
      setAssinaturas(assinaturasRes || [])
      setOficinas(oficinasRes || [])

      const kafkaRes = await getKafkaMonitorEvents().catch(() => [])
      setKafkaLog((kafkaRes || []).map(normalizeKafkaEvent).slice(0, 8))
    } catch (err) {
      console.error(err)
      setError('Não foi possível carregar os dados consolidados do dashboard.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const stream = createKafkaMonitorStream()

    stream.onopen = () => setStreaming(true)
    stream.onmessage = (message) => {
      const nextEvent = normalizeKafkaEvent(JSON.parse(message.data))
      setKafkaLog((current) => {
        const withoutDuplicate = current.filter((item) => item.eventId !== nextEvent.eventId)
        return [nextEvent, ...withoutDuplicate].slice(0, 8)
      })
    }
    stream.onerror = () => setStreaming(false)

    return () => stream.close()
  }, [])

  const stats = useMemo(() => {
    const totalOficinas = oficinas.length
    const totalPlanos = planos.length
    const totalAssinaturas = assinaturas.length
    
    // Normalize and count subscription status
    const ativas = assinaturas.filter(a => a.status === 'ATIVO').length
    const pendentes = assinaturas.filter(a => a.status === 'PENDENTE' || a.status === 'PAGAMENTOPENDENTE' || a.status === 'WAITINGPAYMENT').length

    return {
      totalOficinas,
      totalPlanos,
      totalAssinaturas,
      ativas,
      pendentes,
    }
  }, [planos, assinaturas, oficinas])

  return (
    <AuthenticatedLayout showPageHeader eyebrow="Administrador da Plataforma" title="Dashboard Geral" description="Consolide métricas de faturamento, assinaturas e acompanhe eventos do streaming de eventos Kafka em tempo real.">
      <PageStack>
        {error ? <Notice variant="error" title="Erro ao carregar dados" description={error} /> : null}

        {/* Analytics Section */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard eyebrow="Geral" title="Oficinas Cadastradas">
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-black text-zinc-950">{loading ? '...' : stats.totalOficinas}</span>
              <span className="text-xs font-bold text-zinc-500">ativas na base</span>
            </div>
            <Link to="/admin/oficinas" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:underline">
              Gerenciar oficinas <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </MetricCard>

          <MetricCard eyebrow="Geral" title="Total de Planos">
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-black text-zinc-950">{loading ? '...' : stats.totalPlanos}</span>
              <span className="text-xs font-bold text-zinc-500">modelos configurados</span>
            </div>
            <Link to="/admin/planos" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:underline">
              Gerenciar planos <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </MetricCard>

          <MetricCard eyebrow="Monetização" title="Total Assinaturas">
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-black text-zinc-950">{loading ? '...' : stats.totalAssinaturas}</span>
              <span className="text-xs font-bold text-zinc-500">contratos efetuados</span>
            </div>
            <Link to="/admin/assinaturas" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:underline">
              Listar assinaturas <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </MetricCard>

          <MetricCard eyebrow="Faturamento" title="Assinaturas Ativas">
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-black text-emerald-600">{loading ? '...' : stats.ativas}</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Recorrente</span>
            </div>
            <p className="mt-4 text-xs text-zinc-500">Gerando receita direta via gateway</p>
          </MetricCard>

          <MetricCard eyebrow="Operações" title="Assinaturas Pendentes">
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-black text-amber-600">{loading ? '...' : stats.pendentes}</span>
              <span className="text-xs font-bold text-zinc-500">em processamento</span>
            </div>
            <p className="mt-4 text-xs text-zinc-500">Aguardando confirmação bancária</p>
          </MetricCard>
        </div>

        <SurfacePanel>
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-100 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  {streaming ? <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span> : null}
                  <span className={`relative inline-flex h-3 w-3 rounded-full ${streaming ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                </span>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">
                  {streaming ? 'Streaming Kafka conectado' : 'Aguardando stream Kafka'}
                </p>
              </div>
              <h2 className="mt-2 text-2xl font-black text-zinc-950">Últimos eventos reais de mensageria</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={loadData}>
                Recarregar
              </Button>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-zinc-600">
              <thead>
                <tr className="border-b border-zinc-100 text-[11px] font-black uppercase tracking-[0.22em] text-zinc-400">
                  <th className="pb-3 pr-4">Data/Hora</th>
                  <th className="pb-3 pr-4">Evento</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Entidade</th>
                  <th className="pb-3">Resumo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {kafkaEvents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-zinc-400">
                      Nenhum evento registrado no log do Kafka.
                    </td>
                  </tr>
                ) : (
                  kafkaEvents.map((evt) => (
                    <tr key={evt.eventId} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="py-4 pr-4 text-xs font-mono text-zinc-500 whitespace-nowrap">
                        {formatDateTime(evt.dataHora) || '-'}
                      </td>
                      <td className="py-4 pr-4 font-black text-zinc-950">
                        <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold ${
                          evt.tipoEvento === 'assinatura.criada' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {evt.tipoEvento}
                        </span>
                      </td>
                      <td className="py-4 pr-4">
                        <StatusBadge tone={evt.statusProcessamento === 'PROCESSADO' ? 'done' : evt.statusProcessamento === 'FALHOU' ? 'danger' : 'warning'}>
                          {evt.statusLabel}
                        </StatusBadge>
                      </td>
                      <td className="py-4 pr-4 text-xs">
                        <strong className="block text-zinc-800">{evt.entidadeTipo || '-'}</strong>
                        <span className="font-mono text-zinc-400">{evt.entidadeId || evt.assinaturaId || '-'}</span>
                      </td>
                      <td className="py-4 text-xs font-medium text-zinc-700">
                        {evt.mensagemErro || evt.payloadResumo || evt.statusDescription}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-5 border-t border-zinc-100 pt-4 flex justify-between items-center text-xs text-zinc-400">
            <span>Mostrando os últimos eventos gravados em KafkaMonitorEvento.</span>
            <Link to="/admin/kafka" className="font-extrabold text-red-600 hover:underline flex items-center gap-1">
              Ver monitor completo <span className="material-symbols-outlined text-[12px]">open_in_new</span>
            </Link>
          </div>
        </SurfacePanel>
      </PageStack>
    </AuthenticatedLayout>
  )
}

export default AdminDashboardPage
