import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { IconMoon, IconPlay, IconSparkle, IconSun } from '../icons'
import { NAV_ITEMS } from '../navItems'
import { getEffectiveTheme, setTheme } from '../theme'
import type { Theme } from '../theme'

const MARKETING_LINKS = [
  { to: '/about', label: 'About us' },
  { to: '/features', label: 'Features' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [theme, setThemeState] = useState<Theme>(() => getEffectiveTheme())
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  function toggleTheme() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    setThemeState(next)
  }

  if (!user) {
    return (
      <div className="app-shell">
        <header className="app-nav">
          <Link to="/" className="app-brand">
            <span className="app-brand-mark">
              <IconSparkle />
            </span>
            Interview Coach
          </Link>
          <nav className="app-nav-links">
            {MARKETING_LINKS.map((link) => (
              <NavLink to={link.to} key={link.to}>
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="app-nav-user">
            <button
              type="button"
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <IconSun /> : <IconMoon />}
            </button>
            <NavLink to="/login">Log in</NavLink>
            <NavLink to="/signup">Sign up</NavLink>
          </div>
        </header>
        <main className="app-main">
          <Outlet />
        </main>
      </div>
    )
  }

  return (
    <div className="app-shell app-shell-with-sidebar">
      <aside className="sidebar">
        <div className="sidebar-top">
          <Link to="/dashboard" className="app-brand">
            <span className="app-brand-mark">
              <IconSparkle />
            </span>
            Interview Coach
          </Link>
        </div>

        <Link to="/start-interview" className="sidebar-cta">
          <IconPlay className="sidebar-cta-icon" />
          Start Interview
        </Link>

        <span className="sidebar-section-label">Main menu</span>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink to={item.to} className="sidebar-link" key={item.to}>
              <span className="sidebar-icon-badge">
                <item.Icon className="sidebar-icon" />
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            type="button"
            className="theme-toggle sidebar-theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <IconSun /> : <IconMoon />}
          </button>
          <div className="sidebar-divider" />
          <div className="account-menu" ref={menuRef}>
            <button
              type="button"
              className="account-row"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <span className="account-name">{user.name || user.email}</span>
            </button>
            {menuOpen && (
              <div className="account-menu-dropdown" role="menu">
                <button type="button" role="menuitem" onClick={handleLogout}>
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
