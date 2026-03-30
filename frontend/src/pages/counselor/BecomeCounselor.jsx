/**
 * pages/counselor/BecomeCounselor.jsx
 * Student applies to become a counselor.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../lib/api'
import { Button, Input, Textarea, Alert, Card } from '../../components/ui'
import { CheckCircle } from 'lucide-react'

const SPECIALTIES = ['Informatique','Médecine','Commerce','Droit','Ingénierie','Sciences','Architecture','Arts','Communication']

export default function BecomeCounselor() {
  const { user, fetchProfile } = useAuth()
  const navigate               = useNavigate()
  const [form, setForm]        = useState({ bio:'', phone:'', specialties:[] })
  const [saving, setSaving]    = useState(false)
  const [error, setError]      = useState('')
  const [done, setDone]        = useState(false)
  const [existing, setExisting] = useState(null)

  useEffect(() => {
    api.get('/counselors/me').then(res => {
      if (res.data.counselor) setExisting(res.data.counselor)
    })
  }, [])

  const toggleSpecialty = (s) => {
    setForm(f => ({
      ...f,
      specialties: f.specialties.includes(s)
        ? f.specialties.filter(x => x !== s)
        : [...f.specialties, s]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.specialties.length === 0) return setError('Choisissez au moins une spécialité.')
    setSaving(true); setError('')
    try {
      await api.post('/counselors/apply', form)
      await fetchProfile()
      setDone(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la soumission.')
    } finally { setSaving(false) }
  }

  if (existing?.is_verified) {
    return (
      <div className="max-w-2xl mx-auto px-6 pt-28 pb-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center mx-auto">
          <CheckCircle size={32} className="text-green-600 dark:text-green-400" />
        </div>
        <h1 className="font-headline font-bold text-2xl text-on-surface dark:text-white/90">Vous êtes conseiller vérifié !</h1>
        <p className="text-on-surface-variant dark:text-white/50">Accédez à votre tableau de bord pour gérer vos annonces.</p>
        <Button onClick={() => navigate('/counselor')}>Mon tableau de bord</Button>
      </div>
    )
  }

  if (done || existing) {
    return (
      <div className="max-w-2xl mx-auto px-6 pt-28 pb-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-secondary-container/20 flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-secondary dark:text-secondary-container" style={{fontSize:32}}>pending</span>
        </div>
        <h1 className="font-headline font-bold text-2xl text-on-surface dark:text-white/90">Demande soumise !</h1>
        <p className="text-on-surface-variant dark:text-white/50 max-w-sm mx-auto">
          Un administrateur va examiner votre profil et vous valider sous 24-48h. Vous recevrez un accès à votre espace conseiller.
        </p>
        <Button variant="ghost" onClick={() => navigate('/dashboard')}>Retour au tableau de bord</Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-6 pt-28 pb-16 space-y-8">
      <div className="space-y-2">
        <p className="section-label">Devenir conseiller</p>
        <h1 className="font-headline font-bold text-3xl text-on-surface dark:text-white/90">
          Partagez votre expertise
        </h1>
        <p className="text-on-surface-variant dark:text-white/50">
          Accompagnez les étudiants dans leur inscription et gagnez un revenu complémentaire.
        </p>
      </div>

      {/* Benefits */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { icon:'payments',     title:'Revenus',    desc:'80% du montant payé par chaque étudiant' },
          { icon:'schedule',     title:'Flexible',   desc:'Publiez vos annonces quand vous voulez' },
          { icon:'verified_user',title:'Certifié',   desc:'Badge vérifié affiché sur votre profil' },
        ].map(b => (
          <Card key={b.title} className="text-center space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 dark:bg-primary-fixed/10 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-primary dark:text-primary-fixed icon-md">{b.icon}</span>
            </div>
            <p className="font-headline font-semibold text-sm text-on-surface dark:text-white/90">{b.title}</p>
            <p className="text-xs text-on-surface-variant dark:text-white/50">{b.desc}</p>
          </Card>
        ))}
      </div>

      <Card>
        <Alert type="error" message={error} className="mb-4" />

        <form onSubmit={handleSubmit} className="space-y-5">
          <Textarea
            label="Biographie *"
            value={form.bio}
            onChange={e => setForm(f => ({...f, bio:e.target.value}))}
            placeholder="Présentez-vous : votre expérience, votre parcours, pourquoi vous accompagnez les étudiants..."
            rows={4}
            required
          />

          <Input
            label="Téléphone (optionnel)"
            type="tel"
            value={form.phone}
            onChange={e => setForm(f => ({...f, phone:e.target.value}))}
            placeholder="+212 6XX XXX XXX"
          />

          <div className="space-y-2.5">
            <label className="block text-sm font-semibold text-on-surface dark:text-white/80">
              Domaines de spécialité *
            </label>
            <div className="flex flex-wrap gap-2">
              {SPECIALTIES.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSpecialty(s)}
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200
                    ${form.specialties.includes(s)
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container dark:bg-white/10 text-on-surface-variant dark:text-white/50 hover:bg-surface-container-high dark:hover:bg-white/20'
                    }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-surface-container-low dark:bg-white/5 rounded-2xl p-4 text-sm text-on-surface-variant dark:text-white/50 space-y-1">
            <p className="font-semibold text-on-surface dark:text-white/80">Conditions</p>
            <p>• La plateforme prend 20% de commission sur chaque paiement.</p>
            <p>• Votre profil doit être validé par un admin avant de publier des annonces.</p>
            <p>• Vous êtes responsable des informations fournies aux étudiants.</p>
          </div>

          <Button type="submit" size="lg" className="w-full" loading={saving}>
            Soumettre ma demande
          </Button>
        </form>
      </Card>
    </div>
  )
}
