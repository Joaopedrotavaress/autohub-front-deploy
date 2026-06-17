import { useEffect, useMemo, useState } from 'react'
import { AuthenticatedLayout } from '../components/layout'
import { Button, Card, Notice, PageStack, SectionHeader, StatusBadge, cn, getButtonClasses } from '../components/ui'
import { useAppContext } from '../context/AppContext'
import { createAssinatura, getAssinaturas } from '../services/assinaturaService'
import { getPlanos } from '../services/planoService'
import { formatCurrency, formatDateTime, getSubscriptionStatusConfig, isPremiumPlan } from '../utils/billing'

function friendlyContractError(message) {
  const normalizedMessage = String(message || '').toLowerCase()

  if (normalizedMessage.includes('assinatura ativa')) {
    return 'Você já possui uma assinatura ativa para este plano.'
  }

  if (normalizedMessage.includes('produto cadastrado') || normalizedMessage.includes('produto no abacatepay')) {
    return 'Este plano ainda não pode ser contratado porque não possui produto vinculado no AbacatePay.'
  }

  if (normalizedMessage.includes('checkout') || normalizedMessage.includes('checkouturl')) {
    return 'A assinatura foi criada, mas o checkout de pagamento não foi retornado pelo servidor.'
  }

  return message || 'Não foi possível contratar o plano.'
}

