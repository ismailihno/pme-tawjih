/**
 * pages/payments/PaymentCancel.jsx
 * Page d'annulation paiement Stripe.
 */
import { Link } from 'react-router-dom'
import { XCircle, ArrowLeft } from 'lucide-react'

export default function PaymentCancel() {
  return (
    <div className="min-h-screen flex items-center justify-center pt-24 pb-16 px-6">
      <div className="max-w-md w-full text-center space-y-8 animate-fade-up">

        <div className="w-24 h-24 rounded-3xl bg-error-container flex items-center justify-center mx-auto">
          <XCircle size={48} className="text-error" />
        </div>

        <div className="space-y-3">
          <h1 className="font-headline font-bold text-3xl text-on-surface dark:text-white/90">
            Paiement annulé
          </h1>
          <p className="text-on-surface-variant dark:text-white/50">
            Votre paiement a été annulé. Vous n'avez pas été débité.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link to="/" className="btn-primary inline-flex items-center justify-center gap-2">
            Retour à l'accueil
          </Link>
          <Link to="/announcements" className="btn-ghost inline-flex items-center justify-center gap-2">
            <ArrowLeft size={16} /> Voir les annonces
          </Link>
        </div>
      </div>
    </div>
  )
}
