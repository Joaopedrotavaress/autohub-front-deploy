import { useEffect, useMemo, useState } from 'react'
import { AuthenticatedLayout } from '../components/layout'
import { Button, Card, Notice, PageStack, SectionHeader, StatusBadge, cn } from '../components/ui'
import { useAppContext } from '../context/AppContext'
import { createAssinatura } from '../services/assinaturaService'
import { getPlanos } from '../services/planoService'
import { formatCurrency, isPremiumPlan } from '../utils/billing'

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

export function PlanosClientePage() {
  const { user } = useAppContext()
  const [planos, setPlanos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [contractingPlanId, setContractingPlanId] = useState('')

  const userId = String(user?.id || '').trim()
  const currentPlanIds = useMemo(() => new Set(), [])

  const loadPlanos = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await getPlanos()
      setPlanos(response)
    } catch (requestError) {
      setError(requestError.message || 'Não foi possível carregar os planos disponíveis.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPlanos()
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
          eyebrow="Planos para motorista"
          title="Escolha um plano para contratar"
          description="Compare as opções disponíveis, veja os detalhes de cada plano e siga para o checkout do AbacatePay sem sair do fluxo do AutoHub."
        />

        <Notice variant="info" title="Fluxo de contratação">
          Após a contratação, a assinatura fica <strong>PENDENTE</strong> até a confirmação do pagamento pelo AbacatePay.
        </Notice>

        {error ? <Notice variant="error" title="Não foi possível concluir a ação" description={error} /> : null}
        {loading ? <Notice variant="neutral" title="Carregando planos" description="Aguarde enquanto buscamos os planos disponíveis." /> : null}

        {!loading && planos.length === 0 ? (
          <Notice variant="neutral" title="Nenhum plano cadastrado" description="No momento não há planos disponíveis para contratação." />
        ) : null}

        {!loading && planos.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {planos.map((plano) => {
              const premium = isPremiumPlan(plano.tipo)
              const planLocked = !plano.abacatePayProductId
              const isContracting = contractingPlanId === plano.id
              const activePlan = currentPlanIds.has(plano.id)

              return (
                <Card
                  key={plano.id}
                  className={cn(
                    'relative overflow-hidden p-6 transition-all duration-200 hover:-translate-y-0.5',
                    premium ? 'border-red-300 bg-[linear-gradient(180deg,rgba(254,242,242,0.92),#ffffff)] shadow-[0_20px_65px_rgba(239,68,68,0.09)]' : '',
                    activePlan ? 'ring-2 ring-emerald-200' : '',
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">{plano.tipo || 'PLANO'}</p>
                      <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-950">{plano.nome || 'Plano sem nome'}</h2>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {premium ? <StatusBadge tone="done" icon="star">Premium</StatusBadge> : null}
                      {activePlan ? <StatusBadge tone="active" icon="check">Ativo</StatusBadge> : null}
                    </div>
                  </div>

                  {plano.descricao ? <p className="mt-4 text-sm leading-relaxed text-zinc-600">{plano.descricao}</p> : <p className="mt-4 text-sm text-zinc-500">Sem descrição informada.</p>}

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
                    <Button type="button" fullWidth disabled={planLocked || isContracting || activePlan} onClick={() => handleContractPlan(plano)}>
                      {isContracting ? 'Redirecionando...' : activePlan ? 'Plano ativo' : 'Contratar plano'}
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

export default PlanosClientePage
