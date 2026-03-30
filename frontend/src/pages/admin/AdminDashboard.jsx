/**
 * pages/admin/AdminDashboard.jsx
 */

import { useEffect, useState } from 'react'
import api from '../../lib/api'
import AdminLayout from '../../components/admin/AdminLayout'
import { StatCard, Card, Spinner } from '../../components/ui'

export default function AdminDashboard() {
  const [stats, setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admins/stats').then(res => setStats(res.data)).finally(() => setLoading(false))
  }, [])

  return (
    <AdminLayout title="Tableau de bord">
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <div className="space-y-8">

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
            <div className="animate-fade-up"><StatCard icon="group"       label="Utilisateurs"    value={stats?.total_users || 0}        color="primary" /></div>
            <div className="animate-fade-up"><StatCard icon="school"      label="Établissements"  value={stats?.total_schools || 0}      color="blue" /></div>
            <div className="animate-fade-up"><StatCard icon="psychology"  label="Orientations"    value={stats?.total_orientations || 0} color="green" /></div>
            <div className="animate-fade-up"><StatCard icon="person"      label="Étudiants"       value={stats?.total_students || 0}     color="amber" /></div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Popular fields */}
            <Card>
              <h2 className="font-headline font-bold text-base text-on-surface dark:text-white/90 mb-5">
                Filières les plus populaires
              </h2>
              {stats?.popular_fields?.length > 0 ? (
                <div className="space-y-4">
                  {stats.popular_fields.map((item, i) => {
                    const max = stats.popular_fields[0]?.count || 1
                    const pct = Math.round((item.count / max) * 100)
                    return (
                      <div key={item.field} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-on-surface dark:text-white/80">
                            {i + 1}. {item.field}
                          </span>
                          <span className="text-on-surface-variant dark:text-white/40">{item.count} choix</span>
                        </div>
                        <div className="h-2 bg-surface-container dark:bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-primary to-primary-container transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-on-surface-variant dark:text-white/40">Aucune donnée disponible.</p>
              )}
            </Card>

            {/* Recent orientations */}
            <Card>
              <h2 className="font-headline font-bold text-base text-on-surface dark:text-white/90 mb-5">
                Orientations récentes
              </h2>
              {stats?.recent_orientations?.length > 0 ? (
                <div className="space-y-3">
                  {stats.recent_orientations.map((o, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-surface-container-low dark:bg-white/5">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 dark:bg-primary-fixed/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary dark:text-primary-fixed" style={{fontSize:16}}>school</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-on-surface dark:text-white/80 truncate">{o.suggested_field}</p>
                        <p className="text-xs text-on-surface-variant dark:text-white/40">
                          {new Date(o.created_at).toLocaleDateString('fr-MA', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-on-surface-variant dark:text-white/40">Aucune orientation récente.</p>
              )}
            </Card>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { href: '/admin/users',           icon: 'manage_accounts', label: 'Gérer les utilisateurs' },
              { href: '/admin/schools',          icon: 'school',          label: 'Gérer les établissements' },
              { href: '/admin/recommendations',  icon: 'psychology',      label: 'Paramètres algorithme' },
              { href: '/admin/admins',           icon: 'admin_panel_settings', label: 'Gérer les admins' },
            ].map(link => (
              <a
                key={link.href}
                href={link.href}
                className="bg-surface-container-lowest dark:bg-dark-surface-container rounded-2xl p-4 shadow-ambient hover:shadow-ambient-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col items-center gap-2 text-center"
              >
                <span className="material-symbols-outlined text-primary dark:text-primary-fixed icon-lg">{link.icon}</span>
                <p className="text-xs font-semibold text-on-surface dark:text-white/70">{link.label}</p>
              </a>
            ))}
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
