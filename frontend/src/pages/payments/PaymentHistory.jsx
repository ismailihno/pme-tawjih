/**
 * pages/payments/PaymentHistory.jsx
 * Historique des paiements de l'étudiant connecté.
 */
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import { Card, Badge, Spinner, EmptyState, PageHeader } from '../../components/ui'
import { ArrowRight } from 'lucide-react'

const STATUS_COLORS = { pending:'warning', paid:'success', refunded:'danger', failed:'danger' }
const STATUS_LABELS = { pending:'En attente', paid:'Confirmé', refunded:'Remboursé', failed:'Échoué' }
const STATUS_ICONS  = { pending:'hourglass_empty', paid:'check_circle', refunded:'currency_exchange', failed:'cancel' }

export default function PaymentHistory() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    api.get('/payments/my').then(res => setPayments(res.data.payments || [])).finally(()=>setLoading(false))
  }, [])

  if (loading) return <div className="min-h-screen flex items-center justify-center pt-24"><Spinner size="lg"/></div>

  const totalPaid = payments.filter(p=>p.status==='paid').reduce((s,p)=>s+parseFloat(p.amount),0)

  return (
    <div className="max-w-3xl mx-auto px-6 pt-28 pb-16">
      <PageHeader label="Mon compte" title="Mes paiements" subtitle="Historique de vos inscriptions et paiements."/>

      {totalPaid > 0 && (
        <div className="bg-primary rounded-3xl p-6 text-white flex items-center justify-between mb-8 zellige-bg shadow-ambient-md">
          <div>
            <p className="text-white/60 text-sm">Total investi</p>
            <p className="font-headline font-extrabold text-3xl text-secondary-container">{totalPaid.toFixed(0)} MAD</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center">
            <span className="material-symbols-outlined text-white icon-xl">school</span>
          </div>
        </div>
      )}

      {payments.length === 0 ? (
        <EmptyState icon="receipt_long" title="Aucun paiement" description="Inscrivez-vous à une annonce de conseiller pour commencer."
          action={<Link to="/announcements" className="btn-primary inline-flex items-center gap-2">Voir les annonces <ArrowRight size={16}/></Link>}/>
      ) : (
        <div className="space-y-4">
          {payments.map(p => (
            <Card key={p.id} hover={false} className="flex items-center gap-4">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                p.status==='paid' ? 'bg-green-100 dark:bg-green-900/30' :
                p.status==='pending' ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-error-container'
              }`}>
                <span className={`material-symbols-outlined icon-md ${
                  p.status==='paid' ? 'text-green-600' :
                  p.status==='pending' ? 'text-amber-600' : 'text-error'
                }`}>{STATUS_ICONS[p.status]}</span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-on-surface dark:text-white/90 truncate">
                  {p.announcements?.title || 'Annonce'}
                </p>
                <p className="text-xs text-on-surface-variant dark:text-white/40">
                  Conseiller : {p.users?.full_name || '—'}
                  {p.announcements?.schools && ` · ${p.announcements.schools.name}`}
                </p>
                <p className="text-xs text-on-surface-variant/60 dark:text-white/30 mt-0.5">
                  {new Date(p.created_at).toLocaleDateString('fr-MA',{day:'numeric',month:'long',year:'numeric'})}
                </p>
              </div>

              <div className="text-right shrink-0 space-y-1">
                <p className="font-headline font-bold text-on-surface dark:text-white/90">
                  {parseFloat(p.amount).toFixed(0)} MAD
                </p>
                <Badge variant={STATUS_COLORS[p.status]}>{STATUS_LABELS[p.status]}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      {payments.some(p=>p.status==='pending') && (
        <div className="mt-8 bg-secondary-container/10 dark:bg-secondary-container/5 border border-secondary-container/30 rounded-3xl p-5 flex gap-3">
          <span className="material-symbols-outlined text-secondary dark:text-secondary-container icon-md shrink-0">info</span>
          <div className="text-sm">
            <p className="font-semibold text-on-surface dark:text-white/80 mb-1">Paiement en attente</p>
            <p className="text-on-surface-variant dark:text-white/50">
              Effectuez votre virement et envoyez la preuve par email. Confirmation sous 24h ouvrées.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
