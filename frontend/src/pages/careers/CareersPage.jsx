/**
 * pages/careers/CareersPage.jsx — Version corrigée
 * Fix 1: filtrage par sector fonctionne
 * Fix 2: affichage correct (salary_min/max, title, sector...)
 * Fix 3: lien établissements utilise school_domain ou fallback sector
 */
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import { Spinner, EmptyState, PageHeader } from '../../components/ui'
import { TrendingUp, Clock, DollarSign, Star, ChevronRight, Search } from 'lucide-react'

// Mapping sector → domaine scolaire (fallback si school_domain absent)
const SECTOR_TO_DOMAIN = {
  'Santé':           'Médecine',
  'Ingénierie':      'Ingénierie',
  'Digital':         'Informatique',
  'Commerce':        'Commerce',
  'Droit':           'Droit',
  'Architecture':    'Architecture',
  'Éducation':       'Sciences',
  'Militaire':       'Ingénierie',
  'Entrepreneuriat': 'Commerce',
  'Sécurité':        'Sciences',
  'Administration':  'Droit',
  'International':   'Ingénierie',
}

const SECTORS = [
  { key: '',               label: 'Tous',           icon: 'apps' },
  { key: 'Santé',          label: 'Santé',           icon: 'medical_services' },
  { key: 'Ingénierie',     label: 'Ingénierie',      icon: 'engineering' },
  { key: 'Commerce',       label: 'Commerce',        icon: 'trending_up' },
  { key: 'Droit',          label: 'Droit',           icon: 'gavel' },
  { key: 'Architecture',   label: 'Architecture',    icon: 'architecture' },
  { key: 'Éducation',      label: 'Éducation',       icon: 'school' },
  { key: 'Militaire',      label: 'Militaire',       icon: 'military_tech' },
  { key: 'Digital',        label: 'Digital',         icon: 'computer' },
  { key: 'Entrepreneuriat', label: 'Entrepreneuriat', icon: 'rocket_launch' },
  { key: 'International',  label: 'International',   icon: 'flight' },
]

const DIFFICULTY_COLORS = {
  'faible':      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'moyenne':     'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'élevée':      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'très élevée': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const EMPLOY_COLORS = {
  'faible':      'text-red-500',
  'moyenne':     'text-amber-500',
  'élevée':      'text-green-500',
  'très élevée': 'text-emerald-600',
}

const SECTOR_COLORS = {
  'Santé':          'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  'Ingénierie':     'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  'Digital':        'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  'Commerce':       'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  'Droit':          'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  'Architecture':   'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  'Éducation':      'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  'Militaire':      'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  'Entrepreneuriat':'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  'International':  'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
}

