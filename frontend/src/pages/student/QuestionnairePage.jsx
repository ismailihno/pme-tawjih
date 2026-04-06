/**
 * pages/student/QuestionnairePage.jsx
 * - Admin/Counselor bypass le paywall
 * - 15 questions
 * - Redirection correcte après paiement
 */
import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { Button, Alert, Spinner } from '../../components/ui'
import PaymentModal from '../../components/ui/PaymentModal'
import { ChevronRight, ChevronLeft, CheckCircle, Lock } from 'lucide-react'

const STEPS = [
  {
    id: 'interests', title: "Vos centres d'intérêt",
    subtitle: 'Choisissez tout ce qui vous passionne (plusieurs choix possibles)',
    type: 'multi', field: 'interests',
    options: [
      { value: 'tech',         label: 'Technologie & Informatique', icon: 'computer' },
      { value: 'sante',        label: 'Santé & Médecine',           icon: 'medical_services' },
      { value: 'business',     label: 'Business & Finance',          icon: 'trending_up' },
      { value: 'justice',      label: 'Justice & Droit',             icon: 'gavel' },
      { value: 'construction', label: 'Construction & Ingénierie',   icon: 'engineering' },
      { value: 'art',          label: 'Arts & Design',               icon: 'palette' },
      { value: 'societe',      label: 'Sciences sociales',           icon: 'groups' },
      { value: 'nature',       label: 'Nature & Environnement',      icon: 'eco' },
    ],
  },
  {
    id: 'subjects', title: 'Vos matières préférées',
    subtitle: 'Les matières dans lesquelles vous excellez',
    type: 'multi', field: 'favorite_subjects',
    options: [
      { value: 'math',         label: 'Mathématiques',      icon: 'calculate' },
      { value: 'physique',     label: 'Physique-Chimie',    icon: 'science' },
      { value: 'biologie',     label: 'Biologie / SVT',     icon: 'biotech' },
      { value: 'informatique', label: 'Informatique',       icon: 'code' },
      { value: 'économie',     label: 'Économie / Gestion', icon: 'bar_chart' },
      { value: 'français',     label: 'Les Langues',   icon: 'translate' },
      { value: 'histoire',     label: 'Histoire / Géo',     icon: 'public' },
      { value: 'philosophie',  label: 'Philosophie',        icon: 'psychology' },
      { value: 'arts',          label: 'Arts & Expression',  icon: 'palette' },
    ],
  },
  {
    id: 'skills', title: 'Vos compétences naturelles',
    subtitle: 'Que faites-vous facilement sans effort particulier ?',
    type: 'multi', field: 'skills',
    options: [
      { value: 'logique',       label: 'Raisonnement logique',    icon: 'account_tree' },
      { value: 'communication', label: 'Communication & Éloquence', icon: 'record_voice_over' },
      { value: 'mécanique',     label: 'Mécanique / Construction', icon: 'settings' },
      { value: 'organisation',  label: 'Organisation & Gestion',  icon: 'checklist' },
      { value: 'créativité',    label: 'Créativité & Innovation',  icon: 'lightbulb' },
      { value: 'empathie',      label: 'Écoute & Empathie',       icon: 'favorite' },
      { value: 'analyse',       label: 'Analyse & Recherche',     icon: 'analytics' },
      { value: 'leadership',    label: 'Leadership & Management', icon: 'supervisor_account' },
    ],
  },
  {
    id: 'preference', title: 'Votre filière préférée',
    subtitle: 'Si vous deviez choisir maintenant, vers quoi iriez-vous ?',
    type: 'single', field: 'preferred_field',
    options: [
      { value: 'Informatique', label: 'Informatique & Tech',  icon: 'computer' },
      { value: 'Médecine',     label: 'Médecine & Santé',     icon: 'medical_services' },
      { value: 'Commerce',     label: 'Commerce & Gestion',   icon: 'storefront' },
      { value: 'Droit',        label: 'Droit & Sciences Po',  icon: 'gavel' },
      { value: 'Ingénierie',   label: 'Ingénierie',           icon: 'engineering' },
      { value: 'Arts',         label: 'Arts & Design',         icon: 'palette' },
      { value: 'nsp',          label: 'Je ne sais pas encore', icon: 'help' },
    ],
  },
  {
    id: 'work_style', title: 'Votre environnement de travail idéal',
    subtitle: 'Comment vous imaginez-vous travailler dans 10 ans ?',
    type: 'single', field: 'work_style',
    options: [
      { value: 'bureau',        label: 'Bureau / Cabinet',         icon: 'business' },
      { value: 'terrain',       label: 'Sur le terrain / Chantier', icon: 'construction' },
      { value: 'hopital',       label: 'Hôpital / Clinique',       icon: 'local_hospital' },
      { value: 'entreprise',    label: 'Grande entreprise / Startup', icon: 'apartment' },
      { value: 'independant',   label: 'Freelance / Indépendant',  icon: 'person' },
      { value: 'international', label: "À l'international",        icon: 'flight' },
    ],
  },
  {
    id: 'motivation', title: 'Votre principale motivation',
    subtitle: "Qu'est-ce qui vous motive le plus dans votre futur métier ?",
    type: 'single', field: 'motivation',
    options: [
      { value: 'salaire',    label: 'Salaire & Stabilité financière', icon: 'payments' },
      { value: 'impact',     label: 'Impact social & Aider les autres', icon: 'volunteer_activism' },
      { value: 'innovation', label: 'Innover & Créer', icon: 'lightbulb' },
      { value: 'prestige',   label: 'Prestige & Reconnaissance', icon: 'star' },
      { value: 'passion',    label: 'Passion & Épanouissement', icon: 'favorite' },
      { value: 'securite',   label: 'Sécurité de l\'emploi', icon: 'shield' },
    ],
  },
  {
    id: 'bac_strength', title: 'Votre point fort au baccalauréat',
    subtitle: 'Dans quelle matière aviez-vous les meilleures notes ?',
    type: 'single', field: 'bac_strength',
    options: [
      { value: 'sciences_exactes', label: 'Sciences exactes (Maths/Physique)', icon: 'science' },
      { value: 'sciences_vie',     label: 'Sciences de la vie (SVT/Bio)',      icon: 'biotech' },
      { value: 'lettres',          label: 'Lettres & Langues',                 icon: 'menu_book' },
      { value: 'sciences_eco',     label: 'Sciences économiques',             icon: 'bar_chart' },
      { value: 'technologie',      label: 'Technologie & Technique',          icon: 'build' },
      { value: 'arts',             label: 'Arts & Expression',                icon: 'brush' },
    ],
  },
  {
    id: 'duration', title: 'Durée d\'études souhaitée',
    subtitle: 'Combien d\'années êtes-vous prêt à étudier après le bac ?',
    type: 'single', field: 'study_duration',
    options: [
      { value: '2ans',  label: '2 ans (BTS, DUT)',        icon: 'schedule' },
      { value: '3ans',  label: '3 ans (Licence, Bachelor)', icon: 'schedule' },
      { value: '5ans',  label: '5 ans (Master, Ingénieur)', icon: 'schedule' },
      { value: '7ans',  label: '7 ans et plus (Médecine, Doctorat)', icon: 'schedule' },
      { value: 'nsp',   label: 'Peu importe, je veux me spécialiser', icon: 'help' },
    ],
  },
  {
    id: 'sector', title: 'Secteur d\'activité préféré',
    subtitle: 'Dans quel secteur aimeriez-vous travailler ?',
    type: 'single', field: 'preferred_sector',
    options: [
      { value: 'tech_digital',   label: 'Tech & Digital',                icon: 'devices' },
      { value: 'sante_pharma',   label: 'Santé & Pharmacie',             icon: 'local_hospital' },
      { value: 'finance_banque', label: 'Finance & Banque',              icon: 'account_balance' },
      { value: 'industrie',      label: 'Industrie & Manufacture',       icon: 'factory' },
      { value: 'juridique',      label: 'Juridique & Gouvernement',      icon: 'gavel' },
      { value: 'education',      label: 'Éducation & Recherche',         icon: 'school' },
      { value: 'arts_design',    label: 'Arts & Design & Création',     icon: 'palette' },
    ],
  },
  {
    id: 'challenge', title: 'Votre plus grand défi personnel',
    subtitle: 'Quelle compétence voulez-vous le plus développer ?',
    type: 'single', field: 'personal_challenge',
    options: [
      { value: 'technique',    label: 'Maîtriser une expertise technique', icon: 'engineering' },
      { value: 'leadership2',  label: 'Diriger et manager des équipes',    icon: 'groups' },
      { value: 'communication2', label: 'Communiquer et persuader',       icon: 'campaign' },
      { value: 'creation',     label: 'Créer et innover',                 icon: 'auto_awesome' },
      { value: 'aider',        label: 'Aider et soigner les autres',      icon: 'healing' },
      { value: 'analyser',     label: 'Analyser et résoudre des problèmes', icon: 'psychology' },
    ],
  },
  {
    id: 'income', title: 'Vos attentes salariales',
    subtitle: 'Quel salaire mensuel visez-vous après vos études ?',
    type: 'single', field: 'income_expectation',
    options: [
      { value: 'faible',    label: 'Moins de 5 000 MAD',          icon: 'payments' },
      { value: 'moyen',     label: '5 000 — 10 000 MAD',          icon: 'payments' },
      { value: 'bon',       label: '10 000 — 20 000 MAD',         icon: 'payments' },
      { value: 'eleve',     label: '20 000 — 40 000 MAD',         icon: 'payments' },
      { value: 'tres_eleve', label: 'Plus de 40 000 MAD',         icon: 'payments' },
    ],
  },
  {
    id: 'city_preference', title: 'Votre préférence géographique',
    subtitle: 'Où souhaitez-vous étudier et travailler ?',
    type: 'single', field: 'city_preference',
    options: [
      { value: 'casablanca', label: 'Casablanca',        icon: 'location_city' },
      { value: 'rabat',      label: 'Rabat',             icon: 'location_city' },
      { value: 'marrakech',  label: 'Marrakech',         icon: 'location_city' },
      { value: 'autre_maroc', label: 'Autre ville du Maroc', icon: 'map' },
      { value: 'etranger',   label: 'À l\'étranger',     icon: 'flight' },
      { value: 'indifferent', label: 'Peu importe',      icon: 'public' },
    ],
  },
  {
    id: 'school_type', title: 'Type d\'établissement souhaité',
    subtitle: 'Quel type d\'école vous correspond le mieux ?',
    type: 'single', field: 'school_type',
    options: [
      { value: 'public',      label: 'Public (gratuit)',              icon: 'account_balance' },
      { value: 'prive',       label: 'Privé (payant)',                icon: 'school' },
      { value: 'grande_ecole', label: 'Grande école (concours)',      icon: 'emoji_events' },
      { value: 'universite',  label: 'Université (inscription libre)', icon: 'menu_book' },
      { value: 'peu_importe', label: 'Peu importe',                   icon: 'help' },
    ],
  },
  {
    id: 'language', title: 'Langue d\'enseignement préférée',
    subtitle: 'Dans quelle langue préférez-vous suivre vos cours ?',
    type: 'single', field: 'language_preference',
    options: [
      { value: 'francais',  label: 'Français',         icon: 'translate' },
      { value: 'arabe',     label: 'Arabe',             icon: 'translate' },
      { value: 'anglais',   label: 'Anglais',           icon: 'translate' },
      { value: 'bilingue',  label: 'Bilingue (Fr/Ar)',  icon: 'translate' },
      { value: 'international', label: 'International (Fr/En)', icon: 'language' },
    ],
  },
  {
    id: 'role_model', title: 'Votre modèle de réussite',
    subtitle: 'Quelle personnalité vous inspire le plus ?',
    type: 'single', field: 'role_model_type',
    options: [
      { value: 'medecin',     label: 'Médecin / Chirurgien',          icon: 'medical_services' },
      { value: 'ingenieur',   label: 'Ingénieur / Architecte',        icon: 'engineering' },
      { value: 'entrepreneur', label: 'Entrepreneur / CEO',           icon: 'business_center' },
      { value: 'juriste',     label: 'Avocat / Juge',                 icon: 'gavel' },
      { value: 'developpeur', label: 'Développeur / Data Scientist',  icon: 'code' },
      { value: 'chercheur',   label: 'Chercheur / Universitaire',     icon: 'biotech' },
    ],
  },
]

