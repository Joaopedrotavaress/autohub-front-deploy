import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Card, MetricCard, Notice, PageStack, SectionHeader, getButtonClasses } from '../ui'
import { useAppContext } from '../../context/AppContext'
import { formatDateTime } from '../../utils/dateTime'

const DEFAULT_USUARIO = {
  nome: 'Usuário autenticado',
  email: '-',
  tipo: 'VISITANTE',
  role: 'VISITANTE',
  criadoEm: '',
  atualizadoEm: '',
}

export function UserProfileSection() {
  const { user } = useAppContext()

  const usuario = useMemo(() => {
    if (!user) {
      return DEFAULT_USUARIO
    }

    return {
      ...DEFAULT_USUARIO,
      ...user,
      tipo: user.role || user.tipo || DEFAULT_USUARIO.tipo,
    }
  }, [user])

  const hasAuthenticatedUser = Boolean(user?.id)

  return (
    <PageStack maxWidth="max-w-6xl">
        <SectionHeader
          description="Centralize seus dados autenticados e os atalhos principais do perfil em uma única visão consistente com o restante do sistema."
          eyebrow="Perfil autenticado"
          title="Exibição do seu Perfil"
        />

        <Card className="grid overflow-hidden p-0 lg:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.3fr)]">
          <aside className="relative min-h-[320px] isolation-isolate lg:min-h-full">
          <img
            src="/images/hero-workshop.jpg"
            alt="Veiculo premium em oficina especializada"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(10,12,14,0.78)_0%,rgba(11,13,16,0.44)_55%,rgba(185,0,20,0.45)_140%)]" />
          <div className="relative z-10 flex h-full flex-col justify-end p-8 text-white">
            <span className="inline-flex w-fit items-center text-[11px] font-black uppercase tracking-[0.22em] text-white/80">The Precision Atelier</span>
            <h2 className="mt-4 text-3xl font-black tracking-tight">{usuario.nome}</h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/80">Aqui estão suas informações de perfil.</p>
          </div>
          </aside>

          <article className="flex flex-col p-6 md:p-8">
            <header>
              <h2 className="text-2xl font-black tracking-tight text-zinc-950">Dados do usuário</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">As informações abaixo refletem o usuário autenticado atual.</p>
            </header>

          {!hasAuthenticatedUser && (
            <Notice className="mt-4" description="Faça login para visualizar os dados do perfil autenticado." title="Sessão não autenticada" variant="warning" />
          )}

          {usuario && (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <MetricCard eyebrow="Nome" title={usuario.nome} />
              <MetricCard className="break-words" eyebrow="Email" title={usuario.email} />
              <MetricCard eyebrow="Tipo" title={usuario.tipo} />
              <MetricCard eyebrow="Criado em" title={formatDateTime(usuario.criadoEm) || '-'} />
              <MetricCard className="md:col-span-2" eyebrow="Atualizado em" title={formatDateTime(usuario.atualizadoEm) || '-'} />
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link className={getButtonClasses({ variant: 'secondary' })} to="/minha-garagem">Minha garagem</Link>
            <Link className={getButtonClasses({ variant: 'secondary' })} to="/ordem">Acompanhar serviços</Link>
          </div>
          </article>
        </Card>
    </PageStack>
  )
}

export default UserProfileSection
