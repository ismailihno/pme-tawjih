/**
 * components/layout/Navbar.jsx
 * - Lien "Carrières" ajouté dans la navigation
 */
import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { Menu, X, Sun, Moon, GraduationCap, ChevronDown } from 'lucide-react'

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth()
  const { dark, toggle }          = useTheme()
  const location                  = useLocation()
  const navigate                  = useNavigate()
  const [menuOpen, setMenuOpen]   = useState(false)
  const [scrolled, setScrolled]   = useState(false)
  const [userMenu, setUserMenu]   = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setMenuOpen(false); setUserMenu(false) }, [location])

  const handleLogout = async () => { await logout(); navigate('/') }

  // ── Liens de navigation (Carrières ajouté) ──────────────
  const navLinks = [
    { to: '/',             label: 'Accueil',        exact: true },
    { to: '/schools',      label: 'Établissements' },
    { to: '/careers',      label: 'Carrières' },      // ← AJOUTÉ
    { to: '/announcements', label: 'Inscriptions' },
  ]

  // Dashboard selon rôle
  const dashboardLink = user?.role === 'counselor'
    ? { to: '/counselor', label: 'Mon espace' }
    : user?.role === 'admin'
    ? { to: '/admin', label: 'Admin' }
    : { to: '/dashboard', label: 'Mon espace' }

  const isLinkActive = (link) => link.exact
    ? location.pathname === link.to
    : location.pathname.startsWith(link.to)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 px-4">
      <nav className={`
        w-full max-w-7xl rounded-full px-6 py-3
        glass-nav shadow-ambient
        transition-all duration-300
        ${scrolled ? 'shadow-ambient-md' : ''}
        dark:border dark:border-white/5
      `}>
        <div className="flex items-center justify-between gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <GraduationCap size={18} className="text-on-primary" />
            </div>
            <span className="font-headline tracking-tight hidden sm:block" style={{fontSize:'20px', letterSpacing:'-0.02em'}}>
              <span style={{color: '#00342b', fontWeight: 900}} className="dark:text-primary-fixed">ORI</span><span style={{color: '#fdc003', fontWeight: 900}}>MOI</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link key={link.to} to={link.to} className={`
                px-4 py-2 rounded-full text-sm font-semibold font-body transition-all duration-200
                ${isLinkActive(link)
                  ? 'text-primary dark:text-primary-fixed border-b-2 border-secondary-container'
                  : 'text-on-surface-variant dark:text-white/60 hover:text-primary dark:hover:text-primary-fixed'}
              `}>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">

            {/* Dark mode */}
            <button onClick={toggle} className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant dark:text-white/70 hover:bg-surface-container dark:hover:bg-white/10 transition-all">
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {user ? (
              <div className="relative">
                <button onClick={() => setUserMenu(m => !m)} className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full hover:bg-surface-container dark:hover:bg-white/10 transition-all">
                  <div className="w-7 h-7 rounded-full bg-primary-container flex items-center justify-center">
                    <span className="text-xs font-bold text-on-primary-container">
                      {user.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-on-surface dark:text-white/90 hidden sm:block max-w-[100px] truncate">
                    {user.full_name?.split(' ')[0] || 'Mon compte'}
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full hidden sm:block ${
                    user.role === 'admin'     ? 'bg-primary text-white' :
                    user.role === 'counselor' ? 'bg-secondary-container text-on-secondary-container' :
                    'bg-surface-container text-on-surface-variant'
                  }`}>
                    {user.role === 'admin' ? 'Admin' : user.role === 'counselor' ? 'Prof' : 'Étudiant'}
                  </span>
                  <ChevronDown size={14} className={`text-on-surface-variant transition-transform ${userMenu ? 'rotate-180' : ''}`} />
                </button>

                {userMenu && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-surface-container-lowest dark:bg-dark-surface-container rounded-2xl shadow-ambient-md overflow-hidden animate-fade-up">
                    <div className="p-3 border-b border-surface-container dark:border-white/5">
                      <p className="text-sm font-semibold text-on-surface dark:text-white/90 truncate">{user.full_name}</p>
                      <p className="text-xs text-on-surface-variant dark:text-white/50 truncate">{user.email}</p>
                    </div>
                    <div className="p-1.5 space-y-0.5">
                      <Link to={dashboardLink.to} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-on-surface dark:text-white/80 hover:bg-surface-container dark:hover:bg-white/5 transition-colors">
                        <span className="material-symbols-outlined icon-sm">dashboard</span>
                        {dashboardLink.label}
                      </Link>

                      {user.role === 'student' && (
                        <Link to="/profile" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-on-surface dark:text-white/80 hover:bg-surface-container dark:hover:bg-white/5 transition-colors">
                          <span className="material-symbols-outlined icon-sm">person</span>
                          Mon profil
                        </Link>
                      )}

                      {user.role === 'student' && (
                        <Link to="/payments" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-on-surface dark:text-white/80 hover:bg-surface-container dark:hover:bg-white/5 transition-colors">
                          <span className="material-symbols-outlined icon-sm">receipt_long</span>
                          Mes paiements
                        </Link>
                      )}

                      {user.role === 'student' && (
                        <Link to="/questionnaire" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-on-surface dark:text-white/80 hover:bg-surface-container dark:hover:bg-white/5 transition-colors">
                          <span className="material-symbols-outlined icon-sm">quiz</span>
                          Test d'orientation
                        </Link>
                      )}

                      {/* Carrières visible pour tous ── AJOUTÉ */}
                      <Link to="/careers" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-on-surface dark:text-white/80 hover:bg-surface-container dark:hover:bg-white/5 transition-colors">
                        <span className="material-symbols-outlined icon-sm">work</span>
                        Explorer les carrières
                      </Link>

                      {user.role === 'admin' && (
                        <Link to="/admin" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-on-surface dark:text-white/80 hover:bg-surface-container dark:hover:bg-white/5 transition-colors">
                          <span className="material-symbols-outlined icon-sm">admin_panel_settings</span>
                          Administration
                        </Link>
                      )}

                      <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-error hover:bg-error-container/40 transition-colors">
                        <span className="material-symbols-outlined icon-sm">logout</span>
                        Déconnexion
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login"    className="btn-ghost text-sm py-2 px-4">Connexion</Link>
                <Link to="/register" className="btn-primary text-sm py-2.5 px-5">S'inscrire</Link>
              </div>
            )}

            {/* Mobile toggle */}
            <button onClick={() => setMenuOpen(m => !m)} className="md:hidden w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-all">
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-surface-container dark:border-white/5 space-y-1 animate-fade-up">
            {navLinks.map(link => (
              <Link key={link.to} to={link.to} className="block px-4 py-3 rounded-2xl text-sm font-semibold text-on-surface dark:text-white/80 hover:bg-surface-container dark:hover:bg-white/5 transition-colors">
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link to={dashboardLink.to} className="block px-4 py-3 rounded-2xl text-sm font-semibold text-on-surface dark:text-white/80 hover:bg-surface-container dark:hover:bg-white/5">
                  {dashboardLink.label}
                </Link>
                <button onClick={handleLogout} className="w-full text-left px-4 py-3 rounded-2xl text-sm font-semibold text-error hover:bg-error-container/20">
                  Déconnexion
                </button>
              </>
            ) : (
              <div className="flex gap-2 pt-2">
                <Link to="/login"    className="flex-1 text-center btn-ghost text-sm py-2.5">Connexion</Link>
                <Link to="/register" className="flex-1 text-center btn-primary text-sm py-2.5">S'inscrire</Link>
              </div>
            )}
          </div>
        )}
      </nav>
      {userMenu && <div className="fixed inset-0 z-[-1]" onClick={() => setUserMenu(false)} />}
    </header>
  )
}