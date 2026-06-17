import { Link } from 'react-router-dom'
import { AuthenticatedLayout } from '../components/layout'
import { Button, EmptyState, Notice, PageStack, SectionHeader, SurfacePanel, getButtonClasses } from '../components/ui'
import { useOficinaContext } from '../context/OficinaContext'
import { useAppContext } from '../context/AppContext'
import { getUserRole, ROLES } from '../utils/accessControl'

export function ProfessionalWorkshopsPage() {
  const { user } = useAppContext()
  const { oficinas, oficinaAtivaId, setOficinaAtiva, loading, error, refreshOficinas } = useOficinaContext()
  const role = getUserRole(user)
  const canManage = role === ROLES.DONO_OFICINA || role === ROLES.ADMIN

  return (
    <AuthenticatedLayout>
      <PageStack>
        <SectionHeader
          actions={canManage ? (
            <>
              <Button type="button" variant="secondary" onClick={() => refreshOficinas()}>Atualizar</Button>
              <Link className={getButtonClasses({ variant: 'subtle' })} to="/register/oficina">Nova oficina</Link>
            </>
          ) : null}
          description={canManage
            ? 'Selecione a oficina ativa, navegue no contexto multi-oficina e acesse a gestão estrutural da sua operação.'
            : 'Escolha a oficina ativa vinculada ao seu usuário para trabalhar no contexto correto, sem acesso administrativo de dono.'}
          eyebrow="Operação multi-oficina"
          title="Minhas oficinas"
        />

        {loading ? <Notice title="Sincronizando oficinas" description="Carregando oficinas vinculadas..." /> : null}
        {!loading && error ? <Notice variant="error" title="Não foi possível carregar as oficinas" description={error} /> : null}
        {!loading && !error && oficinas.length === 0 ? (
          <EmptyState
            title="Nenhuma oficina encontrada"
            description={canManage
              ? 'Nenhuma oficina cadastrada para este usuário. Crie a primeira oficina para começar.'
              : 'Nenhuma oficina está vinculada ao seu usuário. Solicite ao dono da oficina que faça sua associação.'}
          />
        ) : null}

        <div className="grid gap-4 xl:grid-cols-2">
        {oficinas.map((oficina) => {
          const isActive = oficina.id === oficinaAtivaId

          return (
            <SurfacePanel key={oficina.id} className={`${isActive ? 'border-red-300 bg-red-50/70' : 'border-zinc-200 bg-white'} transition-colors`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">{isActive ? 'Oficina ativa' : 'Oficina vinculada'}</p>
                  <h2 className="mt-2 text-2xl font-black text-zinc-950">{oficina.nome || 'Oficina sem nome'}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">{oficina.descricao || 'Sem descrição cadastrada.'}</p>
                </div>
                <Button type="button" variant={isActive ? 'subtle' : 'secondary'} onClick={() => setOficinaAtiva(oficina.id)}>
                  {isActive ? 'Selecionada' : 'Usar esta'}
                </Button>
              </div>

              <dl className="mt-5 grid gap-3 text-sm text-zinc-600 sm:grid-cols-2">
                <div>
                  <dt className="font-bold text-zinc-500">Endereço</dt>
                  <dd>{oficina.endereco || 'Não informado'}</dd>
                </div>
                <div>
                  <dt className="font-bold text-zinc-500">CNPJ</dt>
                  <dd>{oficina.cnpj || 'Não informado'}</dd>
                </div>
                <div>
                  <dt className="font-bold text-zinc-500">Celular</dt>
                  <dd>{oficina.telefone || 'Não informado'}</dd>
                </div>
                <div>
                  <dt className="font-bold text-zinc-500">CEP</dt>
                  <dd>{oficina.cep || 'Não informado'}</dd>
                </div>
              </dl>

              {canManage ? (
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    className={getButtonClasses({ variant: 'secondary', size: 'sm' })}
                    to={`/register/oficina/${oficina.id}`}
                    state={{ oficina }}
                  >
                    Gerenciar oficina
                  </Link>
                  <Link className={getButtonClasses({ variant: 'secondary', size: 'sm' })} to="/servicos">
                    Serviços
                  </Link>
                </div>
              ) : null}
            </SurfacePanel>
          )
        })}
        </div>
      </PageStack>
    </AuthenticatedLayout>
  )
}

export default ProfessionalWorkshopsPage
