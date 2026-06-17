import { Link, useLocation } from 'react-router-dom'
import { cn } from '../ui'
import { useAppContext } from '../../context/AppContext'
import { getNavigationItems, isRouteActive } from '../../utils/accessControl'

export function BottomNav() {
  const { user } = useAppContext()
  const location = useLocation()
  const navItems = getNavigationItems(user)

  const isActive = (path) => {
    return isRouteActive(location.pathname, path)
  }

  return (
    <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-3xl border-t border-white/70 bg-white/90 px-4 pb-6 pt-2 shadow-[0_-12px_40px_rgba(25,28,29,0.06)] backdrop-blur-2xl md:hidden dark:border-zinc-800 dark:bg-zinc-900/90">
      {navItems.map((item) => (
        <Link
          key={item.to}
          className={cn('flex flex-col items-center justify-center rounded-2xl p-3 ease-in-out transition-all duration-300',
            isActive(item.to)
              ? 'text-red-600 dark:text-red-500 bg-red-50 dark:bg-red-900/20 scale-105'
              : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          )}
          to={item.to}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontVariationSettings: isActive(item.to) ? "'FILL' 1" : "'FILL' 0" }}
          >
            {item.icon}
          </span>
          <span className="text-[11px] font-bold tracking-wider uppercase font-headline mt-1">
            {item.label}
          </span>
        </Link>
      ))}
    </nav>
  )
}

export default BottomNav