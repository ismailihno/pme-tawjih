/**
 * pages/announcements/AnnouncementsPage.jsx
 * Fix 2 : affiche toutes les annonces actives correctement
 */
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import { Spinner, EmptyState, PageHeader } from '../../components/ui'
import { Search, MapPin, Clock, Users, Star, ArrowRight } from 'lucide-react'

function AnnouncementCard({ ann }) {
  const spots     = ann.max_students - (ann.enrolled_count || 0)
  const isFull    = spots <= 0
  const counselor = ann.users
  const school    = ann.schools

  return (
    <Link to={`/announcements/${ann.id}`} className="block group">
      <div className="bg-surface-container-lowest dark:bg-dark-surface-container rounded-3xl shadow-ambient p-5 space-y-4 hover:shadow-ambient-md hover:-translate-y-0.5 transition-all duration-300">

        {/* Conseiller */}
        <div className="flex items-start justify-between gap-3">
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
                  <span className="material-symbols-outlined" style={{fontSize:12}}>verified</span> Vérifié
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
              <MapPin size={11} className="text-on-surface-variant dark:text-white/40"/>
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
                <Star size={12} className="text-secondary fill-secondary"/>
                <span className="text-xs font-semibold text-on-surface dark:text-white/70">
                  {parseFloat(ann.counselors.rating).toFixed(1)}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Users size={12} className="text-on-surface-variant dark:text-white/40"/>
              <span className="text-xs text-on-surface-variant dark:text-white/40">
                {isFull ? 'Complet' : `${spots} place${spots>1?'s':''}`}
              </span>
            </div>
          </div>
          {ann.deadline && (
            <div className="flex items-center gap-1">
              <Clock size={11} className="text-on-surface-variant dark:text-white/30"/>
              <span className="text-xs text-on-surface-variant dark:text-white/30">
                {new Date(ann.deadline).toLocaleDateString('fr-MA',{day:'numeric',month:'short'})}
              </span>
            </div>
          )}
        </div>

        <div className={`flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-semibold transition-colors ${
          isFull
            ? 'bg-surface-container dark:bg-white/5 text-on-surface-variant dark:text-white/30'
            : 'bg-secondary-container/20 text-secondary dark:text-secondary-container group-hover:bg-secondary-container/40'
        }`}>
          {isFull ? 'Complet' : <><span>Voir l&apos;annonce</span><ArrowRight size={14}/></>}
        </div>
      </div>
    </Link>
  )
}

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
      console.log('Announcements loaded:', data)
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
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-white/30"/>
        <input
          className="input-field pl-10 dark:bg-dark-surface-container dark:text-white/90"
          placeholder="Rechercher une annonce..."
          value={search}
          onChange={e => handleSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg"/></div>
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
              <AnnouncementCard ann={ann}/>
            </div>
          ))}
        </div>
      )}

      {total > 12 && (
        <div className="flex justify-center gap-3 mt-12">
          <button onClick={() => { setPage(p=>Math.max(1,p-1)); load(page-1) }}
            disabled={page===1} className="btn-ghost text-sm disabled:opacity-40">Précédent</button>
          <span className="text-sm text-on-surface-variant dark:text-white/40 self-center">
            Page {page} / {Math.ceil(total/12)}
          </span>
          <button onClick={() => { setPage(p=>p+1); load(page+1) }}
            disabled={page>=Math.ceil(total/12)} className="btn-ghost text-sm disabled:opacity-40">Suivant</button>
        </div>
      )}
    </div>
  )
}