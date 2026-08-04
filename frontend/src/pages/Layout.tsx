import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="app-shell">
      <header className="app-nav">
        <span className="app-brand">Interview Coach</span>
        {user && (
          <nav className="app-nav-links">
            <NavLink to="/dashboard">Dashboard</NavLink>
            <NavLink to="/onboarding">Resume</NavLink>
            <NavLink to="/history">History</NavLink>
          </nav>
        )}
        <div className="app-nav-user">
          {user ? (
            <>
              <span className="app-nav-email">{user.email}</span>
              <button type="button" className="btn-link" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <NavLink to="/login">Log in</NavLink>
          )}
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
