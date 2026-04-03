/**
 * pages/admin/AdminPayments.jsx
 * Tableau unifié : Annonces + Tests étudiants + Abonnements prof
 */
import { useState, useEffect } from 'react'
import api from '../../lib/api'
import AdminLayout from '../../components/admin/AdminLayout'
import { Badge, Spinner, Button, Modal, Alert, EmptyState, Input } from '../../components/ui'
import { CheckCircle, RotateCcw } from 'lucide-react'

const STATUS_COLORS = { pending:'warning', paid:'success', refunded:'danger', failed:'danger' }
const STATUS_LABELS = { pending:'En attente', paid:'Confirmé', refunded:'Remboursé', failed:'Échoué' }

// Badge couleur par type de paiement
const TYPE_STYLE = {
  annonce:    { bg: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',   label: '📋 Annonce'    },
  test:       { bg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',       label: '📝 Test'       },
  abonnement: { bg: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', label: '🎓 Abonnement prof' },
}

export default function AdminPayments() {
  const [allPayments,  setAllPayments]  = useState([])
  const [payments,     setPayments]     = useState([])
  const [stats,        setStats]        = useState({})
  const [loading,      setLoading]      = useState(true)
  const [filter,       setFilter]       = useState('')        // '' | 'annonce' | 'test' | 'abonnement'
  const [modal,        setModal]        = useState(null)
  const [selected,     setSelected]     = useState(null)
  const [notes,        setNotes]        = useState('')
  const [saving,       setSaving]       = useState(false)
  const [feedback,     setFeedback]     = useState({ type:'', msg:'' })

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/payments/admin')
      const all = data.payments || []
      setAllPayments(all)
      setPayments(all)
      setStats({
        total_tests:      data.total_tests      || 0,
        revenue_tests:    data.revenue_tests    || 0,
        total_prof:       data.total_prof       || 0,
        revenue_prof:     data.revenue_prof     || 0,
        total_commission: data.total_commission || 0,
        total_general:    data.total_general    || 0,
        total:            data.total            || 0,
        pending:          data.pending          || 0,
      })
    } catch (err) {
      console.error('Admin payments error:', err)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  // Filtrer par type OU status
  useEffect(() => {
    if (!filter) { setPayments(allPayments); return }
    // Filtre par type de paiement
    if (['annonce','test','abonnement'].includes(filter)) {
      setPayments(allPayments.filter(p => p.payment_type === filter))
    } else {
      // Filtre par status
      setPayments(allPayments.filter(p => p.status === filter))
    }
  }, [filter, allPayments])

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
    } catch { setFeedback({ type:'error', msg:'Erreur.' }) }
    finally { setSaving(false) }
  }

  const studentName = (p) => p?.users?.full_name || '—'
  const annTitle    = (p) => p?.announcements?.title || '—'

  const summaryCards = [
    {
      label: 'PRIX TOTAL',
      sub: 'Tests + Prof + Commissions',
      value: `${parseFloat(stats.total_general || 0).toFixed(0)} MAD`,
      icon: 'account_balance_wallet',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      border: 'border-2 border-emerald-400 dark:border-emerald-700',
      bold: true,
    },
    {
      label: 'Tests étudiants',
      sub: `${stats.total_tests || 0} test(s) × 200 MAD`,
      value: `${parseFloat(stats.revenue_tests || 0).toFixed(0)} MAD`,
      icon: 'quiz', color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/20', border: '',
      filterKey: 'test',
    },
    {
      label: 'Abonnements prof',
      sub: `${stats.total_prof || 0} prof(s) × 150 MAD`,
      value: `${parseFloat(stats.revenue_prof || 0).toFixed(0)} MAD`,
      icon: 'school', color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-900/20', border: '',
      filterKey: 'abonnement',
    },
    {
      label: 'Commissions annonces',
      sub: '20% par inscription',
      value: `${parseFloat(stats.total_commission || 0).toFixed(0)} MAD`,
      icon: 'percent', color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-900/20', border: '',
      filterKey: 'annonce',
    },
    {
      label: 'Paiements annonces',
      sub: 'Total transactions',
      value: stats.total || 0,
      icon: 'receipt_long', color: 'text-primary dark:text-primary-fixed',
      bg: '', border: '',
    },
    {
      label: 'En attente',
      sub: 'À confirmer',
      value: stats.pending || 0,
      icon: 'hourglass_empty', color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-900/20', border: '',
      filterKey: 'pending',
    },
  ]

  return (
    <AdminLayout title="Gestion des paiements">
      <div className="space-y-6">

        {/* ── Cartes résumé (cliquables pour filtrer) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          {summaryCards.map(s => (
            <div
              key={s.label}
              onClick={() => s.filterKey ? setFilter(f => f === s.filterKey ? '' : s.filterKey) : null}
              className={`rounded-3xl p-4 shadow-ambient space-y-2 transition-all
                ${s.bg || 'bg-surface-container-lowest dark:bg-dark-surface-container'}
                ${s.border}
                ${s.filterKey ? 'cursor-pointer hover:scale-105' : ''}
                ${filter === s.filterKey ? 'ring-2 ring-primary' : ''}
              `}
            >
              <span className={`material-symbols-outlined icon-md ${s.color}`}>{s.icon}</span>
              <p className={`font-headline font-bold ${s.bold ? 'text-2xl' : 'text-xl'} text-on-surface dark:text-white/90`}>{s.value}</p>
              <p className={`text-xs ${s.bold ? 'font-bold' : 'font-semibold'} text-on-surface dark:text-white/70`}>{s.label}</p>
              {s.sub && <p className="text-xs text-on-surface-variant dark:text-white/40">{s.sub}</p>}
            </div>
          ))}
        </div>

        {/* ── Légende ── */}
        <div className="bg-surface-container dark:bg-white/5 rounded-2xl px-5 py-3 flex flex-wrap gap-4 text-xs text-on-surface-variant dark:text-white/50">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"/>Tests étudiants : 200 MAD</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"/>Abonnements prof : 150 MAD/mois</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block"/>Commissions annonces : 20%</span>
          <span className="text-on-surface-variant dark:text-white/30 italic">Cliquez sur une carte pour filtrer</span>
        </div>

        <Alert type={feedback.type} message={feedback.msg}/>

        {/* ── Filtres ── */}
        <div className="flex gap-2 flex-wrap">
          {[
            ['', 'Tous'],
            ['annonce', '📋 Annonces'],
            ['test', '📝 Tests'],
            ['abonnement', '🎓 Abonnements prof'],
            ['pending', 'En attente'],
            ['paid', 'Confirmés'],
            ['refunded', 'Remboursés'],
          ].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
                filter === v
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container dark:bg-white/10 text-on-surface-variant dark:text-white/50 hover:bg-surface-container-high'
              }`}>{l}</button>
          ))}
        </div>

        <p className="text-sm text-on-surface-variant dark:text-white/40">
          {payments.length} transaction{payments.length > 1 ? 's' : ''} affichée{payments.length > 1 ? 's' : ''}
        </p>

        {/* ── Tableau ── */}
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
                    {['Utilisateur', 'Type', 'Description', 'Montant prof', 'Commission', 'Total payé', 'Statut', 'Date', 'Actions'].map(h => (
                      <th key={h} className={`px-4 py-4 text-left text-xs font-semibold text-on-surface-variant dark:text-white/40 uppercase tracking-wider ${h === 'Actions' ? 'text-right' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container dark:divide-white/5">
                  {payments.map(p => {
                    const typeStyle    = TYPE_STYLE[p.payment_type] || TYPE_STYLE.annonce
                    const montantProf  = parseFloat(p.counselor_payout   || 0)
                    const commission   = parseFloat(p.commission_amount   || 0)
                    const totalPaye    = parseFloat(p.amount              || 0)
                    const isReal       = p.payment_type === 'annonce' // seules les annonces ont des actions
                    return (
                      <tr key={p.id} className="hover:bg-surface-container-low dark:hover:bg-white/3 transition-colors">
                        {/* Utilisateur */}
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold text-on-surface dark:text-white/80">{studentName(p)}</p>
                          <p className="text-xs text-on-surface-variant dark:text-white/40">{p.users?.email || ''}</p>
                        </td>
                        {/* Type badge */}
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${typeStyle.bg}`}>
                            {typeStyle.label}
                          </span>
                        </td>
                        {/* Description */}
                        <td className="px-4 py-3 text-sm text-on-surface-variant dark:text-white/50 max-w-[150px] truncate">
                          {annTitle(p)}
                        </td>
                        {/* Montant prof (80%) - seulement pour annonces */}
                        <td className="px-4 py-3">
                          {p.payment_type === 'annonce' ? (
                            <>
                              <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">{montantProf.toFixed(0)} MAD</p>
                              <p className="text-xs text-on-surface-variant dark:text-white/30">80%</p>
                            </>
                          ) : (
                            <p className="text-xs text-on-surface-variant dark:text-white/30">—</p>
                          )}
                        </td>
                        {/* Commission */}
                        <td className="px-4 py-3">
                          {p.payment_type === 'annonce' ? (
                            <>
                              <p className="text-sm font-semibold text-green-600 dark:text-green-400">{commission.toFixed(0)} MAD</p>
                              <p className="text-xs text-on-surface-variant dark:text-white/30">20%</p>
                            </>
                          ) : (
                            <p className="text-xs text-on-surface-variant dark:text-white/30">—</p>
                          )}
                        </td>
                        {/* Total payé */}
                        <td className="px-4 py-3">
                          <p className="text-sm font-bold text-on-surface dark:text-white/90">{totalPaye.toFixed(0)} MAD</p>
                        </td>
                        {/* Statut */}
                        <td className="px-4 py-3">
                          <Badge variant={STATUS_COLORS[p.status] || 'success'}>
                            {STATUS_LABELS[p.status] || 'Confirmé'}
                          </Badge>
                        </td>
                        {/* Date */}
                        <td className="px-4 py-3 text-xs text-on-surface-variant dark:text-white/40">
                          {p.paid_at ? new Date(p.paid_at).toLocaleDateString('fr-MA', { day:'numeric', month:'short', year:'numeric' }) : '—'}
                        </td>
                        {/* Actions (seulement pour annonces réelles) */}
                        <td className="px-4 py-3 text-right">
                          {isReal && (
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
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal Confirmer */}
      <Modal open={modal==='confirm'} onClose={() => setModal(null)} title="Confirmer le paiement">
        <div className="space-y-4">
          <div className="bg-surface-container dark:bg-white/5 rounded-2xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-on-surface-variant dark:text-white/50">Étudiant</span>
              <span className="font-semibold">{studentName(selected || {})}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant dark:text-white/50">Part prof (80%)</span>
              <span className="font-semibold text-purple-600">{parseFloat(selected?.counselor_payout || 0).toFixed(0)} MAD</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant dark:text-white/50">Commission (20%)</span>
              <span className="font-semibold text-green-600">{parseFloat(selected?.commission_amount || 0).toFixed(0)} MAD</span>
            </div>
            <div className="flex justify-between border-t border-surface-container dark:border-white/10 pt-2">
              <span className="font-bold">Total</span>
              <span className="font-bold text-lg">{parseFloat(selected?.amount || 0).toFixed(0)} MAD</span>
            </div>
          </div>
          <Input label="Notes (optionnel)" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Référence..."/>
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
        <Input label="Raison" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Motif..."/>
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={() => setModal(null)}>Annuler</Button>
          <Button variant="danger" loading={saving} onClick={handleRefund}>Rembourser</Button>
        </div>
      </Modal>
    </AdminLayout>
  )
}