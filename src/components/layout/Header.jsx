import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button, cn, getButtonClasses } from '../ui'
import { useAppContext } from '../../context/AppContext'
import { getDefaultRouteForUser, getNavigationItems, getUserRole, isRouteActive, ROLES } from '../../utils/accessControl'

export function Header({ variant = 'default' }) {
  const { user, logout } = useAppContext()
  const location = useLocation()
  const navigate = useNavigate()
  const role = getUserRole(user)
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    setMenuOpen(false)
    logout()
    navigate('/')
  }

  const navItems = variant === 'landing' || role === ROLES.VISITANTE
    ? getNavigationItems(null)
    : getNavigationItems(user)
  const dashboardPath = getDefaultRouteForUser(user)
  const userName = user?.nome || user?.email || 'Perfil'
  const userInitial = userName.trim().charAt(0).toUpperCase() || 'A'

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  const isActive = (path) => {
    return isRouteActive(location.pathname, path)
  }

  const renderLink = (item) => (
    <Link
      key={item.to}
      className={cn('py-1 text-sm font-bold transition-colors border-b-2',
        isActive(item.to)
          ? 'text-red-600 dark:text-red-500 border-red-600'
          : 'text-zinc-600 dark:text-zinc-400 border-transparent hover:text-red-600 dark:hover:text-red-400'
      )}
      to={item.to}
    >
      {item.label}
    </Link>
  )

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-white/60 bg-white/90 shadow-sm backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/80 dark:shadow-none">
      <div className="max-w-screen-2xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-20 items-center justify-between gap-4">
          <div className="flex items-center gap-6 lg:gap-12">
            <Button type="button" variant="ghost" className="min-h-0 px-0 py-0 text-2xl font-black tracking-tighter text-zinc-900 hover:bg-transparent hover:text-red-600 dark:text-zinc-50" onClick={() => navigate(role === ROLES.VISITANTE ? '/' : dashboardPath)}>
              Autohub
            </Button>

            <div className="hidden items-center gap-8 md:flex">
              {navItems.map(renderLink)}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {role !== ROLES.VISITANTE ? (
              <>
                <Button type="button" variant="secondary" onClick={() => navigate('/perfilcliente')} className="hidden min-h-0 items-center gap-3 px-3 py-2 text-left md:flex" title="Perfil">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-950 text-sm font-black uppercase text-white">
                    {userInitial}
                  </span>
                  <span className="min-w-0">
                    <strong className="block max-w-36 truncate text-sm font-black text-zinc-900">{userName}</strong>
                    <span className="block text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                      {role.replace('_', ' ')}
                    </span>
                  </span>
                  </Button>
                  <Button type="button" variant="subtle" onClick={handleLogout} className="hidden md:inline-flex">
                  Sair
                  </Button>

                  <Button type="button" variant="secondary" className="inline-flex h-12 w-12 px-0 md:hidden" onClick={() => setMenuOpen((current) => !current)} aria-label="Abrir menu" aria-expanded={menuOpen}>
                  <span className="material-symbols-outlined">{menuOpen ? 'close' : 'menu'}</span>
                  </Button>
              </>
            ) : (
                <Link to="/login" className={getButtonClasses({ variant: 'secondary' })}>
                Entrar
              </Link>
            )}
          </div>
        </div>

        {role !== ROLES.VISITANTE && menuOpen ? (
          <div className="border-t border-zinc-200 py-4 md:hidden">
            <div className="flex items-center gap-3 rounded-[1.5rem] bg-zinc-50 px-4 py-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-950 text-sm font-black uppercase text-white">
                {userInitial}
              </span>
              <div className="min-w-0 flex-1">
                <strong className="block truncate text-sm font-black text-zinc-900">{userName}</strong>
                <span className="block text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                  {role.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn('flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-bold transition-colors',
                    isActive(item.to)
                      ? 'bg-red-50 text-red-700'
                      : 'bg-white text-zinc-700 hover:bg-zinc-50'
                  )}
                >
                  <span>{item.label}</span>
                  <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                </Link>
              ))}
              <Button type="button" variant="subtle" className="mt-2" onClick={handleLogout}>
                Sair
              </Button>
            </div>
          </div>
        ) : null}
        </div>
    </nav>
  )
}

export default Header