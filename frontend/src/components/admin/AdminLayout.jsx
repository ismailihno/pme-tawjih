/**
 * components/admin/AdminLayout.jsx
 * Sidebar layout shared by all admin pages.
 */
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/admin',                 icon: 'dashboard',            label: 'Tableau de bord', exact: true },
  { to: '/admin/users',           icon: 'group',                label: 'Utilisateurs' },
  { to: '/admin/schools',         icon: 'school',               label: 'Établissements' },
  { to: '/admin/careers',         icon: 'work',                 label: 'Filières' },          // ← AJOUTÉ
  { to: '/admin/payments',        icon: 'payments',             label: 'Paiements' },
  { to: '/admin/recommendations', icon: 'psychology',           label: 'Algorithme' },
  { to: '/admin/admins',          icon: 'admin_panel_settings', label: 'Admins' },
]

export default function AdminLayout({ children, title }) {
  const location = useLocation()
  const { user }  = useAuth()

  const isActive = (item) => item.exact
    ? location.pathname === item.to
    : location.pathname.startsWith(item.to)

  return (
    <div className="min-h-screen bg-surface-container-low dark:bg-dark-surface flex pt-20">
      <aside className="hidden lg:flex flex-col w-64 fixed top-20 bottom-0 left-0 border-r border-surface-container dark:border-white/5 bg-surface-container-lowest dark:bg-dark-surface-container p-4">
        <div className="mb-6 px-3 pt-2">
          <p className="section-label mb-0.5">Administration</p>
          <p className="text-xs text-on-surface-variant dark:text-white/40">{user?.full_name}</p>
        </div>
        <nav className="space-y-1 flex-1">
          {navItems.map(item => (
            <Link key={item.to} to={item.to} className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 ${
              isActive(item) ? 'bg-primary text-on-primary' : 'text-on-surface-variant dark:text-white/50 hover:bg-surface-container dark:hover:bg-white/5 hover:text-on-surface dark:hover:text-white/80'
            }`}>
              <span className="material-symbols-outlined" style={{fontSize:20}}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <Link to="/dashboard" className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-sm text-on-surface-variant dark:text-white/40 hover:bg-surface-container dark:hover:bg-white/5 transition-colors mt-4">
          <span className="material-symbols-outlined" style={{fontSize:18}}>arrow_back</span>
          Retour au site
        </Link>
      </aside>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest dark:bg-dark-surface-container border-t border-surface-container dark:border-white/5 flex overflow-x-auto">
        {navItems.map(item => (
          <Link key={item.to} to={item.to} className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-2.5 text-xs font-semibold transition-colors ${
            isActive(item) ? 'text-primary dark:text-primary-fixed' : 'text-on-surface-variant dark:text-white/40'
          }`}>
            <span className="material-symbols-outlined" style={{fontSize:22}}>{item.icon}</span>
          </Link>
        ))}
      </div>

      <main className="flex-1 lg:ml-64 pb-20 lg:pb-0">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {title && <h1 className="font-headline font-bold text-2xl text-on-surface dark:text-white/90 mb-8">{title}</h1>}
          {children}
        </div>
      </main>
    </div>
  )
}