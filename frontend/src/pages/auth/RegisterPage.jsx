/**
 * pages/auth/RegisterPage.jsx — Avec sélection visuelle du rôle
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Input, Select, Button, Alert } from '../../components/ui'
import { GraduationCap, User, Mail, Lock } from 'lucide-react'

const BAC_TYPES = [
  { value: 'Sciences',       label: 'Sciences (SP/SVT)' },
  { value: 'Sciences Math',  label: 'Sciences Mathématiques' },
  { value: 'Economie',       label: 'Sciences Économiques' },
  { value: 'Lettres',        label: 'Lettres et Sciences Humaines' },
  { value: 'Technique',      label: 'Baccalauréat Technique' },
  { value: 'Arts Appliques', label: 'Arts Appliqués' },
  { value: 'Economie',       label: 'science de gestion comptable (SGC)' },

]

const CITIES = ['Casablanca','Rabat','Marrakech','Fès','Tanger','Agadir','Meknès','Oujda','Tétouan','Safi','Settat','Kénitra','Autre']

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate     = useNavigate()
  const [form, setForm] = useState({
    full_name: '', email: '', password: '',
    bac_type: '', city: '', bac_year: new Date().getFullYear(),
    role: 'student',
  })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 6)
      return setError('Le mot de passe doit contenir au moins 6 caractères.')
    setLoading(true)
    try {
      await register(form)
      navigate(form.role === 'counselor' ? '/counselor' : '/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la création du compte.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-24 pb-12 zellige-bg">
      <div className="w-full max-w-lg space-y-8 animate-fade-up">

        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto shadow-ambient-md">
            <GraduationCap size={28} className="text-white" />
          </div>
          <h1 className="font-headline font-bold text-2xl text-on-surface dark:text-white/90">
            Créer mon compte
          </h1>
          <p className="text-sm text-on-surface-variant dark:text-white/50">
            Déjà inscrit ?{' '}
            <Link to="/login" className="text-primary dark:text-primary-fixed font-semibold hover:underline">
              Se connecter
            </Link>
          </p>
        </div>

        <div className="bg-surface-container-lowest dark:bg-dark-surface-container rounded-3xl shadow-ambient p-8 space-y-6">
          <Alert type="error" message={error} />

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* ── Choix du rôle ── */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-on-surface dark:text-white/80">
                Je suis un...
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    value: 'student',
                    label: 'Étudiant',
                    icon: 'school',
                    desc: 'Je cherche mon orientation après le Bac',
                  },
                  {
                    value: 'counselor',
                    label: 'Conseiller / Prof',
                    icon: 'psychology',
                    desc: "J'aide les étudiants à s'inscrire",
                  },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => set('role', opt.value)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                      form.role === opt.value
                        ? 'border-primary bg-primary/5 dark:border-primary-fixed dark:bg-primary-fixed/5'
                        : 'border-surface-container dark:border-white/10 hover:border-primary/30 dark:hover:border-primary-fixed/20'
                    }`}
                  >
                    <span className={`material-symbols-outlined icon-lg block mb-2 ${
                      form.role === opt.value
                        ? 'text-primary dark:text-primary-fixed'
                        : 'text-on-surface-variant dark:text-white/30'
                    }`}>{opt.icon}</span>
                    <p className="font-semibold text-sm text-on-surface dark:text-white/90">{opt.label}</p>
                    <p className="text-xs text-on-surface-variant dark:text-white/40 mt-0.5 leading-snug">{opt.desc}</p>
                  </button>
                ))}
              </div>

              {/* Note conseiller */}
              {form.role === 'counselor' && (
                <div className="bg-secondary-container/10 dark:bg-secondary-container/5 border border-secondary-container/30 rounded-2xl p-3 flex gap-2">
                  <span className="material-symbols-outlined text-secondary dark:text-secondary-container icon-sm shrink-0 mt-0.5">info</span>
                  <p className="text-xs text-on-surface-variant dark:text-white/50 leading-relaxed">
                    En tant que conseiller, un <strong className="text-on-surface dark:text-white/80">abonnement de 99 MAD/mois</strong> est requis pour publier des annonces.
                  </p>
                </div>
              )}
            </div>

            {/* ── Infos communes ── */}
            <Input
              label="Nom complet"
              placeholder="Mohammed Alami"
              icon={<User size={16} />}
              value={form.full_name}
              onChange={e => set('full_name', e.target.value)}
              required
            />
            <Input
              label="Adresse email"
              type="email"
              placeholder="vous@example.com"
              icon={<Mail size={16} />}
              value={form.email}
              onChange={e => set('email', e.target.value)}
              required
            />
            <Input
              label="Mot de passe"
              type="password"
              placeholder="6 caractères minimum"
              icon={<Lock size={16} />}
              value={form.password}
              onChange={e => set('password', e.target.value)}
              required
              minLength={6}
            />

            {/* ── Champs étudiant uniquement ── */}
            {form.role === 'student' && (
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Type de Bac"
                  placeholder="Choisir..."
                  options={BAC_TYPES}
                  value={form.bac_type}
                  onChange={e => set('bac_type', e.target.value)}
                />
                <Select
                  label="Ville"
                  placeholder="Choisir..."
                  options={CITIES.map(c => ({ value: c, label: c }))}
                  value={form.city}
                  onChange={e => set('city', e.target.value)}
                />
              </div>
            )}

            <div className="pt-2">
              <Button type="submit" className="w-full" size="lg" loading={loading}>
                {form.role === 'counselor'
                  ? 'Créer mon compte conseiller'
                  : 'Créer mon compte étudiant'}
              </Button>
            </div>

            <p className="text-xs text-center text-on-surface-variant dark:text-white/30">
              En vous inscrivant, vous acceptez nos conditions d'utilisation.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}