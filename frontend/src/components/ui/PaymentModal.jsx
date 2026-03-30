/**
 * components/ui/PaymentModal.jsx
 * Faux formulaire de carte bancaire — accepte n'importe quelles infos
 */
import { useState } from 'react'
import { CreditCard, Lock, CheckCircle } from 'lucide-react'
import { Button, Alert } from './index'

// Formater le numéro de carte : XXXX XXXX XXXX XXXX
function formatCard(val) {
  return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
}

// Formater expiry : MM/YY
function formatExpiry(val) {
  const v = val.replace(/\D/g, '').slice(0, 4)
  if (v.length >= 3) return v.slice(0, 2) + '/' + v.slice(2)
  return v
}

export default function PaymentModal({ open, onClose, amount, description, onSuccess }) {
  const [form, setForm] = useState({ name: '', number: '', expiry: '', cvv: '' })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState(false)

  if (!open) return null

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    const num = form.number.replace(/\s/g, '')
    if (!form.name.trim())       return 'Nom du titulaire requis'
    if (num.length < 12)         return 'Numéro de carte invalide (min 12 chiffres)'
    if (!form.expiry.includes('/') || form.expiry.length < 5) return 'Date d\'expiration invalide (MM/AA)'
    if (form.cvv.length < 3)     return 'CVV invalide (3 chiffres)'

    // Vérifier expiry pas dépassée
    const [mm, yy] = form.expiry.split('/')
    const exp = new Date(2000 + parseInt(yy), parseInt(mm) - 1)
    if (exp < new Date()) return 'Carte expirée'

    return null
  }

  const handlePay = async () => {
    setError('')
    const err = validate()
    if (err) return setError(err)

    setLoading(true)

    // Simulation délai paiement (comme un vrai)
    await new Promise(r => setTimeout(r, 1800))

    setLoading(false)
    setSuccess(true)

    // Appeler le callback après 1.5s
    setTimeout(() => {
      onSuccess && onSuccess()
      setSuccess(false)
      setForm({ name: '', number: '', expiry: '', cvv: '' })
      onClose && onClose()
    }, 1500)
  }

  const handleClose = () => {
    if (loading) return
    setError('')
    setSuccess(false)
    setForm({ name: '', number: '', expiry: '', cvv: '' })
    onClose && onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-surface-container-lowest dark:bg-dark-surface-container rounded-3xl shadow-ambient-lg p-6 animate-fade-up">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <CreditCard size={18} className="text-white" />
            </div>
            <div>
              <p className="font-headline font-bold text-sm text-on-surface dark:text-white/90">
                Paiement sécurisé
              </p>
              <p className="text-xs text-on-surface-variant dark:text-white/40">
                Données cryptées SSL
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container dark:hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>

        {success ? (
          /* Succès */
          <div className="text-center py-8 space-y-4">
            <CheckCircle size={56} className="text-green-500 mx-auto" />
            <p className="font-headline font-bold text-xl text-on-surface dark:text-white/90">
              Paiement accepté !
            </p>
            <p className="text-sm text-on-surface-variant dark:text-white/50">
              Accès activé avec succès.
            </p>
          </div>
        ) : (
          <>
            {/* Récapitulatif */}
            <div className="bg-surface-container dark:bg-white/5 rounded-2xl p-4 mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-on-surface-variant dark:text-white/40 mb-0.5">À payer</p>
                <p className="font-headline font-bold text-on-surface dark:text-white/90 text-sm">
                  {description}
                </p>
              </div>
              <p className="font-headline font-extrabold text-2xl text-primary dark:text-primary-fixed">
                {amount} <span className="text-sm font-normal">MAD</span>
              </p>
            </div>

            <Alert type="error" message={error} className="mb-4" />

            <div className="space-y-4">
              {/* Nom titulaire */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-on-surface-variant dark:text-white/50 uppercase tracking-wider">
                  Nom du titulaire
                </label>
                <input
                  type="text"
                  className="input-field dark:bg-dark-surface-container dark:text-white/90"
                  placeholder="MOHAMMED ALAMI"
                  value={form.name}
                  onChange={e => set('name', e.target.value.toUpperCase())}
                  maxLength={40}
                />
              </div>

              {/* Numéro de carte */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-on-surface-variant dark:text-white/50 uppercase tracking-wider">
                  Numéro de carte
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className="input-field dark:bg-dark-surface-container dark:text-white/90 pr-12 font-mono tracking-widest"
                    placeholder="1234 5678 9012 3456"
                    value={form.number}
                    onChange={e => set('number', formatCard(e.target.value))}
                    maxLength={19}
                    inputMode="numeric"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                    {/* Card type icons */}
                    <div className="w-8 h-5 bg-blue-600 rounded text-white text-[8px] font-bold flex items-center justify-center">VISA</div>
                    <div className="w-8 h-5 bg-red-500 rounded text-white text-[8px] font-bold flex items-center justify-center">MC</div>
                  </div>
                </div>
              </div>

              {/* Expiry + CVV */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-on-surface-variant dark:text-white/50 uppercase tracking-wider">
                    Date d'expiration
                  </label>
                  <input
                    type="text"
                    className="input-field dark:bg-dark-surface-container dark:text-white/90 font-mono"
                    placeholder="MM/AA"
                    value={form.expiry}
                    onChange={e => set('expiry', formatExpiry(e.target.value))}
                    maxLength={5}
                    inputMode="numeric"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-on-surface-variant dark:text-white/50 uppercase tracking-wider">
                    CVV
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      className="input-field dark:bg-dark-surface-container dark:text-white/90 font-mono"
                      placeholder="•••"
                      value={form.cvv}
                      onChange={e => set('cvv', e.target.value.replace(/\D/g, '').slice(0, 4))}
                      maxLength={4}
                      inputMode="numeric"
                    />
                  </div>
                </div>
              </div>

              {/* Sécurité */}
              <div className="flex items-center gap-2 text-xs text-on-surface-variant dark:text-white/30 mt-1">
                <Lock size={12} />
                <span>Paiement 100% sécurisé — SSL 256 bits</span>
              </div>

              {/* Bouton payer */}
              <Button
                onClick={handlePay}
                loading={loading}
                variant="secondary"
                size="lg"
                className="w-full flex items-center justify-center gap-2 mt-2"
              >
                <CreditCard size={18} />
                {loading ? 'Traitement en cours...' : `Payer ${amount} MAD`}
              </Button>

              {/* Cartes acceptées */}
              <div className="text-center">
                <p className="text-xs text-on-surface-variant dark:text-white/20">
                  Cartes acceptées : Visa, Mastercard, CMI
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}