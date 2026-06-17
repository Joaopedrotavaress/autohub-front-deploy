import { useEffect, useMemo, useState } from 'react'
import { AuthenticatedLayout } from '../components/layout'
import { Button, Card, Notice, PageStack, SectionHeader, StatusBadge, SurfacePanel, cn } from '../components/ui'
import { createKafkaMonitorStream, getKafkaMonitorEvents, normalizeKafkaEvent } from '../services/kafkaMonitorService'
import { formatDateTime } from '../utils/dateTime'

const statusTone = {
  PENDENTE: 'neutral',
  PROCESSANDO: 'warning',
  PROCESSADO: 'done',
  FALHOU: 'danger',
}

export function AdminKafkaPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadInitialEvents() {
      try {
        const data = await getKafkaMonitorEvents()
        if (!cancelled) {
          setEvents((data || []).map(normalizeKafkaEvent))
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Não foi possível carregar o monitor Kafka.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadInitialEvents()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const stream = createKafkaMonitorStream()

    stream.onopen = () => {
      setStreaming(true)
      setError('')
    }

    stream.onmessage = (message) => {
      const nextEvent = normalizeKafkaEvent(JSON.parse(message.data))
      setEvents((current) => {
        const withoutDuplicate = current.filter((item) => item.eventId !== nextEvent.eventId)
        return [nextEvent, ...withoutDuplicate].slice(0, 100)
      })
    }

    stream.onerror = () => {
      setStreaming(false)
      setError('Stream em tempo real desconectado. O navegador tentará reconectar automaticamente.')
    }

    return () => stream.close()
  }, [])

  const counters = useMemo(() => {
    return events.reduce(
      (acc, evt) => {
        acc.total += 1
        if (evt.tipoEvento === 'assinatura.criada') acc.assinaturas += 1
        if (evt.tipoEvento === 'ordem.status_alterado') acc.ordens += 1
        if (evt.statusProcessamento === 'FALHOU') acc.falhas += 1
        return acc
      },
      { total: 0, assinaturas: 0, ordens: 0, falhas: 0 }
    )
  }, [events])

  return (
    <AuthenticatedLayout>
      <PageStack>
        <SectionHeader
          eyebrow="Mensageria em tempo real"
          title="Monitor Kafka AutoHub"
          description="Eventos processados pelo consumer Kafka e enviados ao front via SSE, sem refresh."
          actions={
            <Button type="button" variant="secondary" onClick={() => setEvents([])}>
              Limpar tela
            </Button>
          }
        />

        <div className={cn(
          'flex w-fit items-center gap-2 rounded-2xl px-4 py-2 text-xs font-black uppercase tracking-[0.18em]',
          streaming ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
        )}>
          <span className={cn('h-2 w-2 rounded-full', streaming ? 'animate-pulse bg-emerald-500' : 'bg-amber-500')} />
          {streaming ? 'Stream SSE conectado' : 'Aguardando reconexão do stream'}
        </div>

        {error ? <Notice title="Aviso do monitor" description={error} /> : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-zinc-500 p-4">
            <p className="text-xs font-black uppercase tracking-wider text-zinc-500">Eventos</p>
            <strong className="mt-2 block text-2xl font-black text-zinc-950">{counters.total}</strong>
          </Card>
          <Card className="border-l-4 border-l-blue-500 p-4">
            <p className="text-xs font-black uppercase tracking-wider text-zinc-500">Assinaturas</p>
            <strong className="mt-2 block text-2xl font-black text-zinc-950">{counters.assinaturas}</strong>
          </Card>
          <Card className="border-l-4 border-l-amber-500 p-4">
            <p className="text-xs font-black uppercase tracking-wider text-zinc-500">Ordens</p>
            <strong className="mt-2 block text-2xl font-black text-zinc-950">{counters.ordens}</strong>
          </Card>
          <Card className="border-l-4 border-l-red-500 p-4">
            <p className="text-xs font-black uppercase tracking-wider text-zinc-500">Falhas</p>
            <strong className="mt-2 block text-2xl font-black text-zinc-950">{counters.falhas}</strong>
          </Card>
        </div>

        <SurfacePanel>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-zinc-600">
              <thead>
                <tr className="border-b border-zinc-100 text-[11px] font-black uppercase tracking-[0.22em] text-zinc-400">
                  <th className="pb-3 pr-4">Data/Hora</th>
                  <th className="pb-3 pr-4">Tipo</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Entidade</th>
                  <th className="pb-3 pr-4">Payload resumido</th>
                  <th className="pb-3">Erro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-400">Carregando monitor Kafka...</td>
                  </tr>
                ) : events.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-400">Nenhum evento Kafka processado ainda.</td>
                  </tr>
                ) : (
                  events.map((evt) => (
                    <tr key={evt.eventId} className="transition-colors hover:bg-zinc-50/60">
                      <td className="whitespace-nowrap py-4 pr-4 font-mono text-xs text-zinc-500">
                        {formatDateTime(evt.dataHora, { dateStyle: 'short', timeStyle: 'medium' }) || '-'}
                      </td>
                      <td className="py-4 pr-4">
                        <span className="inline-flex rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 font-mono text-xs font-bold text-zinc-800">
                          {evt.tipoEvento}
                        </span>
                      </td>
                      <td className="py-4 pr-4">
                        <StatusBadge tone={statusTone[evt.statusProcessamento] || 'neutral'} icon="settings_ethernet">
                          {evt.statusLabel}
                        </StatusBadge>
                        <p className="mt-1 max-w-[12rem] text-[11px] font-medium leading-snug text-zinc-400">
                          {evt.statusDescription}
                        </p>
                      </td>
                      <td className="py-4 pr-4 text-xs">
                        <strong className="block text-zinc-800">{evt.entidadeTipo || '-'}</strong>
                        <span className="font-mono text-zinc-400">{evt.entidadeId || evt.assinaturaId || '-'}</span>
                      </td>
                      <td className="max-w-lg py-4 pr-4 text-xs font-medium text-zinc-700">
                        {evt.payloadResumo || `Evento v${evt.version} no tópico ${evt.topic}`}
                      </td>
                      <td className="py-4 text-xs font-semibold text-red-600">{evt.mensagemErro || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </SurfacePanel>
      </PageStack>
    </AuthenticatedLayout>
  )
}

export default AdminKafkaPage
