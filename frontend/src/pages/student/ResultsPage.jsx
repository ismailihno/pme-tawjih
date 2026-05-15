/**
 * pages/student/ResultsPage.jsx
 * Displays orientation algorithm results with save functionality.
 *
 * MODIFICATION : Ajout d'une section "Contactez un conseiller" avec des
 * informations fixes (statiques) — mêmes infos pour tous les étudiants,
 * aucun appel API supplémentaire.
 */

import { useState, useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import api from '../../lib/api'
import { Button, Spinner, EmptyState } from '../../components/ui'
import OrientationCard from '../../components/orientation/OrientationCard'
import { Save, RotateCcw, ArrowRight, Phone, Mail, Star } from 'lucide-react'

// ── Conseillers statiques ─────────────────────────────────────
// MODIFICATION : informations fixes affichées pour tous les étudiants
const STATIC_COUNSELORS = [
  {
    id: 1,
    name: 'Dr. Fatima Zahra Benali',
    title: 'Conseillère d\'orientation certifiée',
    specialties: ['Sciences', 'Médecine', 'Ingénierie'],
    email: 'f.benali@orimoi.ma',
    phone: '+212 6 12 34 56 78',
    rating: 4.9,
    bio: 'Spécialiste en orientation post-bac avec 10 ans d\'expérience. Accompagne les étudiants vers les filières scientifiques et médicales.',
  },
  {
    id: 2,
    name: 'M. Youssef El Amrani',
    title: 'Conseiller d\'orientation & coach carrière',
    specialties: ['Commerce', 'Management', 'Finance'],
    email: 'y.elamrani@orimoi.ma',
    phone: '+212 6 98 76 54 32',
    rating: 4.8,
    bio: 'Expert en orientation vers les grandes écoles de commerce et les filières économiques au Maroc et à l\'international.',
  },
  {
    id: 3,
    name: 'Mme. Sara Idrissi',
    title: 'Conseillère en orientation scolaire',
    specialties: ['Droit', 'Sciences humaines', 'Arts'],
    email: 's.idrissi@orimoi.ma',
    phone: '+212 6 55 44 33 22',
    rating: 4.7,
    bio: 'Accompagne les lycéens et bacheliers dans le choix de leur filière en sciences humaines, droit et arts.',
  },
  {
    id: 4,
    name: 'M. Karim Tazi',
    title: 'Conseiller d\'orientation & mentor',
    specialties: ['Informatique', 'Technologie', 'Numérique'],
    email: 'k.tazi@orimoi.ma',
    phone: '+212 6 77 88 99 00',
    rating: 4.6,
    bio: 'Passionné par le numérique, guide les étudiants vers les meilleures écoles d\'informatique et d\'ingénierie au Maroc.',
  },
]

export default function ResultsPage() {
  const location              = useLocation()
  const navigate              = useNavigate()
  const [data, setData]       = useState(location.state?.results || null)
  const [saved, setSaved]     = useState(false)
  const [saving, setSaving]   = useState(false)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(!location.state?.results)

  useEffect(() => {
    if (!data) {
      api.get('/orientation/results').then(res => {
        const results = res.data.results || []
        if (results.length > 0) {
          const latest = results[0]
          setData({
            orientation_id: latest.id,
            top_recommendation: {
              field: latest.suggested_field,
              score: latest.score,
              explanation: latest.explanation,
            },
            results: [{ field: latest.suggested_field, score: latest.score, description: '', explanation: latest.explanation }],
          })
          setSaved(latest.is_saved)
        }
        setHistory(results.slice(1, 5))
      }).finally(() => setLoading(false))
    } else {
      api.get('/orientation/results').then(res => {
        setHistory((res.data.results || []).slice(1, 5))
      })
    }
  }, [])

  const handleSave = async () => {
    if (!data?.orientation_id) return
    setSaving(true)
    try {
      await api.put(`/students/orientations/${data.orientation_id}/save`, { is_saved: !saved })
      setSaved(s => !s)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen pt-28 px-6">
        <div className="max-w-2xl mx-auto">
          <EmptyState
            icon="quiz"
            title="Aucun résultat trouvé"
            description="Passez le questionnaire d'orientation pour découvrir vos recommandations."
            action={<Link to="/questionnaire" className="btn-primary inline-flex items-center gap-2">Passer le test <ArrowRight size={16}/></Link>}
          />
        </div>
      </div>
    )
  }

  const { results = [], top_recommendation } = data

  return (
    <div className="min-h-screen pt-28 pb-16 px-4">
      <div className="max-w-3xl mx-auto space-y-10">

        {/* Header */}
        <div className="text-center space-y-3 animate-fade-up">
          <div className="w-16 h-16 rounded-2xl bg-secondary-container/20 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-secondary dark:text-secondary-container icon-xl">psychology</span>
          </div>
          <p className="section-label">Analyse complète</p>
          <h1 className="font-headline font-bold text-3xl text-on-surface dark:text-white/90">
            Vos résultats d'orientation
          </h1>
          <p className="text-on-surface-variant dark:text-white/50 max-w-md mx-auto">
            Basé sur vos réponses, voici les filières qui correspondent le mieux à votre profil.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap justify-center gap-3 animate-fade-up">
          <Button
            variant={saved ? 'outline' : 'secondary'}
            onClick={handleSave}
            loading={saving}
            className="flex items-center gap-2"
          >
            <Save size={16} />
            {saved ? 'Enregistrée ✓' : 'Enregistrer cette orientation'}
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate('/questionnaire')}
            className="flex items-center gap-2"
          >
            <RotateCcw size={16} />
            Refaire le test
          </Button>
        </div>

        {/* Results list */}
        <div className="space-y-4 stagger">
          {results.length > 0 ? (
            results.map((result, i) => (
              <div key={result.field} className="animate-fade-up">
                <OrientationCard result={result} rank={i + 1} showExplanation={i === 0} />
              </div>
            ))
          ) : top_recommendation ? (
            <OrientationCard result={top_recommendation} rank={1} showExplanation />
          ) : null}
        </div>

        {/* ═══════════════════════════════════════════════════════
            MODIFICATION : Section conseillers — données statiques
            Les mêmes 4 conseillers sont affichés pour tous les étudiants.
        ════════════════════════════════════════════════════════ */}
        <div className="space-y-5 animate-fade-up">
          <div className="text-center space-y-1">
            <p className="section-label">Besoin d'aide ?</p>
            <h2 className="font-headline font-bold text-2xl text-on-surface dark:text-white/90">
              Consultez un conseiller d'orientation
            </h2>
            <p className="text-on-surface-variant dark:text-white/50 text-sm max-w-md mx-auto">
              Nos conseillers certifiés sont disponibles pour vous aider à interpréter
              vos résultats et choisir la meilleure filière pour votre avenir.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {STATIC_COUNSELORS.map(counselor => (
              <div
                key={counselor.id}
                className="bg-surface-container-lowest dark:bg-dark-surface-container rounded-2xl shadow-ambient p-5 space-y-4 hover:shadow-md transition-shadow"
              >
                {/* En-tête */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 dark:bg-primary-fixed/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary dark:text-primary-fixed icon-md">person</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-on-surface dark:text-white/90 truncate">{counselor.name}</p>
                    <p className="text-xs text-on-surface-variant dark:text-white/50 truncate">{counselor.title}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star size={11} className="text-yellow-500 fill-yellow-500" />
                      <span className="text-xs text-on-surface-variant dark:text-white/50">{counselor.rating} / 5</span>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <p className="text-xs text-on-surface-variant dark:text-white/50 line-clamp-2">{counselor.bio}</p>

                {/* Spécialités */}
                <div className="flex flex-wrap gap-1.5">
                  {counselor.specialties.map((s, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-0.5 rounded-full bg-secondary-container/30 dark:bg-secondary-container/20 text-on-surface-variant dark:text-white/60"
                    >
                      {s}
                    </span>
                  ))}
                </div>

                {/* Boutons contact */}
                <div className="flex gap-2 pt-1">
                  <a
                    href={`mailto:${counselor.email}`}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-xl bg-primary/10 dark:bg-primary-fixed/10 text-primary dark:text-primary-fixed hover:bg-primary/20 dark:hover:bg-primary-fixed/20 transition-colors"
                  >
                    <Mail size={13} />
                    Email
                  </a>
                  <a
                    href={`tel:${counselor.phone}`}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-xl bg-secondary-container/40 dark:bg-secondary-container/20 text-on-surface dark:text-white/80 hover:bg-secondary-container/60 transition-colors"
                  >
                    <Phone size={13} />
                    Appeler
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* ═══════════════════ FIN MODIFICATION ═══════════════════ */}

        {/* History */}
        {history.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-headline font-bold text-lg text-on-surface dark:text-white/90">Historique</h2>
            <div className="space-y-3">
              {history.map(h => (
                <div key={h.id} className="flex items-center gap-4 p-4 bg-surface-container-lowest dark:bg-dark-surface-container rounded-2xl shadow-ambient">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 dark:bg-primary-fixed/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary dark:text-primary-fixed icon-sm">history</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-on-surface dark:text-white/80">{h.suggested_field}</p>
                    <p className="text-xs text-on-surface-variant dark:text-white/40">
                      {new Date(h.created_at).toLocaleDateString('fr-MA', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-headline font-bold text-primary dark:text-primary-fixed">{Math.round(h.score)}</p>
                    <p className="text-xs text-on-surface-variant dark:text-white/40">/ 100</p>
                  </div>
                  {h.is_saved && (
                    <Save size={14} className="text-secondary dark:text-secondary-container shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next steps */}
        <div className="bg-primary rounded-3xl p-8 space-y-5 zellige-bg text-white animate-fade-up">
          <h3 className="font-headline font-bold text-xl">Prochaines étapes</h3>
          <div className="space-y-3">
            {[
              { icon: 'school', text: "Explorez les établissements correspondant à votre filière" },
              { icon: 'book',   text: "Renseignez-vous sur les conditions d'admission" },
              { icon: 'event',  text: "Participez aux journées portes ouvertes" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined icon-sm text-white">{item.icon}</span>
                </div>
                <p className="text-sm text-white/80">{item.text}</p>
              </div>
            ))}
          </div>
          <Link
            to="/schools"
            className="inline-flex items-center gap-2 bg-secondary-container text-on-secondary-container font-semibold px-6 py-3 rounded-full hover:brightness-105 transition-all"
          >
            Explorer les établissements <ArrowRight size={16} />
          </Link>
        </div>

      </div>
    </div>
  )
}