/**
 * pages/student/StudentDashboard.jsx
 */

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../lib/api'
import { Card, Spinner, EmptyState, Badge } from '../../components/ui'
import OrientationCard from '../../components/orientation/OrientationCard'
import { ArrowRight, BookOpen, Target, Save } from 'lucide-react'

export default function StudentDashboard() {
  const { user }                    = useAuth()
  const [profile, setProfile]       = useState(null)
  const [orientations, setOrientations] = useState([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/students/profile'),
      api.get('/students/orientations'),
    ]).then(([profileRes, orientRes]) => {
      setProfile(profileRes.data)
      setOrientations(orientRes.data.orientations || [])
    }).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <Spinner size="lg" />
      </div>
    )
  }

  const saved    = orientations.filter(o => o.is_saved)
  const recent   = orientations[0]
  const hasProfile = profile?.student?.bac_type

  return (
    <div className="max-w-6xl mx-auto px-6 pt-28 pb-16 space-y-10">

      {/* Welcome header */}
      <div className="space-y-2 animate-fade-up">
        <p className="section-label">Mon espace</p>
        <h1 className="font-headline font-bold text-3xl text-on-surface dark:text-white/90">
          Bonjour, {user?.full_name?.split(' ')[0]} 👋
        </h1>
        <p className="text-on-surface-variant dark:text-white/50">
          {hasProfile ? `Bac ${profile.student.bac_type}` : 'Complétez votre profil pour des recommandations précises'}
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger animate-fade-up">
        <Link to="/questionnaire" className="block">
          <Card className="flex items-center gap-4 hover:border hover:border-secondary-container/40">
            <div className="w-12 h-12 rounded-2xl bg-secondary-container/20 flex items-center justify-center shrink-0">
              <Target size={22} className="text-secondary dark:text-secondary-container" />
            </div>
            <div>
              <p className="font-headline font-semibold text-sm text-on-surface dark:text-white/90">Test d'orientation</p>
              <p className="text-xs text-on-surface-variant dark:text-white/40">Découvrez votre filière idéale</p>
            </div>
            <ArrowRight size={16} className="ml-auto text-on-surface-variant dark:text-white/30" />
          </Card>
        </Link>

        <Link to="/schools" className="block">
          <Card className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary dark:text-primary-fixed icon-md">school</span>
            </div>
            <div>
              <p className="font-headline font-semibold text-sm text-on-surface dark:text-white/90">Établissements</p>
              <p className="text-xs text-on-surface-variant dark:text-white/40">Parcourez les écoles</p>
            </div>
            <ArrowRight size={16} className="ml-auto text-on-surface-variant dark:text-white/30" />
          </Card>
        </Link>

        <Link to="/profile" className="block">
          <Card className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-on-surface-variant dark:text-white/40 icon-md">person</span>
            </div>
            <div>
              <p className="font-headline font-semibold text-sm text-on-surface dark:text-white/90">Mon profil</p>
              <p className="text-xs text-on-surface-variant dark:text-white/40">{hasProfile ? 'Modifier mon profil' : 'Compléter le profil'}</p>
            </div>
            <ArrowRight size={16} className="ml-auto text-on-surface-variant dark:text-white/30" />
          </Card>
        </Link>
      </div>

      {/* Profile completion notice */}
      {!hasProfile && (
        <div className="bg-secondary-container/10 dark:bg-secondary-container/5 border border-secondary-container/30 rounded-3xl p-6 flex items-center gap-4 animate-fade-up">
          <div className="w-10 h-10 rounded-2xl bg-secondary-container/30 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-secondary dark:text-secondary-container icon-md">tips_and_updates</span>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm text-on-surface dark:text-white/80">Complétez votre profil</p>
            <p className="text-xs text-on-surface-variant dark:text-white/50">Ajoutez votre type de bac pour des recommandations personnalisées.</p>
          </div>
          <Link to="/profile" className="btn-secondary text-sm py-2 px-4 shrink-0">Compléter</Link>
        </div>
      )}

      {/* Most recent result */}
      {recent && (
        <div className="space-y-4 animate-fade-up">
          <div className="flex items-center justify-between">
            <h2 className="font-headline font-bold text-lg text-on-surface dark:text-white/90">
              Dernière orientation
            </h2>
            <Link to="/results" className="text-sm text-primary dark:text-primary-fixed font-semibold hover:underline flex items-center gap-1">
              Tout voir <ArrowRight size={14} />
            </Link>
          </div>
          <OrientationCard
            result={{
              field: recent.suggested_field,
              score: recent.score,
              explanation: recent.explanation,
            }}
            rank={1}
            showExplanation
          />
        </div>
      )}

      {/* Saved orientations */}
      {saved.length > 0 && (
        <div className="space-y-4 animate-fade-up">
          <div className="flex items-center gap-2">
            <Save size={18} className="text-on-surface-variant dark:text-white/40" />
            <h2 className="font-headline font-bold text-lg text-on-surface dark:text-white/90">Enregistrées</h2>
            <Badge>{saved.length}</Badge>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {saved.map(o => (
              <OrientationCard key={o.id} result={{ field: o.suggested_field, score: o.score, explanation: o.explanation }} showExplanation />
            ))}
          </div>
        </div>
      )}

      {/* No results yet */}
      {orientations.length === 0 && (
        <EmptyState
          icon="quiz"
          title="Aucune orientation encore"
          description="Passez le questionnaire pour découvrir les filières correspondant à votre profil."
          action={
            <Link to="/questionnaire" className="btn-primary inline-flex items-center gap-2">
              Commencer le test <ArrowRight size={16} />
            </Link>
          }
        />
      )}
    </div>
  )
}
