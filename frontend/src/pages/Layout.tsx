import { useEffect, useRef, useState } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useActiveSession } from '../activeSession'
import { finishSession } from '../api'
import { getInitial, useAuth } from '../auth'
import { IconMenu, IconMoon, IconPlay, IconSparkle, IconSun } from '../icons'
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { activeSessionId, setActiveSessionId } = useActiveSession()
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)
  const [finishingSession, setFinishingSession] = useState(false)

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

  function guardedAction(action: () => void) {
    if (activeSessionId) {
      setPendingAction(() => action)
    } else {
      action()
    }
  }

  async function confirmLeaveSession() {
    const action = pendingAction
    if (!action) return
    setFinishingSession(true)
    try {
      if (activeSessionId) await finishSession(activeSessionId)
    } catch {
      // The session stays "in progress" if this fails, but the user still gets to leave.
    } finally {
      setActiveSessionId(null)
      setFinishingSession(false)
      setPendingAction(null)
      action()
    }
  }

  function cancelLeaveSession() {
    setPendingAction(null)
  }

  function handleNavClick(e: ReactMouseEvent, to: string) {
    if (!activeSessionId) return
    e.preventDefault()
    guardedAction(() => navigate(to))
  }

  function handleLogout() {
    guardedAction(() => {
      logout()
      navigate('/login')
    })
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
      <aside className={sidebarCollapsed ? 'sidebar sidebar-collapsed' : 'sidebar'}>
        <div className="sidebar-top">
          <Link to="/dashboard" className="app-brand" onClick={(e) => handleNavClick(e, '/dashboard')}>
            <span className="app-brand-mark">
              <IconSparkle />
            </span>
            <span className="sidebar-label">Interview Coach</span>
          </Link>
        </div>

        <Link to="/start-interview" className="sidebar-cta" onClick={(e) => handleNavClick(e, '/start-interview')}>
          <IconPlay className="sidebar-cta-icon" />
          <span className="sidebar-label">Start Interview</span>
        </Link>

        <span className="sidebar-section-label">Main menu</span>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              to={item.to}
              className="sidebar-link"
              key={item.to}
              onClick={(e) => handleNavClick(e, item.to)}
            >
              <span className="sidebar-icon-badge">
                <item.Icon className="sidebar-icon" />
              </span>
              <span className="sidebar-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="account-menu" ref={menuRef}>
            <button
              type="button"
              className="account-row"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <span className="account-name sidebar-label">{user.name || user.email}</span>
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
      <div className="app-content">
        <header className="app-topbar">
          <button
            type="button"
            className="topbar-menu-toggle"
            onClick={() => setSidebarCollapsed((v) => !v)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <IconMenu />
          </button>
          <div className="topbar-user">
            <button
              type="button"
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <IconSun /> : <IconMoon />}
            </button>
            <span className="profile-avatar profile-avatar-sm">{getInitial(user)}</span>
          </div>
        </header>
        <main className="app-main">
          <Outlet />
        </main>
      </div>

      {pendingAction && (
        <div className="confirm-overlay">
          <div className="confirm-modal panel">
            <h3>Leave this interview?</h3>
            <p className="page-subtitle">
              You have an interview session in progress. Leaving now will finish this session with your current
              progress.
            </p>
            <div className="confirm-modal-actions">
              <button type="button" className="btn-link" onClick={cancelLeaveSession} disabled={finishingSession}>
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={confirmLeaveSession} disabled={finishingSession}>
                {finishingSession ? 'Finishing…' : 'Finish session & leave'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
