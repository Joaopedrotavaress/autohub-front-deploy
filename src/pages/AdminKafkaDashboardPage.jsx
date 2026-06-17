import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AuthenticatedLayout } from '../components/layout'
import { Button, MetricCard, Notice, PageStack, SectionHeader, StatusBadge, SurfacePanel } from '../components/ui'
import {
  getKafkaDashboardFailures,
  getKafkaDashboardSummary,
  getKafkaDashboardTimeseries,
} from '../services/kafkaDashboardService'
import { formatDateTime } from '../utils/dateTime'

const DASHBOARD_POLLING_MS = 5000
const TIMESERIES_MINUTES = 1
const TIMESERIES_BUCKET_SECONDS = 1
const TIMESERIES_WINDOW_MS = TIMESERIES_MINUTES * 60 * 1000
const TIMESERIES_BUCKET_MS = TIMESERIES_BUCKET_SECONDS * 1000
const MAX_CLOCK_DRIFT_MS = 10 * 1000

function formatNumber(value) {
  return new Intl.NumberFormat('pt-BR').format(Number(value || 0))
}

function formatLatency(value) {
  const latency = Number(value || 0)
  if (latency >= 1000) return `${(latency / 1000).toFixed(1)}s`
  return `${Math.round(latency)}ms`
}

