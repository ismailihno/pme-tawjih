/**
 * pages/payments/PaymentSuccess.jsx
 * Page de succès après paiement Stripe.
 */
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle, ArrowRight } from 'lucide-react'
import { Spinner } from '../../components/ui'

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const type           = searchParams.get('type')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Petit délai pour laisser le webhook Stripe traiter
    const timer = setTimeout(() => setReady(true), 2000)
    return () => clearTimeout(timer)
  }, [])

  const messages = {
    questionnaire: {
      title: 'Accès activé !',
      desc:  'Votre test d\'orientation complet est maintenant disponible.',
      cta:   'Commencer le test',
      link:  '/questionnaire',
    },
    premium: {
      title: 'Premium activé !',
      desc:  'Vous avez accès à toutes les fonctionnalités premium de Tawjih.',
      cta:   'Mon tableau de bord',
      link:  '/dashboard',
    },
    announcement: {
      title: 'Inscription confirmée !',
      desc:  'Votre paiement a été reçu. Le conseiller va vous contacter prochainement.',
      cta:   'Voir mes paiements',
      link:  '/payments',
    },
    counselor_subscription: {
      title: 'Abonnement activé !',
      desc:  'Vous pouvez maintenant publier des annonces et recevoir des paiements.',
      cta:   'Mon espace conseiller',
      link:  '/counselor',
    },
  }

  const msg = messages[type] || {
    title: 'Paiement réussi !',
    desc:  'Votre paiement a été traité avec succès.',
    cta:   'Retour à l\'accueil',
    link:  '/',
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 pt-24">
        <Spinner size="lg" />
        <p className="text-on-surface-variant dark:text-white/50 text-sm">Confirmation du paiement...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center pt-24 pb-16 px-6">
      <div className="max-w-md w-full text-center space-y-8 animate-fade-up">

        <div className="w-24 h-24 rounded-3xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
          <CheckCircle size={48} className="text-green-500" />
        </div>

        <div className="space-y-3">
          <h1 className="font-headline font-bold text-3xl text-on-surface dark:text-white/90">
            {msg.title}
          </h1>
          <p className="text-on-surface-variant dark:text-white/50 leading-relaxed">
            {msg.desc}
          </p>
        </div>

        <div className="bg-surface-container-lowest dark:bg-dark-surface-container rounded-3xl shadow-ambient p-5 text-sm text-on-surface-variant dark:text-white/50">
          Un reçu a été envoyé à votre adresse email.
        </div>

        <Link
          to={msg.link}
          className="btn-primary inline-flex items-center gap-2 text-base px-8 py-4"
        >
          {msg.cta} <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  )
}
