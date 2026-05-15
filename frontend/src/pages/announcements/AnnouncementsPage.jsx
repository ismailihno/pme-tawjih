/**
 * pages/announcements/AnnouncementsPage.jsx
 *
 * MODIFICATION : Ajout d'un bouton "🚩 Signaler" sur chaque carte annonce.
 * Le signalement est envoyé via POST /api/announcements/:id/report
 * et apparaît dans le panneau admin (onglet Signalements).
 */
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import { Spinner, EmptyState, PageHeader } from '../../components/ui'
import { Search, MapPin, Clock, Users, Star, ArrowRight, Flag, X } from 'lucide-react'

// ── Causes de signalement prédéfinies ────────────────────────
const REPORT_CAUSES = [
  'Service non rendu',
  'Fausse description',
  'Demande de paiement abusif',
  'Conseiller non disponible',
  'Comportement irrespectueux',
  'Arnaque / Fraude',
  'Autre raison',
]

// ── Modal de signalement ──────────────────────────────────────
function ReportModal({ ann, onClose }) {
  const [cause,      setCause]      = useState('')
  const [details,    setDetails]    = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done,       setDone]       = useState(false)
  const [error,      setError]      = useState('')

  const handleSubmit = async () => {
    setError('')
    const finalComment = details.trim() || cause
    if (!cause) { setError('Veuillez choisir une cause.'); return }
    if (finalComment.length < 5) { setError('Veuillez donner plus de détails.'); return }

    setSubmitting(true)
    try {
      await api.post(`/announcements/${ann.id}/report`, {
        cause,
        comment: finalComment,
      })
      setDone(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'envoi. Réessayez.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-surface-container-lowest dark:bg-dark-surface-container rounded-3xl shadow-2xl p-6 w-full max-w-md space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-headline font-bold text-lg text-on-surface dark:text-white/90">
            🚩 Signaler cette annonce
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-container transition-colors">
            <X size={18} className="text-on-surface-variant dark:text-white/40" />
          </button>
        </div>

        {/* Annonce concernée */}
        <div className="bg-surface-container-low dark:bg-white/5 rounded-xl px-4 py-3">
          <p className="text-xs text-on-surface-variant dark:text-white/40 mb-0.5">Annonce concernée</p>
          <p className="text-sm font-semibold text-on-surface dark:text-white/80 truncate">{ann.title}</p>
          <p className="text-xs text-on-surface-variant dark:text-white/40">{ann.users?.full_name || 'Conseiller'}</p>
        </div>

        {done ? (
          /* ── Confirmation ── */
          <div className="text-center space-y-3 py-4">
            <div className="w-14 h-14 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center mx-auto">
              <Flag size={28} className="text-orange-500" />
            </div>
            <p className="font-semibold text-on-surface dark:text-white/90">Signalement envoyé !</p>
            <p className="text-sm text-on-surface-variant dark:text-white/50">
              L'administration ORIMOI va examiner votre signalement et prendre les mesures nécessaires.
            </p>
            <button
              onClick={onClose}
              className="mt-2 px-6 py-2 rounded-xl text-sm font-semibold bg-surface-container dark:bg-white/10 text-on-surface dark:text-white/80 hover:bg-surface-container-high transition-colors"
            >
              Fermer
            </button>
          </div>
        ) : (
          <>
            {/* Avertissement */}
            <div className="bg-orange-50 dark:bg-orange-900/10 rounded-xl p-3">
              <p className="text-xs text-orange-700 dark:text-orange-300">
                ⚠️ Votre signalement sera transmis à l'administration ORIMOI qui prendra les mesures nécessaires.
              </p>
            </div>

            {/* Cause */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-on-surface dark:text-white/80">Cause du signalement *</p>
              <div className="grid grid-cols-2 gap-2">
                {REPORT_CAUSES.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCause(c)}
                    className={`text-xs px-3 py-2 rounded-xl text-left font-semibold transition-colors ${
                      cause === c
                        ? 'bg-red-500 text-white'
                        : 'bg-surface-container dark:bg-white/5 text-on-surface-variant dark:text-white/60 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Détails */}
            <div className="space-y-1">
              <p className="text-sm font-semibold text-on-surface dark:text-white/80">
                Détails supplémentaires <span className="text-on-surface-variant dark:text-white/30 font-normal">(optionnel)</span>
              </p>
              <textarea
                value={details}
                onChange={e => setDetails(e.target.value)}
                placeholder="Décrivez le problème en détail..."
                rows={3}
                className="w-full rounded-xl bg-surface-container dark:bg-white/5 border border-surface-container dark:border-white/10 text-sm text-on-surface dark:text-white/80 placeholder-on-surface-variant dark:placeholder-white/30 p-3 resize-none focus:outline-none focus:ring-2 focus:ring-red-400/40"
              />
            </div>

            {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}

            {/* Boutons */}
            <div className="flex gap-3 justify-end pt-1">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-on-surface-variant dark:text-white/50 hover:bg-surface-container transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !cause}
                className="px-5 py-2 rounded-xl text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Envoi...</>
                ) : (
                  <><Flag size={14} /> Envoyer le signalement</>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Carte annonce ─────────────────────────────────────────────
function AnnouncementCard({ ann }) {
  const [showReport, setShowReport] = useState(false)
  const spots     = ann.max_students - (ann.enrolled_count || 0)
  const isFull    = spots <= 0
  const counselor = ann.users
  const school    = ann.schools

  return (
    <>
      <div className="bg-surface-container-lowest dark:bg-dark-surface-container rounded-3xl shadow-ambient p-5 space-y-4 hover:shadow-ambient-md hover:-translate-y-0.5 transition-all duration-300 relative">

        {/* Bouton signaler — coin haut droit */}
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation(); setShowReport(true) }}
          title="Signaler cette annonce"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-on-surface-variant/40 dark:text-white/20 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors z-10"
        >
          <Flag size={14} />
        </button>

        {/* Lien vers le détail */}
        <Link to={`/announcements/${ann.id}`} className="block group space-y-4">

          {/* Conseiller */}
          <div className="flex items-start justify-between gap-3 pr-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white font-bold shrink-0">
                {counselor?.full_name?.[0]?.toUpperCase() || 'C'}
              </div>
              <div>
                <p className="font-semibold text-sm text-on-surface dark:text-white/90 group-hover:text-primary transition-colors">
                  {counselor?.full_name || 'Conseiller'}
                </p>
                {ann.counselors?.is_verified && (
                  <span className="text-xs text-green-600 dark:text-green-400 font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined" style={{ fontSize: 12 }}>verified</span> Vérifié
                  </span>
                )}
              </div>
            </div>
            <p className="font-headline font-bold text-xl text-secondary dark:text-secondary-container shrink-0">
              {parseFloat(ann.price).toFixed(0)} MAD
            </p>
          </div>

          {/* Titre */}
          <div>
            <h3 className="font-headline font-semibold text-on-surface dark:text-white/90 leading-snug">
              {ann.title}
            </h3>
            {school && (
              <div className="flex items-center gap-1 mt-1">
                <MapPin size={11} className="text-on-surface-variant dark:text-white/40" />
                <span className="text-xs text-on-surface-variant dark:text-white/40">{school.name} — {school.city}</span>
              </div>
            )}
          </div>

          {ann.description && (
            <p className="text-xs text-on-surface-variant dark:text-white/50 line-clamp-2 leading-relaxed">
              {ann.description}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {ann.counselors?.rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star size={12} className="text-secondary fill-secondary" />
                  <span className="text-xs font-semibold text-on-surface dark:text-white/70">
                    {parseFloat(ann.counselors.rating).toFixed(1)}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Users size={12} className="text-on-surface-variant dark:text-white/40" />
                <span className="text-xs text-on-surface-variant dark:text-white/40">
                  {isFull ? 'Complet' : `${spots} place${spots > 1 ? 's' : ''}`}
                </span>
              </div>
            </div>
            {ann.deadline && (
              <div className="flex items-center gap-1">
                <Clock size={11} className="text-on-surface-variant dark:text-white/30" />
                <span className="text-xs text-on-surface-variant dark:text-white/30">
                  {new Date(ann.deadline).toLocaleDateString('fr-MA', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            )}
          </div>

          <div className={`flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-semibold transition-colors ${
            isFull
              ? 'bg-surface-container dark:bg-white/5 text-on-surface-variant dark:text-white/30'
              : 'bg-secondary-container/20 text-secondary dark:text-secondary-container group-hover:bg-secondary-container/40'
          }`}>
            {isFull ? 'Complet' : <><span>Voir l&apos;annonce</span><ArrowRight size={14} /></>}
          </div>
        </Link>
      </div>

      {/* Modal signalement */}
      {showReport && <ReportModal ann={ann} onClose={() => setShowReport(false)} />}
    </>
  )
}

// ── Page principale ───────────────────────────────────────────
export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([])
  const [total,   setTotal]   = useState(0)
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [page,    setPage]    = useState(1)

  const load = async (p = 1, s = search) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: p, limit: 12 })
      if (s) params.set('search', s)
      const { data } = await api.get(`/announcements?${params}`)
      setAnnouncements(data.announcements || [])
      setTotal(data.total || 0)
    } catch (err) {
      console.error('Failed to load announcements:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(1, '') }, [])

  const handleSearch = (val) => {
    setSearch(val)
    setPage(1)
    load(1, val)
  }

  return (
    <div className="max-w-7xl mx-auto px-6 pt-28 pb-16">
      <PageHeader
        label="Inscriptions accompagnées"
        title="Annonces des conseillers"
        subtitle={`${total} annonce${total !== 1 ? 's' : ''} disponible${total !== 1 ? 's' : ''}`}
      />

      <div className="relative max-w-md mb-10">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-white/30" />
        <input
          className="input-field pl-10 dark:bg-dark-surface-container dark:text-white/90"
          placeholder="Rechercher une annonce..."
          value={search}
          onChange={e => handleSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : announcements.length === 0 ? (
        <EmptyState
          icon="campaign"
          title="Aucune annonce disponible"
          description="Les conseillers publient régulièrement de nouvelles annonces. Revenez bientôt !"
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
          {announcements.map(ann => (
            <div key={ann.id} className="animate-fade-up">
              <AnnouncementCard ann={ann} />
            </div>
          ))}
        </div>
      )}

      {total > 12 && (
        <div className="flex justify-center gap-3 mt-12">
          <button onClick={() => { setPage(p => Math.max(1, p - 1)); load(page - 1) }}
            disabled={page === 1} className="btn-ghost text-sm disabled:opacity-40">Précédent</button>
          <span className="text-sm text-on-surface-variant dark:text-white/40 self-center">
            Page {page} / {Math.ceil(total / 12)}
          </span>
          <button onClick={() => { setPage(p => p + 1); load(page + 1) }}
            disabled={page >= Math.ceil(total / 12)} className="btn-ghost text-sm disabled:opacity-40">Suivant</button>
        </div>
      )}
    </div>
  )
}