/**
 * pages/admin/AdminAdmins.jsx
 * Create new admin accounts and manage existing ones.
 */

import { useState, useEffect } from 'react'
import api from '../../lib/api'
import AdminLayout from '../../components/admin/AdminLayout'
import { Input, Button, Badge, Spinner, Modal, Alert, EmptyState, Card } from '../../components/ui'
import { Plus, UserX } from 'lucide-react'

export default function AdminAdmins() {
  const [admins, setAdmins]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(false)
  const [deactivateTarget, setDeactivateTarget] = useState(null)
  const [form, setForm]         = useState({ full_name:'',email:'',password:'' })
  const [saving, setSaving]     = useState(false)
  const [feedback, setFeedback] = useState({ type:'',msg:'' })

  const load = () => {
    api.get('/admins/users?role=admin').then(res => {
      setAdmins(res.data.users || [])
    }).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const set = (k,v) => setForm(f => ({...f,[k]:v}))

  const handleCreate = async () => {
    if (!form.email || !form.password || !form.full_name) {
      return setFeedback({ type:'error', msg:'Tous les champs sont requis.' })
    }
    if (form.password.length < 6) {
      return setFeedback({ type:'error', msg:'Mot de passe trop court (6 min).' })
    }
    setSaving(true); setFeedback({type:'',msg:''})
    try {
      await api.post('/admins/create', form)
      setFeedback({ type:'success', msg:`Admin ${form.full_name} créé.` })
      setModal(false)
      setForm({ full_name:'',email:'',password:'' })
      load()
    } catch (err) {
      setFeedback({ type:'error', msg: err.response?.data?.error || 'Erreur.' })
    } finally { setSaving(false) }
  }

  const handleDeactivate = async () => {
    if (!deactivateTarget) return
    setSaving(true)
    try {
      await api.delete(`/admins/users/${deactivateTarget.id}`)
      setFeedback({ type:'success', msg:'Compte désactivé.' })
      setDeactivateTarget(null)
      load()
    } catch (err) {
      setFeedback({ type:'error', msg: err.response?.data?.error || 'Erreur.' })
    } finally { setSaving(false) }
  }

  return (
    <AdminLayout title="Gestion des admins">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-sm text-on-surface-variant dark:text-white/40">
            {admins.length} administrateur{admins.length !== 1 ? 's' : ''} enregistré{admins.length !== 1 ? 's' : ''}
          </p>
          <Button onClick={() => setModal(true)} className="flex items-center gap-2">
            <Plus size={16} /> Nouvel admin
          </Button>
        </div>

        <Alert type={feedback.type} message={feedback.msg} />

        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : admins.length === 0 ? (
          <EmptyState
            icon="admin_panel_settings"
            title="Aucun administrateur"
            description="Créez le premier compte admin."
            action={<Button onClick={() => setModal(true)} className="flex items-center gap-2"><Plus size={16}/>Créer un admin</Button>}
          />
        ) : (
          <div className="grid sm:grid-cols-2 gap-4 stagger">
            {admins.map(admin => (
              <Card key={admin.id} className="flex items-center gap-4 animate-fade-up">
                <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shrink-0 text-lg font-headline font-bold text-white">
                  {admin.full_name?.[0]?.toUpperCase() || 'A'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-headline font-semibold text-on-surface dark:text-white/90 truncate">{admin.full_name}</p>
                  <p className="text-xs text-on-surface-variant dark:text-white/40 truncate">{admin.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="primary">Admin</Badge>
                    <Badge variant={admin.is_active ? 'success' : 'danger'}>
                      {admin.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                </div>
                <button
                  onClick={() => setDeactivateTarget(admin)}
                  className="p-2 rounded-xl text-error hover:bg-error-container/30 transition-colors shrink-0"
                  title="Désactiver"
                >
                  <UserX size={16} />
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create admin modal */}
      <Modal open={modal} onClose={() => { setModal(false); setFeedback({type:'',msg:''}) }} title="Créer un compte admin">
        <div className="space-y-4">
          <Alert type={feedback.type} message={feedback.msg} />
          <Input label="Nom complet *" value={form.full_name} onChange={e=>set('full_name',e.target.value)} placeholder="Ahmed Benali" />
          <Input label="Email *" type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="admin@tawjih.ma" />
          <Input label="Mot de passe *" type="password" value={form.password} onChange={e=>set('password',e.target.value)} placeholder="6 caractères minimum" minLength={6} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setModal(false)}>Annuler</Button>
            <Button loading={saving} onClick={handleCreate}>Créer l'admin</Button>
          </div>
        </div>
      </Modal>

      {/* Deactivate confirm */}
      <Modal open={!!deactivateTarget} onClose={() => setDeactivateTarget(null)} title="Désactiver le compte">
        <p className="text-sm text-on-surface-variant dark:text-white/60 mb-5">
          Voulez-vous désactiver le compte de <strong>{deactivateTarget?.full_name}</strong> ?
          L'utilisateur ne pourra plus se connecter.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeactivateTarget(null)}>Annuler</Button>
          <Button variant="danger" loading={saving} onClick={handleDeactivate}>Désactiver</Button>
        </div>
      </Modal>
    </AdminLayout>
  )
}
