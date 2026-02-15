import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Nav from './Nav'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <>
      {/* Top nav: visible on md+ */}
      <nav className="fixed left-0 right-0 top-0 z-20 hidden border-b border-orange-200/60 bg-white/90 backdrop-blur-md md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <NavLink to="/" className="font-display text-xl font-bold text-stone-900">
            🍽️ ZotKeeper
          </NavLink>
          <div className="flex items-center gap-6">
            <NavLink to="/" end className={({ isActive }) => `text-sm font-medium ${isActive ? 'text-tomato-500' : 'text-stone-600 hover:text-tomato-500'}`}>
              Home
            </NavLink>
            <NavLink to="/map" className={({ isActive }) => `text-sm font-medium ${isActive ? 'text-tomato-500' : 'text-stone-600 hover:text-tomato-500'}`}>
              Regions
            </NavLink>
            <NavLink to="/search" className={({ isActive }) => `text-sm font-medium ${isActive ? 'text-tomato-500' : 'text-stone-600 hover:text-tomato-500'}`}>
              Search
            </NavLink>
            <NavLink to="/profile" className={({ isActive }) => `text-sm font-medium ${isActive ? 'text-tomato-500' : 'text-stone-600 hover:text-tomato-500'}`}>
              Profile
            </NavLink>
            {user ? (
              <button type="button" onClick={handleLogout} className="text-sm font-medium text-stone-600 hover:text-tomato-500">
                Log out
              </button>
            ) : (
              <NavLink to="/login" className={({ isActive }) => `text-sm font-medium ${isActive ? 'text-tomato-500' : 'text-stone-600 hover:text-tomato-500'}`}>
                Login
              </NavLink>
            )}
          </div>
        </div>
      </nav>

      {/* Main content: padding for top nav on desktop, bottom nav on mobile */}
      <main className="relative z-10 pb-20 pt-4 md:pb-8 md:pt-16">
        <div className="mx-auto max-w-6xl px-4">
          <Outlet />
        </div>
      </main>

      {/* Bottom nav: mobile only */}
      <Nav />
    </>
  )
}
