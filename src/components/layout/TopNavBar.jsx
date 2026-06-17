import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../../context/AppContext'

export function TopNavBar() {
  const navigate = useNavigate()
  const { logout } = useAppContext()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="fixed top-0 w-full z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm dark:shadow-none">
      <div className="flex justify-between items-center h-20 px-8 max-w-screen-2xl mx-auto">
        {/* Brand Logo */}
        <div className="text-2xl font-black tracking-tighter text-zinc-900 dark:text-zinc-50 font-headline cursor-pointer hover:text-primary transition-colors" onClick={() => navigate('/home')}>
          Autohub
        </div>

        {/* Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center space-x-10">
          <a className="text-red-600 dark:text-red-500 font-bold border-b-2 border-red-600 font-headline py-1 transition-transform duration-300" href="/home">
            Explore
          </a>
          <a className="text-zinc-600 dark:text-zinc-400 font-medium font-headline hover:text-red-500 transition-colors" href="#bookings">
            Bookings
          </a>
          <a className="text-zinc-600 dark:text-zinc-400 font-medium font-headline hover:text-red-500 transition-colors" href="#about">
            About
          </a>
        </nav>

        {/* Trailing Action */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/home')}
            className="hidden md:block text-zinc-600 dark:text-zinc-400 font-medium font-headline hover:text-red-500 transition-colors"
          >
            <span className="material-symbols-outlined">person</span>
          </button>
          <button
            onClick={handleLogout}
            className="bg-zinc-900 text-white px-6 py-2.5 rounded-xl font-bold font-headline text-sm hover:bg-zinc-800 transition-transform active:scale-95"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  )
}

export default TopNavBar