// ── Paywall ──────────────────────────────────────────────────
function Paywall({ onPaid }) {
  const [showPayment, setShowPayment] = useState(false)

  const handleSuccess = async () => {
    try {
      await api.post('/payments/simulate', { type: 'questionnaire' })
    } catch (_) {}
    onPaid() // callback pour débloquer sans reload
  }

  return (
    <div className="min-h-screen flex items-center justify-center pt-24 pb-16 px-6 zellige-bg">
      <div className="max-w-md w-full space-y-8 animate-fade-up">

        <div className="text-center space-y-3">
          <div className="w-20 h-20 rounded-3xl bg-secondary-container/20 flex items-center justify-center mx-auto">
            <Lock size={36} className="text-secondary dark:text-secondary-container" />
          </div>
          <p className="section-label">Fonctionnalité Premium</p>
          <h1 className="font-headline font-bold text-3xl text-on-surface dark:text-white/90">
            Test d'orientation complet
          </h1>
          <p className="text-on-surface-variant dark:text-white/50 leading-relaxed">
            15 questions pour découvrir votre filière idéale.
          </p>
        </div>

        <div className="bg-surface-container-lowest dark:bg-dark-surface-container rounded-3xl shadow-ambient p-6 space-y-3">
          {[
            '15 questions d\'analyse approfondie',
            'Score de compatibilité sur 100 par filière',
            'Explication détaillée de vos résultats',
            'Recommandations d\'établissements ciblés',
            'Sauvegarde à vie de vos résultats',
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-3">
              <CheckCircle size={16} className="text-green-500 shrink-0" />
              <span className="text-sm text-on-surface dark:text-white/80">{f}</span>
            </div>
          ))}
        </div>

        <div className="space-y-3 text-center">
          <div className="flex items-center justify-center gap-3">
            <span className="font-headline font-extrabold text-5xl text-primary dark:text-primary-fixed">200</span>
            <div className="text-left">
              <p className="font-semibold text-on-surface dark:text-white/80">MAD</p>
              <p className="text-xs text-on-surface-variant dark:text-white/40">paiement unique</p>
            </div>
          </div>
          <Button onClick={() => setShowPayment(true)} variant="secondary" size="lg"
            className="w-full flex items-center justify-center gap-2">
            <span className="material-symbols-outlined icon-md">credit_card</span>
            Payer et accéder au test
          </Button>
          <Link to="/dashboard" className="block text-sm text-on-surface-variant dark:text-white/40 hover:text-primary transition-colors">
            Retour au tableau de bord
          </Link>
        </div>
      </div>

      <PaymentModal
        open={showPayment}
        onClose={() => setShowPayment(false)}
        amount={200}
        description="Test d'orientation complet — ORIMOI (15 questions)"
        onSuccess={handleSuccess}
      />
    </div>
  )
}

