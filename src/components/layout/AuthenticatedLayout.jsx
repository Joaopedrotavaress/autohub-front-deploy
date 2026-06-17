import { Link, useLocation } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { Footer } from './Footer'
import { Header } from './Header'

function getPageLabel(pathname) {
  if (pathname.startsWith('/minha-garagem')) return 'Minha garagem'
  if (pathname.startsWith('/minhas-oficinas')) return 'Minhas oficinas'
  if (pathname.startsWith('/register/oficina')) return 'Minha oficina'
  if (pathname.startsWith('/equipe')) return 'Equipe'
  if (pathname.startsWith('/register/veiculo')) return 'Cadastrar veículo'
  if (pathname.startsWith('/servico/cadastrar')) return 'Cadastrar serviço'
  if (pathname.startsWith('/servicos')) return 'Meus serviços'
  if (pathname.startsWith('/ordem/novo')) return 'Nova ordem de serviço'
  if (pathname.startsWith('/ordem')) return 'Ordens de serviço'
  if (pathname.startsWith('/cliente/planos')) return 'Planos'
  if (pathname.startsWith('/cliente/meu-plano')) return 'Meu plano'
  if (pathname.startsWith('/admin/dashboard')) return 'Dashboard Administrativo'
  if (pathname.startsWith('/admin/planos')) return 'Gerenciar Planos'
  if (pathname.startsWith('/admin/assinaturas')) return 'Gerenciar Assinaturas'
  if (pathname.startsWith('/admin/oficinas')) return 'Gerenciar Oficinas'
  if (pathname.startsWith('/admin/kafka-dashboard')) return 'Dashboard Kafka'
  if (pathname.startsWith('/admin/kafka')) return 'Monitoramento Kafka'
  if (pathname.startsWith('/workshops')) return 'Oficinas'
  if (pathname.startsWith('/workshop')) return 'Detalhe da oficina'
  if (pathname.startsWith('/perfilcliente')) return 'Perfil'
  return 'Área autenticada'
}

export function AuthenticatedLayout({
  children,
  eyebrow = 'Painel AutoHub',
  title,
  description,
  actions = null,
  hero = null,
  fullBleed = false,
  contentClassName = '',
  showPageHeader = false,
}) {
  const location = useLocation()
  const pageTitle = title || getPageLabel(location.pathname)

  return (
    <div className="min-h-screen bg-stone-100 text-zinc-950 flex flex-col">
      <Header variant="authenticated" />

      <main className="flex-1 pt-24 pb-28 md:pb-16">
        <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          {showPageHeader ? (
            <section className="relative overflow-hidden rounded-[2rem] border border-zinc-200/80 bg-white shadow-[0_18px_60px_rgba(25,28,29,0.06)]">
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.1),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.08),transparent_28%)]" />

              <div className="relative px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                  <div className="max-w-3xl">
                    <div className="flex flex-wrap items-center gap-3 text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">
                      <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-3 py-1 text-red-600">
                        {eyebrow}
                      </span>
                      <span className="hidden items-center gap-2 text-zinc-400 md:inline-flex">
                        <Link className="transition-colors hover:text-red-600" to="/home">Início</Link>
                        <span>/</span>
                        <span>{pageTitle}</span>
                      </span>
                    </div>

                    <h1 className="mt-4 text-4xl font-black tracking-tight text-zinc-950 sm:text-5xl">
                      {pageTitle}
                    </h1>

                    {description ? (
                      <p className="mt-4 max-w-3xl text-base leading-relaxed text-zinc-600 sm:text-lg">
                        {description}
                      </p>
                    ) : null}
                  </div>

                  {actions ? <div className="flex flex-col gap-3 sm:flex-row">{actions}</div> : null}
                </div>

                {hero ? <div className="mt-8">{hero}</div> : null}
              </div>
            </section>
          ) : null}

          {fullBleed ? (
            children
          ) : (
            <section className={`flex flex-col gap-6 ${contentClassName}`.trim()}>
              {children}
            </section>
          )}
        </div>
      </main>

      <Footer />
      <BottomNav />
    </div>
  )
}

export default AuthenticatedLayout