function CareerCard({ career }) {
  const [expanded, setExpanded] = useState(false)

  // Domaine scolaire : school_domain en priorité, sinon fallback via sector
  const domain = career.school_domain || SECTOR_TO_DOMAIN[career.sector] || ''

  // Formater le salaire
  const salaryText = career.salary_min === 0 && career.salary_max > 0
    ? `Variable — jusqu'à ${career.salary_max.toLocaleString()} MAD`
    : career.salary_min && career.salary_max
    ? `${career.salary_min.toLocaleString()} — ${career.salary_max.toLocaleString()} MAD`
    : '—'

  return (
    <div className="bg-surface-container-lowest dark:bg-dark-surface-container rounded-3xl shadow-ambient p-5 space-y-4 hover:shadow-ambient-md transition-all duration-300">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-headline font-bold text-on-surface dark:text-white/90 leading-snug">
            {career.title}
          </h3>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${SECTOR_COLORS[career.sector] || 'bg-primary/10 text-primary'}`}>
              {career.sector}
            </span>
            {career.schools_count > 0 && (
              <span className="text-xs text-on-surface-variant dark:text-white/40">
                {career.schools_count} établissement{career.schools_count > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${DIFFICULTY_COLORS[career.difficulty] || DIFFICULTY_COLORS['moyenne']}`}>
          {career.difficulty}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-on-surface-variant dark:text-white/60 leading-relaxed">
        {career.description}
      </p>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <DollarSign size={14} className="text-green-500 shrink-0"/>
          <div>
            <p className="text-xs text-on-surface-variant dark:text-white/40">Salaire</p>
            <p className="text-xs font-semibold text-on-surface dark:text-white/80">{salaryText}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-primary dark:text-primary-fixed shrink-0"/>
          <div>
            <p className="text-xs text-on-surface-variant dark:text-white/40">Durée études</p>
            <p className="text-xs font-semibold text-on-surface dark:text-white/80">{career.duration_studies}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className={`shrink-0 ${EMPLOY_COLORS[career.employability] || 'text-on-surface-variant'}`}/>
          <div>
            <p className="text-xs text-on-surface-variant dark:text-white/40">Employabilité</p>
            <p className={`text-xs font-semibold ${EMPLOY_COLORS[career.employability] || ''}`}>
              {career.employability}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Star size={14} className="text-amber-500 shrink-0"/>
          <div>
            <p className="text-xs text-on-surface-variant dark:text-white/40">Bac requis</p>
            <p className="text-xs font-semibold text-on-surface dark:text-white/80 truncate">
              {career.required_bac?.length > 0 ? career.required_bac.join(', ') : 'Tous'}
            </p>
          </div>
        </div>
      </div>

      {/* Toggle détails */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-xs font-semibold text-primary dark:text-primary-fixed hover:underline transition-colors"
      >
        <span>{expanded ? 'Masquer les détails' : 'Voir les détails'}</span>
        <ChevronRight size={14} className={`transition-transform ${expanded ? 'rotate-90' : ''}`}/>
      </button>

      {/* Détails expandables */}
      {expanded && (
        <div className="space-y-3 pt-3 border-t border-surface-container dark:border-white/5 animate-fade-up">
          {career.ideal_profile && (
            <div>
              <p className="text-xs font-semibold text-on-surface dark:text-white/60 mb-1">Profil idéal</p>
              <p className="text-xs text-on-surface-variant dark:text-white/50">{career.ideal_profile}</p>
            </div>
          )}
          {career.evolution && (
            <div>
              <p className="text-xs font-semibold text-on-surface dark:text-white/60 mb-1">Évolution de carrière</p>
              <p className="text-xs text-on-surface-variant dark:text-white/50">{career.evolution}</p>
            </div>
          )}
          {(career.advantages || career.disadvantages) && (
            <div className="grid grid-cols-2 gap-2">
              {career.advantages && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-2.5">
                  <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">Avantages</p>
                  <p className="text-xs text-green-600 dark:text-green-500">{career.advantages}</p>
                </div>
              )}
              {career.disadvantages && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-2.5">
                  <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">Inconvénients</p>
                  <p className="text-xs text-red-600 dark:text-red-500">{career.disadvantages}</p>
                </div>
              )}
            </div>
          )}

          {/* Lien établissements — utilise domain (school_domain ou fallback sector) */}
          {domain ? (
            <Link
              to={`/schools?domain=${encodeURIComponent(domain)}`}
              className="flex items-center gap-2 text-xs font-semibold text-secondary dark:text-secondary-container hover:underline"
            >
              <span className="material-symbols-outlined" style={{fontSize:14}}>school</span>
              Voir les établissements pour cette carrière ({career.schools_count || 0})
              <ChevronRight size={12}/>
            </Link>
          ) : (
            <Link
              to="/schools"
              className="flex items-center gap-2 text-xs font-semibold text-secondary dark:text-secondary-container hover:underline"
            >
              <span className="material-symbols-outlined" style={{fontSize:14}}>school</span>
              Voir tous les établissements
              <ChevronRight size={12}/>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

export default function CareersPage() {
  const [careers, setCareers] = useState([])
  const [loading, setLoading] = useState(true)
  const [sector,  setSector]  = useState('')
  const [search,  setSearch]  = useState('')

  useEffect(() => {
    setLoading(true)
    api.get('/careers')
      .then(res => {
        console.log('Careers loaded:', res.data.careers?.length)
        setCareers(res.data.careers || [])
      })
      .catch(err => {
        console.error('Careers error:', err)
        setCareers([])
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = careers.filter(c => {
    const matchSector = !sector || c.sector === sector
    const matchSearch = !search ||
      c.title?.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase()) ||
      c.sector?.toLowerCase().includes(search.toLowerCase())
    return matchSector && matchSearch
  })

  return (
    <div className="max-w-7xl mx-auto px-6 pt-28 pb-16">
      <PageHeader
        label="Orientation professionnelle"
        title="Explorer les carrières"
        subtitle={`${careers.length} métier${careers.length > 1 ? 's' : ''} disponible${careers.length > 1 ? 's' : ''} au Maroc`}
      />

      {/* Recherche */}
      <div className="relative max-w-md mb-6">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-white/30"/>
        <input
          className="input-field pl-10 dark:bg-dark-surface-container dark:text-white/90"
          placeholder="Rechercher un métier..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Filtres secteurs */}
      <div className="flex gap-2 flex-wrap mb-10">
        {SECTORS.map(s => (
          <button
            key={s.key}
            onClick={() => setSector(s.key)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold transition-all ${
              sector === s.key
                ? 'bg-primary text-on-primary shadow-md'
                : 'bg-surface-container dark:bg-white/10 text-on-surface-variant dark:text-white/50 hover:bg-surface-container-high dark:hover:bg-white/15'
            }`}
          >
            <span className="material-symbols-outlined" style={{fontSize:14}}>{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg"/></div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="work"
          title="Aucune carrière trouvée"
          description="Essayez un autre secteur ou terme de recherche."
          action={
            (sector || search) && (
              <button
                onClick={() => { setSector(''); setSearch('') }}
                className="btn-ghost text-sm"
              >
                Effacer les filtres
              </button>
            )
          }
        />
      ) : (
        <>
          <p className="text-sm text-on-surface-variant dark:text-white/40 mb-6">
            {filtered.length} carrière{filtered.length > 1 ? 's' : ''}
            {sector ? ` en ${sector}` : ''}
            {search ? ` pour "${search}"` : ''}
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(career => (
              <CareerCard key={career.id} career={career}/>
            ))}
          </div>
        </>
      )}
    </div>
  )
}