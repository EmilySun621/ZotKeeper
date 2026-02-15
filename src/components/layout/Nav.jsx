import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const mainLinks = [
  { to: '/', label: 'Home', icon: '🏠' },
  { to: '/map', label: 'Regions', icon: '🌍' },
  { to: '/search', label: 'Search', icon: '🔍' },
]

export default function Nav() {
  const { user } = useAuth()
  const accountLink = user
    ? { to: '/profile', label: 'Profile', icon: '👤' }
    : { to: '/login', label: 'Login', icon: '🔐' }
  const visibleLinks = [...mainLinks, accountLink]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-stone-200 bg-white/95 backdrop-blur-md md:hidden">
      <div className="flex justify-around py-2">
        {visibleLinks.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 rounded-lg px-4 py-2 text-xs font-medium transition ${
                isActive ? 'text-tomato-500' : 'text-stone-500 hover:text-stone-700'
              }`
            }
          >
            <span className="text-lg">{icon}</span>
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