export function MeuPlanoPage() {
  const { user } = useAppContext()
  const [planos, setPlanos] = useState([])
  const [assinaturas, setAssinaturas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [contractingPlanId, setContractingPlanId] = useState('')

  const userId = String(user?.id || '').trim()

  const planosById = useMemo(() => new Map(planos.map((plano) => [plano.id, plano])), [planos])

  const minhasAssinaturas = useMemo(() => {
    return assinaturas
      .filter((assinatura) => assinatura.usuarioId === userId)
      .sort((left, right) => {
        const priority = { ATIVA: 0, PENDENTE: 1, INADIMPLENTE: 2, EXPIRADA: 3, CANCELADA: 4 }
        return (priority[left.status] ?? 99) - (priority[right.status] ?? 99)
      })
  }, [assinaturas, userId])

  const activeSubscription = minhasAssinaturas.find((assinatura) => assinatura.status === 'ATIVA') || null

  const loadPage = async () => {
    setLoading(true)
    setError('')

    try {
      const [planosResponse, assinaturasResponse] = await Promise.all([getPlanos(), getAssinaturas()])
      setPlanos(planosResponse)
      setAssinaturas(assinaturasResponse)
    } catch (requestError) {
      setError(requestError.message || 'Não foi possível carregar os dados do plano.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPage()
  }, [])

  const handleContractPlan = async (plano) => {
    if (!userId) {
      setError('Não foi possível identificar o usuário logado.')
      return
    }

    if (!plano?.abacatePayProductId) {
      setError('Este plano ainda não possui produto cadastrado no AbacatePay.')
      return
    }

    setContractingPlanId(plano.id)
    setError('')

    try {
      const response = await createAssinatura({
        usuarioId: userId,
        planoId: plano.id,
        status: 'PENDENTE',
        renovacaoAutomatica: true,
      })

      const checkoutUrl = response.checkoutUrl || response.assinatura?.checkoutUrl

      if (!checkoutUrl) {
        throw new Error('checkoutUrl ausente na resposta da assinatura.')
      }

      window.location.assign(checkoutUrl)
    } catch (requestError) {
      setError(friendlyContractError(requestError.message || 'Não foi possível contratar o plano.'))
    } finally {
      setContractingPlanId('')
    }
  }

  return (
    <AuthenticatedLayout>
      <PageStack>
        <SectionHeader
          eyebrow="Meu plano"
          title="Assinatura e contratação"
          description="Veja seu plano atual, acompanhe o status da assinatura e contrate uma nova opção quando necessário."
        />

        <Notice variant="info" title="Como funciona">
          Depois da contratação, sua assinatura fica <strong>PENDENTE</strong> até a confirmação do pagamento pelo AbacatePay.
        </Notice>

        {error ? <Notice variant="error" title="Não foi possível concluir a ação" description={error} /> : null}
        {loading ? <Notice variant="neutral" title="Carregando informações" description="Buscando planos e assinaturas do usuário logado." /> : null}

        {!loading && minhasAssinaturas.length === 0 ? (
          <Notice variant="neutral" title="Você ainda não possui plano ativo" description="Escolha um dos planos disponíveis abaixo para iniciar sua assinatura." />
        ) : null}

        {!loading && minhasAssinaturas.length > 0 ? (
          <div className="grid gap-5">
            <SectionHeader
              eyebrow="Assinaturas registradas"
              title="Seu histórico de assinatura"
              description="Acompanhe o status atual e as datas mais importantes de cada assinatura encontrada para este usuário."
            />

            <div className="grid gap-4 lg:grid-cols-2">
              {minhasAssinaturas.map((assinatura) => {
                const plano = planosById.get(assinatura.planoId)
                const statusInfo = getSubscriptionStatusConfig(assinatura.status)
                const isPendingWithCheckout = assinatura.status === 'PENDENTE' && assinatura.checkoutUrl

                return (
                  <Card key={assinatura.id} className={cn('p-6', assinatura.status === 'ATIVA' ? 'border-emerald-200 bg-emerald-50/40' : '')}>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">{plano?.tipo || 'Assinatura'}</p>
                        <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-950">{plano?.nome || 'Plano vinculado não encontrado'}</h2>
                      </div>
                      <StatusBadge tone={statusInfo.tone} icon={statusInfo.icon}>{statusInfo.label}</StatusBadge>
                    </div>

                    {plano?.descricao ? <p className="mt-4 text-sm leading-relaxed text-zinc-600">{plano.descricao}</p> : null}

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-white px-4 py-3">
                        <span className="block text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">Preço</span>
                        <strong className="mt-1 block text-lg font-black text-zinc-950">{plano ? formatCurrency(plano.preco) : 'Não informado'}</strong>
                      </div>
                      <div className="rounded-2xl bg-white px-4 py-3">
                        <span className="block text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">Duração</span>
                        <strong className="mt-1 block text-lg font-black text-zinc-950">{plano ? `${plano.duracaoDias || 0} dias` : 'Não informada'}</strong>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl border border-zinc-200 bg-white/80 px-4 py-3">
                        <span className="block text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">Início</span>
                        <strong className="mt-1 block text-sm font-black text-zinc-950">{formatDateTime(assinatura.dataInicio) || 'Não informado'}</strong>
                      </div>
                      <div className="rounded-2xl border border-zinc-200 bg-white/80 px-4 py-3">
                        <span className="block text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">Fim</span>
                        <strong className="mt-1 block text-sm font-black text-zinc-950">{formatDateTime(assinatura.dataFim) || 'Não informado'}</strong>
                      </div>
                      <div className="rounded-2xl border border-zinc-200 bg-white/80 px-4 py-3">
                        <span className="block text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">Renovação</span>
                        <strong className="mt-1 block text-sm font-black text-zinc-950">{formatDateTime(assinatura.dataRenovacao) || 'Sem renovação automática'}</strong>
                      </div>
                      <div className="rounded-2xl border border-zinc-200 bg-white/80 px-4 py-3">
                        <span className="block text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">Último pagamento</span>
                        <strong className="mt-1 block text-sm font-black text-zinc-950">{formatDateTime(assinatura.ultimoPagamentoEm) || 'Aguardando pagamento'}</strong>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <span className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-700">
                        Renovação automática: {assinatura.renovacaoAutomatica ? 'Sim' : 'Não'}
                      </span>
                      {isPendingWithCheckout ? (
                        <a className={getButtonClasses({ variant: 'secondary', size: 'sm' })} href={assinatura.checkoutUrl} target="_blank" rel="noreferrer">
                          Continuar pagamento
                        </a>
                      ) : null}
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        ) : null}

        <SectionHeader
          eyebrow="Planos disponíveis"
          title="Contrate um novo plano"
          description="Selecione uma opção abaixo para iniciar uma nova assinatura ou substituir a atual quando fizer sentido para o seu uso."
        />

        {!loading && planos.length === 0 ? (
          <Notice variant="neutral" title="Sem planos cadastrados" description="Não há planos disponíveis no momento." />
        ) : null}

        {!loading && planos.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {planos.map((plano) => {
              const premium = isPremiumPlan(plano.tipo)
              const currentActivePlan = activeSubscription?.planoId === plano.id
              const planLocked = !plano.abacatePayProductId
              const isContracting = contractingPlanId === plano.id

              return (
                <Card
                  key={plano.id}
                  className={cn(
                    'relative overflow-hidden p-6 transition-all duration-200 hover:-translate-y-0.5',
                    premium ? 'border-red-300 bg-[linear-gradient(180deg,rgba(254,242,242,0.92),#ffffff)]' : '',
                    currentActivePlan ? 'ring-2 ring-emerald-200' : '',
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">{plano.tipo || 'PLANO'}</p>
                      <h3 className="mt-2 text-2xl font-black tracking-tight text-zinc-950">{plano.nome || 'Plano sem nome'}</h3>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {premium ? <StatusBadge tone="done" icon="star">Premium</StatusBadge> : null}
                      {currentActivePlan ? <StatusBadge tone="active" icon="check">Assinatura atual</StatusBadge> : null}
                    </div>
                  </div>

                  {plano.descricao ? <p className="mt-4 text-sm leading-relaxed text-zinc-600">{plano.descricao}</p> : null}

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white/80 px-4 py-3">
                      <span className="block text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">Preço</span>
                      <strong className="mt-1 block text-lg font-black text-zinc-950">{formatCurrency(plano.preco)}</strong>
                    </div>
                    <div className="rounded-2xl bg-white/80 px-4 py-3">
                      <span className="block text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">Duração</span>
                      <strong className="mt-1 block text-lg font-black text-zinc-950">{plano.duracaoDias || 0} dias</strong>
                    </div>
                  </div>

                  {planLocked ? (
                    <Notice className="mt-5" variant="warning" title="Plano indisponível">
                      Este plano ainda não possui produto externo cadastrado e não pode ser contratado agora.
                    </Notice>
                  ) : null}

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Button type="button" fullWidth disabled={planLocked || isContracting || currentActivePlan} onClick={() => handleContractPlan(plano)}>
                      {isContracting ? 'Redirecionando...' : currentActivePlan ? 'Plano atual' : 'Contratar este plano'}
                    </Button>
                    
                  </div>
                </Card>
              )
            })}
          </div>
        ) : null}
      </PageStack>
    </AuthenticatedLayout>
  )
}

export default MeuPlanoPage
