import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { IconMoon, IconSparkle, IconSun } from '../icons'
import { NAV_ITEMS } from '../navItems'
import { getEffectiveTheme, setTheme } from '../theme'
import type { Theme } from '../theme'

const MARKETING_LINKS = [
  { href: '/#about', label: 'About us' },
  { href: '/#faq', label: 'FAQ' },
  { href: '/#support', label: 'Support' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [theme, setThemeState] = useState<Theme>(() => getEffectiveTheme())

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
              <a href={link.href} key={link.href}>
                {link.label}
              </a>
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
        <Link to="/dashboard" className="app-brand">
          <span className="app-brand-mark">
            <IconSparkle />
          </span>
          Interview Coach
        </Link>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink to={item.to} className="sidebar-link" key={item.to}>
              <item.Icon className="sidebar-icon" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <IconSun /> : <IconMoon />}
          </button>
          <span className="app-nav-name">{user.name}</span>
          <button type="button" className="btn-link" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </aside>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
