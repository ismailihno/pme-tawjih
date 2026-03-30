/**
 * pages/admin/AdminUsers.jsx
 * View, search, suspend/activate, and change roles for all users.
 */

import { useState, useEffect } from 'react'
import api from '../../lib/api'
import AdminLayout from '../../components/admin/AdminLayout'
import { Input, Select, Button, Badge, Spinner, Modal, Alert, EmptyState } from '../../components/ui'
import { Search, UserCheck, UserX, Shield } from 'lucide-react'

export default function AdminUsers() {
  const [users, setUsers]       = useState([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [role, setRole]         = useState('')
  const [page, setPage]         = useState(1)
  const [modal, setModal]       = useState(null) // { user, action }
  const [saving, setSaving]     = useState(false)
  const [feedback, setFeedback] = useState({ type: '', msg: '' })

  const load = async () => {
    setLoading(true)
    const params = new URLSearchParams({ page, limit: 20 })
    if (search) params.set('search', search)
    if (role)   params.set('role', role)
    try {
      const { data } = await api.get(`/admins/users?${params}`)
      setUsers(data.users || [])
      setTotal(data.total || 0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page, search, role])

  const handleAction = async () => {
    if (!modal) return
    setSaving(true)
    try {
      const { user, action } = modal
      if (action === 'suspend')   await api.put(`/admins/users/${user.id}`, { is_active: false })
      if (action === 'activate')  await api.put(`/admins/users/${user.id}`, { is_active: true })
      if (action === 'makeAdmin') await api.put(`/admins/users/${user.id}`, { role: 'admin' })
      if (action === 'makeStudent') await api.put(`/admins/users/${user.id}`, { role: 'student' })
      setFeedback({ type: 'success', msg: 'Utilisateur mis à jour.' })
      setModal(null)
      load()
    } catch (err) {
      setFeedback({ type: 'error', msg: err.response?.data?.error || 'Erreur.' })
    } finally {
      setSaving(false)
    }
  }

  const actionLabels = {
    suspend:     { label: 'Suspendre', color: 'danger' },
    activate:    { label: 'Activer',   color: 'secondary' },
    makeAdmin:   { label: 'Promouvoir admin', color: 'primary' },
    makeStudent: { label: 'Rétrograder étudiant', color: 'outline' },
  }

  return (
    <AdminLayout title="Utilisateurs">
      <div className="space-y-6">

        <Alert type={feedback.type} message={feedback.msg} className="mb-2" />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-white/30" />
            <input
              className="input-field pl-10 dark:bg-dark-surface-container dark:text-white/90"
              placeholder="Rechercher par nom ou email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Select
            placeholder="Tous les rôles"
            options={[{ value: 'student', label: 'Étudiant' }, { value: 'admin', label: 'Admin' }]}
            value={role}
            onChange={e => setRole(e.target.value)}
            className="sm:w-40"
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : users.length === 0 ? (
          <EmptyState icon="group" title="Aucun utilisateur trouvé" description="Modifiez vos filtres de recherche." />
        ) : (
          <div className="bg-surface-container-lowest dark:bg-dark-surface-container rounded-3xl shadow-ambient overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-container dark:border-white/5">
                    <th className="px-5 py-4 text-left text-xs font-semibold text-on-surface-variant dark:text-white/40 uppercase tracking-wider">Utilisateur</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-on-surface-variant dark:text-white/40 uppercase tracking-wider hidden sm:table-cell">Bac / Ville</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-on-surface-variant dark:text-white/40 uppercase tracking-wider">Rôle</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-on-surface-variant dark:text-white/40 uppercase tracking-wider">Statut</th>
                    <th className="px-5 py-4 text-right text-xs font-semibold text-on-surface-variant dark:text-white/40 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container dark:divide-white/5">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-surface-container-low dark:hover:bg-white/3 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-primary/10 dark:bg-primary-fixed/10 flex items-center justify-center shrink-0 font-bold text-sm text-primary dark:text-primary-fixed">
                            {u.full_name?.[0]?.toUpperCase() || u.email?.[0]?.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-on-surface dark:text-white/80 truncate">{u.full_name || '—'}</p>
                            <p className="text-xs text-on-surface-variant dark:text-white/40 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 hidden sm:table-cell">
                        <p className="text-sm text-on-surface-variant dark:text-white/50">
                          {u.students?.bac_type || '—'}
                        </p>
                        <p className="text-xs text-on-surface-variant/60 dark:text-white/30">
                          {u.students?.city || ''}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={u.role === 'admin' ? 'primary' : 'default'}>
                          {u.role === 'admin' ? 'Admin' : 'Étudiant'}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={u.is_active ? 'success' : 'danger'}>
                          {u.is_active ? 'Actif' : 'Suspendu'}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {u.is_active ? (
                            <button
                              onClick={() => setModal({ user: u, action: 'suspend' })}
                              className="p-1.5 rounded-lg text-error hover:bg-error-container/30 transition-colors"
                              title="Suspendre"
                            >
                              <UserX size={15} />
                            </button>
                          ) : (
                            <button
                              onClick={() => setModal({ user: u, action: 'activate' })}
                              className="p-1.5 rounded-lg text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20 transition-colors"
                              title="Activer"
                            >
                              <UserCheck size={15} />
                            </button>
                          )}
                          {u.role === 'student' && (
                            <button
                              onClick={() => setModal({ user: u, action: 'makeAdmin' })}
                              className="p-1.5 rounded-lg text-primary dark:text-primary-fixed hover:bg-primary/10 transition-colors"
                              title="Promouvoir admin"
                            >
                              <Shield size={15} />
                            </button>
                          )}
                          {u.role === 'admin' && (
                            <button
                              onClick={() => setModal({ user: u, action: 'makeStudent' })}
                              className="p-1.5 rounded-lg text-on-surface-variant dark:text-white/40 hover:bg-surface-container transition-colors text-xs font-semibold px-2"
                              title="Rétrograder"
                            >
                              Rétrograder
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {total > 20 && (
              <div className="flex justify-between items-center px-5 py-4 border-t border-surface-container dark:border-white/5">
                <p className="text-xs text-on-surface-variant dark:text-white/40">{total} utilisateurs</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}>Préc.</Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => p+1)} disabled={page >= Math.ceil(total/20)}>Suiv.</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation modal */}
      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title="Confirmer l'action"
      >
        <div className="space-y-4">
          <p className="text-on-surface-variant dark:text-white/60 text-sm">
            Voulez-vous vraiment <strong>{actionLabels[modal?.action]?.label?.toLowerCase()}</strong> l'utilisateur{' '}
            <strong>{modal?.user?.full_name || modal?.user?.email}</strong> ?
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setModal(null)}>Annuler</Button>
            <Button
              variant={actionLabels[modal?.action]?.color || 'primary'}
              loading={saving}
              onClick={handleAction}
            >
              {actionLabels[modal?.action]?.label}
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  )
}