function formatLastUpdated(value) {
  if (!value) return 'Aguardando primeira atualizacao'
  return `Ultima atualizacao: ${value.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
}

function pickValue(source, keys, fallback = undefined) {
  for (const key of keys) {
    if (source?.[key] !== undefined && source?.[key] !== null) {
      return source[key]
    }
  }

  return fallback
}

function pickNumber(source, keys, fallback = 0) {
  const value = pickValue(source, keys, fallback)
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : fallback
}

function roundDownToBucket(date, bucketSeconds) {
  const bucketMs = bucketSeconds * 1000
  return new Date(Math.floor(date.getTime() / bucketMs) * bucketMs)
}

function getPointTimestamp(point) {
  return pickValue(point, [
    'timestamp',
    'Timestamp',
    'bucket',
    'Bucket',
    'dataHora',
    'DataHora',
  ])
}

function getPointDate(point) {
  const timestamp = getPointTimestamp(point)
  const date = timestamp ? new Date(timestamp) : null

  return date && !Number.isNaN(date.getTime()) ? date : null
}

function normalizeTimeseriesPoint(point) {
  const date = getPointDate(point)
  if (!date) return null

  const bucketDate = roundDownToBucket(date, TIMESERIES_BUCKET_SECONDS)
  const bucketSeconds = pickNumber(point, ['bucketSeconds', 'BucketSeconds'], TIMESERIES_BUCKET_SECONDS)
  const total = pickNumber(point, ['total', 'Total', 'count', 'Count'])
  const totalPerSecond = pickNumber(
    point,
    ['totalPerSecond', 'TotalPerSecond', 'eventsPerSecond', 'EventsPerSecond', 'eventosPorSegundo', 'EventosPorSegundo', 'valor', 'Valor', 'value', 'Value'],
    bucketSeconds > 0 ? total / bucketSeconds : 0,
  )

  return {
    timestamp: bucketDate.toISOString(),
    bucketSeconds,
    total,
    totalPerSecond,
    assinaturaCriadaPerSecond: pickNumber(point, ['assinaturaCriadaPerSecond', 'AssinaturaCriadaPerSecond']),
    ordemStatusAlteradoPerSecond: pickNumber(point, ['ordemStatusAlteradoPerSecond', 'OrdemStatusAlteradoPerSecond']),
    outrosEventosPerSecond: pickNumber(point, ['outrosEventosPerSecond', 'OutrosEventosPerSecond']),
    processed: pickNumber(point, ['processed', 'Processed']),
    failed: pickNumber(point, ['failed', 'Failed']),
    pending: pickNumber(point, ['pending', 'Pending']),
  }
}

function getLatestBucketTime(points) {
  return points.reduce((latest, point) => {
    const date = getPointDate(point)
    return date ? Math.max(latest, date.getTime()) : latest
  }, 0)
}

function formatChartTime(date) {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function AdminKafkaDashboardPage() {
  const [summary, setSummary] = useState(null)
  const [timeseries, setTimeseries] = useState([])
  const [failures, setFailures] = useState({ consumerFailures: [], outboxFailures: [] })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null)
  const [chartNow, setChartNow] = useState(() => new Date())
  const requestInFlightRef = useRef(false)
  const mountedRef = useRef(false)

  const loadDashboard = useCallback(async ({ silent = false } = {}) => {
    if (requestInFlightRef.current) return

    requestInFlightRef.current = true
    if (silent) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const [summaryData, timeseriesData, failuresData] = await Promise.all([
        getKafkaDashboardSummary(),
        getKafkaDashboardTimeseries({ minutes: TIMESERIES_MINUTES, bucketSeconds: TIMESERIES_BUCKET_SECONDS }),
        getKafkaDashboardFailures(),
      ])

      if (!mountedRef.current) return

      setSummary(summaryData || {})
      setTimeseries((previous) => {
        const previousPoints = (previous || []).map(normalizeTimeseriesPoint).filter(Boolean)
        const incomingPoints = (Array.isArray(timeseriesData) ? timeseriesData : [])
          .map(normalizeTimeseriesPoint)
          .filter(Boolean)
        const latestKnownTime = Math.max(
          roundDownToBucket(new Date(), TIMESERIES_BUCKET_SECONDS).getTime(),
          getLatestBucketTime(previousPoints),
          getLatestBucketTime(incomingPoints),
        )
        const from = latestKnownTime - TIMESERIES_WINDOW_MS - TIMESERIES_BUCKET_MS
        const futureLimit = latestKnownTime + MAX_CLOCK_DRIFT_MS
        const merged = new Map()

        ;[...previousPoints, ...incomingPoints].forEach((point) => {
          const date = getPointDate(point)
          const pointTime = date?.getTime() || 0

          if (!date || pointTime < from || pointTime > futureLimit) {
            return
          }

          merged.set(pointTime, point)
        })

        return Array.from(merged.values()).sort(
          (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
        )
      })
      setFailures(failuresData || { consumerFailures: [], outboxFailures: [] })
      setLastUpdatedAt(new Date())
      setError('')
    } catch (err) {
      if (!mountedRef.current) return
      setError(err.message || 'Nao foi possivel carregar o dashboard Kafka.')
    } finally {
      requestInFlightRef.current = false
      if (mountedRef.current) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true

    loadDashboard()
    const pollingIntervalId = window.setInterval(() => {
      loadDashboard({ silent: true })
    }, DASHBOARD_POLLING_MS)
    const chartIntervalId = window.setInterval(() => {
      setChartNow(new Date())
    }, 1000)

    return () => {
      mountedRef.current = false
      window.clearInterval(pollingIntervalId)
      window.clearInterval(chartIntervalId)
    }
  }, [loadDashboard])

  const chartData = useMemo(() => {
    const normalizedTimeseries = (timeseries || []).map(normalizeTimeseriesPoint).filter(Boolean)
    const latestDataTime = getLatestBucketTime(normalizedTimeseries)
    const now = new Date(Math.max(
      roundDownToBucket(chartNow, TIMESERIES_BUCKET_SECONDS).getTime(),
      latestDataTime,
    ))
    const from = new Date(now.getTime() - TIMESERIES_WINDOW_MS)
    const buckets = new Map()

    for (
      let current = new Date(from);
      current <= now;
      current = new Date(current.getTime() + TIMESERIES_BUCKET_SECONDS * 1000)
    ) {
      buckets.set(current.getTime(), {
        timestamp: current.toISOString(),
        label: formatChartTime(current),
        totalPerSecond: 0,
        assinaturaCriadaPerSecond: 0,
        ordemStatusAlteradoPerSecond: 0,
        outrosEventosPerSecond: 0,
        total: 0,
        processed: 0,
        failed: 0,
        pending: 0,
      })
    }

    normalizedTimeseries.forEach((point) => {
      const date = getPointDate(point)

      if (!date || Number.isNaN(date.getTime()) || date < from || date > now) {
        return
      }

      const bucketDate = roundDownToBucket(date, TIMESERIES_BUCKET_SECONDS)
      const existingBucket = buckets.get(bucketDate.getTime())

      if (existingBucket) {
        buckets.set(bucketDate.getTime(), {
          ...existingBucket,
          timestamp: bucketDate.toISOString(),
          label: formatChartTime(bucketDate),
          totalPerSecond: point.totalPerSecond,
          assinaturaCriadaPerSecond: point.assinaturaCriadaPerSecond,
          ordemStatusAlteradoPerSecond: point.ordemStatusAlteradoPerSecond,
          outrosEventosPerSecond: point.outrosEventosPerSecond,
          total: point.total,
          processed: point.processed,
          failed: point.failed,
          pending: point.pending,
        })
      }
    })

    return Array.from(buckets.values())
  }, [chartNow, timeseries])

  const allFailures = useMemo(() => {
    const consumerFailures = failures.consumerFailures || failures.ConsumerFailures || []
    const outboxFailures = failures.outboxFailures || failures.OutboxFailures || []

    return [...consumerFailures, ...outboxFailures]
      .sort((a, b) => new Date(b.lastAttemptAt || b.LastAttemptAt || b.occurredAt || b.OccurredAt) - new Date(a.lastAttemptAt || a.LastAttemptAt || a.occurredAt || a.OccurredAt))
      .slice(0, 12)
  }, [failures])

  const processedRate = summary?.totalEvents
    ? Math.round((summary.processedEvents / summary.totalEvents) * 100)
    : 0
  const hasChartWindow = chartData.length > 0
  const chartTicks = useMemo(() => {
    return chartData
      .filter((_, index) => index % 10 === 0 || index === chartData.length - 1)
      .map((point) => point.label)
  }, [chartData])

  return (
    <AuthenticatedLayout>
      <PageStack>
        <SectionHeader
          eyebrow="Observabilidade Kafka"
          title="Dashboard Kafka"
          description="KPIs de negocio do AutoHub em tempo real, alimentados pelos eventos gravados pela API."
          actions={
            <div className="flex flex-wrap gap-2">
              <Link to="/admin/kafka">
                <Button type="button" variant="secondary">
                  Monitor SSE
                </Button>
              </Link>
              <Button type="button" onClick={loadDashboard}>
                {refreshing ? 'Atualizando...' : 'Atualizar'}
              </Button>
            </div>
          }
        />

        <p className="text-right text-xs font-semibold text-zinc-400">{formatLastUpdated(lastUpdatedAt)}</p>

        {error ? <Notice variant="error" title="Erro ao carregar dashboard" description={error} /> : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard eyebrow="Eventos" title="Total monitorado">
            <span className="mt-4 block text-4xl font-black text-zinc-950">
              {loading ? '...' : formatNumber(summary?.totalEvents)}
            </span>
            <p className="mt-3 text-xs font-semibold text-zinc-500">Registros em KafkaMonitorEventos.</p>
          </MetricCard>

          <MetricCard eyebrow="Saude" title="Processados">
            <span className="mt-4 block text-4xl font-black text-emerald-600">
              {loading ? '...' : `${processedRate}%`}
            </span>
            <p className="mt-3 text-xs font-semibold text-zinc-500">
              {formatNumber(summary?.processedEvents)} eventos concluidos.
            </p>
          </MetricCard>

          <MetricCard eyebrow="Falhas" title="Ultimas 24h">
            <span className="mt-4 block text-4xl font-black text-red-600">
              {loading ? '...' : formatNumber(summary?.failuresLast24h)}
            </span>
            <p className="mt-3 text-xs font-semibold text-zinc-500">
              {formatNumber(summary?.failedEvents)} falhas historicas.
            </p>
          </MetricCard>

          <MetricCard eyebrow="Outbox" title="Pendencias">
            <span className="mt-4 block text-4xl font-black text-amber-600">
              {loading ? '...' : formatNumber(summary?.outboxPending)}
            </span>
            <p className="mt-3 text-xs font-semibold text-zinc-500">
              {formatNumber(summary?.outboxFailed)} mensagens com erro.
            </p>
          </MetricCard>

          <MetricCard eyebrow="Tempo medio" title="Processamento">
            <span className="mt-4 block text-4xl font-black text-zinc-950">
              {loading ? '...' : formatLatency(summary?.avgProcessingMs)}
            </span>
            <p className="mt-3 text-xs font-semibold text-zinc-500">
              Ultimo evento: {formatDateTime(summary?.lastEventAt) || '-'}
            </p>
          </MetricCard>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
          <SurfacePanel>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-5">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-400">Negocio</p>
                <h2 className="mt-1 text-2xl font-black text-zinc-950">Eventos por segundo</h2>
                <p className="mt-1 text-xs font-semibold text-zinc-500">
                  Janela do ultimo minuto, buckets de {TIMESERIES_BUCKET_SECONDS}s.
                </p>
              </div>
              <StatusBadge tone={summary?.failedEvents ? 'warning' : 'done'}>
                {summary?.failedEvents ? 'Com falhas registradas' : 'Sem falhas'}
              </StatusBadge>
            </div>

            <div className="mt-6 h-80">
              {hasChartWindow ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="totalEpsFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="assinaturaFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#059669" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="ordemFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                    <XAxis
                      dataKey="label"
                      ticks={chartTicks}
                      interval={0}
                      minTickGap={28}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: '#71717a' }}
                    />
                    <YAxis domain={[0, 'auto']} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#71717a' }} />
                    <Tooltip formatter={(value) => [`${Number(value || 0).toFixed(3)} eventos/s`, undefined]} />
                    <Area type="stepAfter" dataKey="totalPerSecond" name="Total" stroke="#2563eb" fill="url(#totalEpsFill)" strokeWidth={2} />
                    <Area type="stepAfter" dataKey="assinaturaCriadaPerSecond" name="assinatura.criada" stroke="#059669" fill="url(#assinaturaFill)" strokeWidth={2} />
                    <Area type="stepAfter" dataKey="ordemStatusAlteradoPerSecond" name="ordem.status_alterado" stroke="#f59e0b" fill="url(#ordemFill)" strokeWidth={2} />
                    <Area type="stepAfter" dataKey="outrosEventosPerSecond" name="outros" stroke="#71717a" fill="transparent" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-6 text-center">
                  <p className="text-sm font-semibold text-zinc-500">
                    Ainda nao ha eventos Kafka recentes para calcular eventos por segundo.
                  </p>
                </div>
              )}
            </div>
          </SurfacePanel>

          <SurfacePanel>
            <div className="border-b border-zinc-100 pb-5">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-400">Operacao</p>
              <h2 className="mt-1 text-2xl font-black text-zinc-950">Falhas recentes</h2>
            </div>

            <div className="mt-4 divide-y divide-zinc-100">
              {allFailures.length === 0 ? (
                <p className="py-8 text-center text-sm font-semibold text-zinc-400">Nenhuma falha recente encontrada.</p>
              ) : allFailures.map((failure) => (
                <div key={`${failure.source || failure.Source}-${failure.eventId || failure.EventId}`} className="py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge tone={(failure.source || failure.Source) === 'outbox' ? 'warning' : 'danger'}>
                      {failure.source || failure.Source}
                    </StatusBadge>
                    <span className="font-mono text-xs font-bold text-zinc-500">{failure.topic || failure.Topic}</span>
                  </div>
                  <strong className="mt-2 block text-sm text-zinc-950">{failure.eventType || failure.EventType}</strong>
                  <p className="mt-1 line-clamp-2 text-xs font-medium text-zinc-500">{failure.error || failure.Error || 'Erro sem mensagem detalhada.'}</p>
                </div>
              ))}
            </div>
          </SurfacePanel>
        </div>

      </PageStack>
    </AuthenticatedLayout>
  )
}

export default AdminKafkaDashboardPage
