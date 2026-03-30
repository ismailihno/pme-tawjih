/**
 * pages/admin/AdminPayments.jsx
 * FIX 1 : route /payments/admin/all → /payments/admin
 * FIX 2 : p['users!payments_student_id_fkey'] → p.users (correspond au backend corrigé)
 */
import { useState, useEffect } from 'react'
import api from '../../lib/api'
import AdminLayout from '../../components/admin/AdminLayout'
import { Badge, Spinner, Button, Modal, Alert, EmptyState, Input } from '../../components/ui'
import { CheckCircle, RotateCcw } from 'lucide-react'

const STATUS_COLORS = { pending:'warning', paid:'success', refunded:'danger', failed:'danger' }
const STATUS_LABELS = { pending:'En attente', paid:'Confirmé', refunded:'Remboursé', failed:'Échoué' }

export default function AdminPayments() {
  const [payments,  setPayments]  = useState([])
  const [total,     setTotal]     = useState(0)
  const [revenue,   setRevenue]   = useState(0)
  const [loading,   setLoading]   = useState(true)
  const [status,    setStatus]    = useState('')
  const [page,      setPage]      = useState(1)
  const [modal,     setModal]     = useState(null)
  const [selected,  setSelected]  = useState(null)
  const [notes,     setNotes]     = useState('')
  const [saving,    setSaving]    = useState(false)
  const [feedback,  setFeedback]  = useState({ type:'', msg:'' })

  const load = async () => {
    setLoading(true)
    try {
      // FIX 1 : bonne route /payments/admin (pas /payments/admin/all)
      const { data } = await api.get('/payments/admin')
      const all = data.payments || []

      // Filtrer côté frontend selon le status sélectionné
      const filtered = status ? all.filter(p => p.status === status) : all

      setPayments(filtered)
      setTotal(all.length)
      setRevenue(data.total_commission || 0)
    } catch (err) {
      console.error('Admin payments error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page, status])

  const handleConfirm = async () => {
    setSaving(true); setFeedback({ type:'', msg:'' })
    try {
      await api.post(`/payments/confirm/${selected.id}`, { notes })
      setFeedback({ type:'success', msg:'Paiement confirmé.' })
      setModal(null); load()
    } catch (err) {
      setFeedback({ type:'error', msg: err.response?.data?.error || 'Erreur.' })
    } finally { setSaving(false) }
  }

  const handleRefund = async () => {
    setSaving(true)
    try {
      await api.post(`/payments/refund/${selected.id}`, { notes })
      setFeedback({ type:'success', msg:'Remboursement effectué.' })
      setModal(null); load()
    } catch {
      setFeedback({ type:'error', msg:'Erreur.' })
    } finally { setSaving(false) }
  }

  // FIX 2 : helper pour lire les noms depuis p.users (nouveau format backend)
  const studentName   = (p) => p.users?.full_name || p['users!payments_student_id_fkey']?.full_name || '—'
  const counselorName = (p) => p.counselor_name   || p['users!payments_counselor_id_fkey']?.full_name || '—'
  const annTitle      = (p) => p.announcements?.title || '—'

  const pending = payments.filter(p => p.status === 'pending').length

  return (
    <AdminLayout title="Gestion des paiements">
      <div className="space-y-6">

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label:'Commission totale', value:`${parseFloat(revenue || 0).toFixed(0)} MAD`, icon:'payments',       color:'text-green-600' },
            { label:'Total paiements',   value:total,                                          icon:'receipt_long',   color:'text-primary dark:text-primary-fixed' },
            { label:'En attente',        value:pending,                                        icon:'hourglass_empty',color:'text-amber-600' },
          ].map(s => (
            <div key={s.label} className="bg-surface-container-lowest dark:bg-dark-surface-container rounded-3xl p-4 shadow-ambient space-y-2">
              <span className={`material-symbols-outlined icon-md ${s.color}`}>{s.icon}</span>
              <p className="font-headline font-bold text-xl text-on-surface dark:text-white/90">{s.value}</p>
              <p className="text-xs text-on-surface-variant dark:text-white/40">{s.label}</p>
            </div>
          ))}
        </div>

        <Alert type={feedback.type} message={feedback.msg}/>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {[['','Tous'],['pending','En attente'],['paid','Confirmés'],['refunded','Remboursés']].map(([v,l]) => (
            <button key={v} onClick={() => { setStatus(v); setPage(1) }}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                status === v
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container dark:bg-white/10 text-on-surface-variant dark:text-white/50 hover:bg-surface-container-high'
              }`}>{l}</button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg"/></div>
        ) : payments.length === 0 ? (
          <EmptyState icon="receipt_long" title="Aucun paiement" description="Aucun paiement dans cette catégorie."/>
        ) : (
          <div className="bg-surface-container-lowest dark:bg-dark-surface-container rounded-3xl shadow-ambient overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-container dark:border-white/5">
                    {['Étudiant','Annonce','Montant','Commission','Statut','Date','Actions'].map(h => (
                      <th key={h} className={`px-4 py-4 text-left text-xs font-semibold text-on-surface-variant dark:text-white/40 uppercase tracking-wider ${h==='Actions'?'text-right':''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container dark:divide-white/5">
                  {payments.map(p => (
                    <tr key={p.id} className="hover:bg-surface-container-low dark:hover:bg-white/3 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-on-surface dark:text-white/80">{studentName(p)}</p>
                        <p className="text-xs text-on-surface-variant dark:text-white/40">{p.users?.email || ''}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-on-surface-variant dark:text-white/50 max-w-[140px] truncate">{annTitle(p)}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-on-surface dark:text-white/80">{parseFloat(p.amount || 0).toFixed(0)} MAD</td>
                      <td className="px-4 py-3 text-sm text-green-600 font-semibold">{parseFloat(p.commission_amount || 0).toFixed(0)} MAD</td>
                      <td className="px-4 py-3"><Badge variant={STATUS_COLORS[p.status]}>{STATUS_LABELS[p.status] || p.status}</Badge></td>
                      <td className="px-4 py-3 text-xs text-on-surface-variant dark:text-white/40">
                        {p.paid_at ? new Date(p.paid_at).toLocaleDateString('fr-MA', { day:'numeric', month:'short', year:'numeric' }) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {p.status === 'pending' && (
                            <button onClick={() => { setSelected(p); setNotes(''); setModal('confirm') }}
                              className="p-1.5 rounded-lg text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20 transition-colors" title="Confirmer">
                              <CheckCircle size={15}/>
                            </button>
                          )}
                          {p.status === 'paid' && (
                            <button onClick={() => { setSelected(p); setNotes(''); setModal('refund') }}
                              className="p-1.5 rounded-lg text-error hover:bg-error-container/30 transition-colors" title="Rembourser">
                              <RotateCcw size={15}/>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal Confirmer */}
      <Modal open={modal==='confirm'} onClose={() => setModal(null)} title="Confirmer le paiement">
        <div className="space-y-4">
          <p className="text-sm text-on-surface-variant dark:text-white/60">
            Confirmer le paiement de <strong>{parseFloat(selected?.amount || 0).toFixed(0)} MAD</strong> de <strong>{studentName(selected || {})}</strong> ?
            Le conseiller recevra <strong>{parseFloat(selected?.counselor_payout || 0).toFixed(0)} MAD</strong>.
          </p>
          <Input label="Notes (optionnel)" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Référence virement confirmée..."/>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setModal(null)}>Annuler</Button>
            <Button loading={saving} onClick={handleConfirm}>Confirmer</Button>
          </div>
        </div>
      </Modal>

      {/* Modal Rembourser */}
      <Modal open={modal==='refund'} onClose={() => setModal(null)} title="Rembourser le paiement">
        <p className="text-sm text-on-surface-variant dark:text-white/60 mb-4">
          Rembourser <strong>{parseFloat(selected?.amount || 0).toFixed(0)} MAD</strong> à <strong>{studentName(selected || {})}</strong> ?
        </p>
        <Input label="Raison" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Motif du remboursement..."/>
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={() => setModal(null)}>Annuler</Button>
          <Button variant="danger" loading={saving} onClick={handleRefund}>Rembourser</Button>
        </div>
      </Modal>
    </AdminLayout>
  )
}