// ── Page principale ──────────────────────────────────────────
export default function QuestionnairePage() {
  const navigate      = useNavigate()
  const { user }      = useAuth()
  const [isPremium,      setIsPremium]      = useState(false)
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [step,    setStep]    = useState(0)
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const checkPremium = useCallback(() => {
    // Admin et counselor ont toujours accès gratuit
    if (user?.role === 'admin' || user?.role === 'counselor') {
      setIsPremium(true)
      setCheckingAccess(false)
      return
    }
    api.get('/students/profile')
      .then(res => setIsPremium(res.data.student?.profile_data?.is_premium === true))
      .catch(() => setIsPremium(false))
      .finally(() => setCheckingAccess(false))
  }, [user])

  useEffect(() => { checkPremium() }, [checkPremium])

  // Callback appelé quand le paiement réussit — active sans reload
  const handlePaid = useCallback(() => {
    setIsPremium(true)
  }, [])

  if (checkingAccess) return (
    <div className="min-h-screen flex items-center justify-center pt-24"><Spinner size="lg" /></div>
  )

  if (!isPremium) return <Paywall onPaid={handlePaid} />

  const current  = STEPS[step]
  const progress = ((step + 1) / STEPS.length) * 100

  const toggleMulti = (field, value) =>
    setAnswers(prev => {
      const arr = prev[field] || []
      return { ...prev, [field]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] }
    })

  const setSingle = (field, value) => setAnswers(prev => ({ ...prev, [field]: value }))

  const isSelected = (field, value) => {
    const val = answers[field]
    return Array.isArray(val) ? val.includes(value) : val === value
  }

  const canNext = () => {
    const val = answers[current.field]
    return current.type === 'multi' ? (val && val.length > 0) : !!val
  }

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else handleSubmit()
  }

  const handleSubmit = async () => {
    setLoading(true); setError('')
    try {
      const { data } = await api.post('/orientation/submit', { answers })
      navigate('/results', { state: { results: data } })
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'analyse. Réessayez.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 zellige-bg">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* Progress */}
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center justify-between text-sm">
            <span className="section-label">Question {step + 1} / {STEPS.length}</span>
            <span className="text-on-surface-variant dark:text-white/40 font-semibold">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-surface-container dark:bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-secondary-container rounded-full transition-all duration-500 ease-premium"
              style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Question card */}
        <div key={step} className="bg-surface-container-lowest dark:bg-dark-surface-container rounded-3xl shadow-ambient p-8 space-y-8 animate-fade-up">
          <div className="space-y-2">
            <h2 className="font-headline font-bold text-2xl text-on-surface dark:text-white/90">{current.title}</h2>
            <p className="text-on-surface-variant dark:text-white/50">{current.subtitle}</p>
          </div>

          <Alert type="error" message={error} />

          <div className="grid grid-cols-2 gap-3">
            {current.options.map(opt => {
              const selected = isSelected(current.field, opt.value)
              return (
                <button key={opt.value}
                  onClick={() => current.type === 'multi' ? toggleMulti(current.field, opt.value) : setSingle(current.field, opt.value)}
                  className={`flex items-center gap-3 p-4 rounded-2xl text-left transition-all duration-200 ${
                    selected
                      ? 'bg-primary text-on-primary shadow-ambient-md scale-[1.02]'
                      : 'bg-surface-container-low dark:bg-white/5 text-on-surface dark:text-white/70 hover:bg-surface-container dark:hover:bg-white/10'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${selected ? 'bg-white/20' : 'bg-surface-container dark:bg-white/10'}`}>
                    <span className={`material-symbols-outlined icon-sm ${selected ? 'text-white' : 'text-on-surface-variant dark:text-white/40'}`}>
                      {opt.icon}
                    </span>
                  </div>
                  <span className="text-sm font-semibold leading-tight flex-1">{opt.label}</span>
                  {selected && current.type === 'multi' && (
                    <CheckCircle size={16} className="ml-auto text-secondary-container shrink-0" />
                  )}
                </button>
              )
            })}
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 0} className="flex items-center gap-2">
              <ChevronLeft size={16} /> Précédent
            </Button>
            <Button onClick={handleNext} disabled={!canNext()} loading={loading} size="lg" className="flex items-center gap-2">
              {step === STEPS.length - 1 ? 'Voir mes résultats' : 'Suivant'}
              {step < STEPS.length - 1 && <ChevronRight size={16} />}
            </Button>
          </div>
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-1.5 flex-wrap max-w-xs mx-auto">
          {STEPS.map((_, i) => (
            <div key={i} className={`rounded-full transition-all duration-300 cursor-pointer ${
              i === step ? 'w-6 h-2 bg-primary' : i < step ? 'w-2 h-2 bg-primary/40' : 'w-2 h-2 bg-surface-container dark:bg-white/10'
            }`} onClick={() => i < step && setStep(i)} />
          ))}
        </div>
      </div>
    </div>
  )
}