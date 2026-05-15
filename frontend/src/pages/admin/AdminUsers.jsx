/**
 * pages/admin/AdminUsers.jsx
 *
 * MODIFICATION : Ajout d'un onglet "🚩 Signalements" qui affiche
 * tous les signalements d'annonces envoyés par les étudiants,
 * avec possibilité de résoudre ou ignorer chaque signalement.
 */

import { useState, useEffect } from 'react'
import api from '../../lib/api'
import AdminLayout from '../../components/admin/AdminLayout'
import { Select, Button, Badge, Spinner, Modal, Alert, EmptyState } from '../../components/ui'
import { Search, UserCheck, UserX, Shield, Flag, CheckCircle, XCircle, Clock } from 'lucide-react'

export default function AdminUsers() {
  const [activeTab, setActiveTab] = useState('users') // 'users' | 'reports'

  // ── Utilisateurs ─────────────────────────────────────────────
  const [users, setUsers]       = useState([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [role, setRole]         = useState('')
  const [page, setPage]         = useState(1)
  const [modal, setModal]       = useState(null)
  const [saving, setSaving]     = useState(false)
  const [feedback, setFeedback] = useState({ type: '', msg: '' })

  // ── Signalements ─────────────────────────────────────────────
  const [reports, setReports]         = useState([])
  const [reportsLoading, setRLoading] = useState(false)
  const [reportModal, setReportModal] = useState(null)
  const [adminNote, setAdminNote]     = useState('')
  const [reportSaving, setRSaving]    = useState(false)
  const [reportFilter, setRFilter]    = useState('pending')

  // ── Load utilisateurs ─────────────────────────────────────────
  const loadUsers = async () => {
    setLoading(true)
    const params = new URLSearchParams({ page, limit: 20 })
    if (search) params.set('search', search)
    if (role)   params.set('role', role)
    try {
      const { data } = await api.get(`/admins/users?${params}`)
      setUsers(data.users || [])
      setTotal(data.total || 0)
    } finally { setLoading(false) }
  }

  // ── Load signalements ─────────────────────────────────────────
  const loadReports = async () => {
    setRLoading(true)
    try {
      const { data } = await api.get('/admins/reports')
      setReports(data.reports || [])
    } catch {
      setReports([])
    } finally { setRLoading(false) }
  }

  useEffect(() => { loadUsers() }, [page, search, role])
  useEffect(() => { if (activeTab === 'reports') loadReports() }, [activeTab])

  // ── Actions utilisateurs ──────────────────────────────────────
  const handleUserAction = async () => {
    if (!modal) return
    setSaving(true)
    try {
      const { user, action } = modal
      if (action === 'suspend')     await api.put(`/admins/users/${user.id}`, { is_active: false })
      if (action === 'activate')    await api.put(`/admins/users/${user.id}`, { is_active: true })
      if (action === 'makeAdmin')   await api.put(`/admins/users/${user.id}`, { role: 'admin' })
      if (action === 'makeStudent') await api.put(`/admins/users/${user.id}`, { role: 'student' })
      setFeedback({ type: 'success', msg: 'Utilisateur mis à jour.' })
      setModal(null)
      loadUsers()
    } catch (err) {
      setFeedback({ type: 'error', msg: err.response?.data?.error || 'Erreur.' })
    } finally { setSaving(false) }
  }

  // ── Traitement signalement ────────────────────────────────────
  const handleReport = async () => {
    if (!reportModal) return
    setRSaving(true)
    try {
      await api.patch(`/admins/reports/${reportModal.report.id}`, {
        status:     reportModal.action,
        admin_note: adminNote.trim() || null,
      })
      setReportModal(null)
      setAdminNote('')
      loadReports()
    } catch (err) {
      setFeedback({ type: 'error', msg: err.response?.data?.error || 'Erreur.' })
    } finally { setRSaving(false) }
  }

  const actionLabels = {
    suspend:     { label: 'Suspendre',            color: 'danger' },
    activate:    { label: 'Activer',              color: 'secondary' },
    makeAdmin:   { label: 'Promouvoir admin',     color: 'primary' },
    makeStudent: { label: 'Rétrograder étudiant', color: 'outline' },
  }

  const statusBadge = (status) => {
    if (status === 'pending')   return <Badge variant="warning"  className="flex items-center gap-1"><Clock size={11}/>En attente</Badge>
    if (status === 'resolved')  return <Badge variant="success"  className="flex items-center gap-1"><CheckCircle size={11}/>Résolu</Badge>
    if (status === 'dismissed') return <Badge variant="default"  className="flex items-center gap-1"><XCircle size={11}/>Ignoré</Badge>
  }

  const filteredReports = reportFilter === 'all'
    ? reports
    : reports.filter(r => r.status === reportFilter)

  const pendingCount = reports.filter(r => r.status === 'pending').length

  return (
    <AdminLayout title="Utilisateurs & Signalements">
      <div className="space-y-6">

        <Alert type={feedback.type} message={feedback.msg} />

        {/* ── Onglets ── */}
        <div className="flex gap-1 bg-surface-container dark:bg-white/5 rounded-2xl p-1 w-fit">
          <button onClick={() => setActiveTab('users')}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === 'users' ? 'bg-surface-container-lowest dark:bg-dark-surface-container text-on-surface dark:text-white/90 shadow-sm' : 'text-on-surface-variant dark:text-white/40 hover:text-on-surface dark:hover:text-white/70'}`}>
            👥 Utilisateurs
          </button>
          <button onClick={() => setActiveTab('reports')}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'reports' ? 'bg-surface-container-lowest dark:bg-dark-surface-container text-on-surface dark:text-white/90 shadow-sm' : 'text-on-surface-variant dark:text-white/40 hover:text-on-surface dark:hover:text-white/70'}`}>
            <Flag size={14} /> Signalements
            {pendingCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">{pendingCount}</span>
            )}
          </button>
        </div>

        {/* ══════════════ ONGLET UTILISATEURS ══════════════ */}
        {activeTab === 'users' && (
          <>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-white/30" />
                <input className="input-field pl-10 dark:bg-dark-surface-container dark:text-white/90"
                  placeholder="Rechercher par nom ou email..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Select placeholder="Tous les rôles"
                options={[{ value:'student',label:'Étudiant' },{ value:'counselor',label:'Conseiller' },{ value:'admin',label:'Admin' }]}
                value={role} onChange={e => setRole(e.target.value)} className="sm:w-44" />
            </div>

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
                        {['Utilisateur','Bac / Ville','Rôle','Statut','Actions'].map((h,i) => (
                          <th key={h} className={`px-5 py-4 text-xs font-semibold text-on-surface-variant dark:text-white/40 uppercase tracking-wider ${i===4?'text-right':'text-left'} ${i===1?'hidden sm:table-cell':''}`}>{h}</th>
                        ))}
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
                            <p className="text-sm text-on-surface-variant dark:text-white/50">{u.students?.bac_type || '—'}</p>
                            <p className="text-xs text-on-surface-variant/60 dark:text-white/30">{u.students?.city || ''}</p>
                          </td>
                          <td className="px-5 py-4">
                            <Badge variant={u.role==='admin'?'primary':u.role==='counselor'?'secondary':'default'}>
                              {u.role==='admin'?'Admin':u.role==='counselor'?'Conseiller':'Étudiant'}
                            </Badge>
                          </td>
                          <td className="px-5 py-4">
                            <Badge variant={u.is_active?'success':'danger'}>{u.is_active?'Actif':'Suspendu'}</Badge>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {u.is_active
                                ? <button onClick={() => setModal({user:u,action:'suspend'})} className="p-1.5 rounded-lg text-error hover:bg-error-container/30 transition-colors" title="Suspendre"><UserX size={15}/></button>
                                : <button onClick={() => setModal({user:u,action:'activate'})} className="p-1.5 rounded-lg text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20 transition-colors" title="Activer"><UserCheck size={15}/></button>
                              }
                              {u.role==='student' && <button onClick={() => setModal({user:u,action:'makeAdmin'})} className="p-1.5 rounded-lg text-primary dark:text-primary-fixed hover:bg-primary/10 transition-colors" title="Promouvoir"><Shield size={15}/></button>}
                              {u.role==='admin' && <button onClick={() => setModal({user:u,action:'makeStudent'})} className="p-1.5 rounded-lg text-on-surface-variant dark:text-white/40 hover:bg-surface-container transition-colors text-xs font-semibold px-2">Rétrograder</button>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {total > 20 && (
                  <div className="flex justify-between items-center px-5 py-4 border-t border-surface-container dark:border-white/5">
                    <p className="text-xs text-on-surface-variant dark:text-white/40">{total} utilisateurs</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setPage(p=>Math.max(1,p-1))} disabled={page===1}>Préc.</Button>
                      <Button variant="outline" size="sm" onClick={() => setPage(p=>p+1)} disabled={page>=Math.ceil(total/20)}>Suiv.</Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ══════════════ ONGLET SIGNALEMENTS ══════════════ */}
        {activeTab === 'reports' && (
          <>
            <div className="flex gap-2 flex-wrap">
              {[
                { key:'pending',   label:'⏳ En attente' },
                { key:'resolved',  label:'✅ Résolus' },
                { key:'dismissed', label:'❌ Ignorés' },
                { key:'all',       label:'📋 Tous' },
              ].map(f => (
                <button key={f.key} onClick={() => setRFilter(f.key)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${reportFilter===f.key?'bg-primary text-on-primary':'bg-surface-container dark:bg-white/5 text-on-surface-variant dark:text-white/50 hover:bg-surface-container-high'}`}>
                  {f.label}
                  {f.key==='pending' && pendingCount > 0 && (
                    <span className="ml-1.5 bg-red-500 text-white rounded-full px-1.5 py-0.5 text-xs">{pendingCount}</span>
                  )}
                </button>
              ))}
            </div>

            {reportsLoading ? (
              <div className="flex justify-center py-16"><Spinner size="lg" /></div>
            ) : filteredReports.length === 0 ? (
              <EmptyState icon="flag" title="Aucun signalement"
                description={reportFilter==='pending'?"Aucun signalement en attente.":"Aucun signalement dans cette catégorie."} />
            ) : (
              <div className="space-y-3">
                {filteredReports.map(report => (
                  <div key={report.id}
                    className={`bg-surface-container-lowest dark:bg-dark-surface-container rounded-2xl shadow-ambient p-5 space-y-4 border-l-4 ${
                      report.status==='pending'?'border-orange-400':report.status==='resolved'?'border-green-500':'border-gray-300 dark:border-white/10'
                    }`}>

                    {/* En-tête */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center shrink-0">
                          <Flag size={18} className="text-red-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-on-surface dark:text-white/90">
                            Signalement — <span className="text-primary dark:text-primary-fixed">
                              {report.announcements?.title || 'Annonce supprimée'}
                            </span>
                          </p>
                          <p className="text-xs text-on-surface-variant dark:text-white/40">
                            Conseiller : {report.announcements?.users?.full_name || '—'}
                          </p>
                        </div>
                      </div>
                      {statusBadge(report.status)}
                    </div>

                    {/* Infos */}
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="bg-surface-container-low dark:bg-white/5 rounded-xl p-3 space-y-0.5">
                        <p className="text-xs font-semibold text-on-surface-variant dark:text-white/40 uppercase tracking-wide">Signalé par</p>
                        <p className="text-sm font-semibold text-on-surface dark:text-white/80">{report.users?.full_name || '—'}</p>
                        <p className="text-xs text-on-surface-variant dark:text-white/40">{report.users?.email || ''}</p>
                      </div>
                      <div className="bg-surface-container-low dark:bg-white/5 rounded-xl p-3 space-y-0.5">
                        <p className="text-xs font-semibold text-on-surface-variant dark:text-white/40 uppercase tracking-wide">Date</p>
                        <p className="text-sm text-on-surface dark:text-white/80">
                          {new Date(report.created_at).toLocaleDateString('fr-MA',{day:'numeric',month:'long',year:'numeric'})}
                        </p>
                      </div>
                    </div>

                    {/* Cause */}
                    <div className="bg-orange-50 dark:bg-orange-900/10 rounded-xl p-3 space-y-1">
                      <p className="text-xs font-semibold text-orange-700 dark:text-orange-400">Cause</p>
                      <p className="text-sm font-semibold text-on-surface dark:text-white/80">{report.cause}</p>
                      {report.comment !== report.cause && (
                        <p className="text-xs text-on-surface-variant dark:text-white/50">{report.comment}</p>
                      )}
                    </div>

                    {/* Note admin */}
                    {report.admin_note && (
                      <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-3">
                        <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">Note admin</p>
                        <p className="text-sm text-on-surface dark:text-white/70">{report.admin_note}</p>
                      </div>
                    )}

                    {/* Actions */}
                    {report.status === 'pending' && (
                      <div className="flex gap-2">
                        <button onClick={() => { setReportModal({report,action:'resolved'}); setAdminNote('') }}
                          className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-sm font-semibold bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-200 transition-colors">
                          <CheckCircle size={14}/> Résoudre
                        </button>
                        <button onClick={() => { setReportModal({report,action:'dismissed'}); setAdminNote('') }}
                          className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-sm font-semibold bg-surface-container dark:bg-white/5 text-on-surface-variant dark:text-white/50 hover:bg-surface-container-high transition-colors">
                          <XCircle size={14}/> Ignorer
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal utilisateur */}
      <Modal open={!!modal} onClose={() => setModal(null)} title="Confirmer l'action">
        <div className="space-y-4">
          <p className="text-on-surface-variant dark:text-white/60 text-sm">
            Voulez-vous vraiment <strong>{actionLabels[modal?.action]?.label?.toLowerCase()}</strong> l'utilisateur{' '}
            <strong>{modal?.user?.full_name || modal?.user?.email}</strong> ?
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setModal(null)}>Annuler</Button>
            <Button variant={actionLabels[modal?.action]?.color||'primary'} loading={saving} onClick={handleUserAction}>
              {actionLabels[modal?.action]?.label}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal signalement */}
      <Modal open={!!reportModal} onClose={() => setReportModal(null)}
        title={reportModal?.action==='resolved'?'✅ Résoudre le signalement':'❌ Ignorer le signalement'}>
        <div className="space-y-4">
          <div className={`rounded-xl p-3 text-sm ${reportModal?.action==='resolved'?'bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400':'bg-gray-50 dark:bg-white/5 text-on-surface-variant dark:text-white/50'}`}>
            {reportModal?.action==='resolved'
              ? 'Vous confirmez avoir pris les mesures nécessaires.'
              : 'Ce signalement ne nécessite pas d\'action de votre part.'}
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-on-surface dark:text-white/80">Note administrative (optionnelle)</p>
            <textarea value={adminNote} onChange={e=>setAdminNote(e.target.value)}
              placeholder="Ex : Conseiller averti, annonce suspendue..."
              rows={3}
              className="w-full rounded-xl bg-surface-container dark:bg-white/5 border border-surface-container dark:border-white/10 text-sm text-on-surface dark:text-white/80 placeholder-on-surface-variant dark:placeholder-white/30 p-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setReportModal(null)}>Annuler</Button>
            <Button variant={reportModal?.action==='resolved'?'secondary':'outline'} loading={reportSaving} onClick={handleReport}>
              Confirmer
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  )
}