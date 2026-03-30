/**
 * pages/student/ResultsPage.jsx
 * Displays orientation algorithm results with save functionality.
 */

import { useState, useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import api from '../../lib/api'
import { Button, Spinner, EmptyState } from '../../components/ui'
import OrientationCard from '../../components/orientation/OrientationCard'
import { Save, RotateCcw, ArrowRight, School } from 'lucide-react'

export default function ResultsPage() {
  const location               = useLocation()
  const navigate               = useNavigate()
  const [data, setData]        = useState(location.state?.results || null)
  const [saved, setSaved]      = useState(false)
  const [saving, setSaving]    = useState(false)
  const [history, setHistory]  = useState([])
  const [loading, setLoading]  = useState(!location.state?.results)

  // If no state (direct navigation), load last result from API
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
      // Load history separately
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
                <OrientationCard
                  result={result}
                  rank={i + 1}
                  showExplanation={i === 0}
                />
                {/* Related schools CTA for top result */}
                {i === 0 && (
                  <Link
                    to={`/schools?domain=${result.field}`}
                    className="flex items-center gap-3 mt-3 p-4 bg-surface-container-low dark:bg-white/5 rounded-2xl hover:bg-surface-container dark:hover:bg-white/10 transition-colors group"
                  >
                    <School size={18} className="text-primary dark:text-primary-fixed shrink-0" />
                    <span className="text-sm font-semibold text-on-surface dark:text-white/80 flex-1">
                      Voir les établissements en {result.field}
                    </span>
                    <ArrowRight size={16} className="text-on-surface-variant dark:text-white/30 group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}
              </div>
            ))
          ) : top_recommendation ? (
            <OrientationCard result={top_recommendation} rank={1} showExplanation />
          ) : null}
        </div>

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
                      {new Date(h.created_at).toLocaleDateString('fr-MA', { day:'numeric', month:'long', year:'numeric' })}
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
              { icon: 'school', text: 'Explorez les établissements correspondant à votre filière' },
              { icon: 'book', text: 'Renseignez-vous sur les conditions d\'admission' },
              { icon: 'event', text: 'Participez aux journées portes ouvertes' },
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
