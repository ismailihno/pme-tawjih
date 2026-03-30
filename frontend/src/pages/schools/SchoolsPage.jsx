/**
 * pages/schools/SchoolsPage.jsx — Fix: domain filter via URL param fonctionne
 */
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../../lib/api'
import SchoolCard from '../../components/schools/SchoolCard'
import { Input, Select, Button, Spinner, EmptyState, PageHeader, Badge } from '../../components/ui'
import { Search, SlidersHorizontal, X } from 'lucide-react'

export default function SchoolsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [schools,  setSchools]  = useState([])
  const [filters,  setFilters]  = useState({ cities: [], domains: [], types: [] })
  const [total,    setTotal]    = useState(0)
  const [loading,  setLoading]  = useState(true)
  const [page,     setPage]     = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  // Lire depuis l'URL (vient de CareersPage)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [city,   setCity]   = useState(searchParams.get('city')   || '')
  const [domain, setDomain] = useState(searchParams.get('domain') || '')
  const [type,   setType]   = useState(searchParams.get('type')   || '')

  // Si domain dans URL → ouvrir filtres automatiquement
  useEffect(() => {
    if (domain) setShowFilters(true)
  }, [])

  // Charger les filtres disponibles
  useEffect(() => {
    api.get('/schools/filters').then(res => setFilters(res.data)).catch(() => {})
  }, [])

  const loadSchools = useCallback(async (p = 1) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (city)   params.set('city',   city)
    if (domain) params.set('domain', domain)
    if (type)   params.set('type',   type)
    params.set('page',  p)
    params.set('limit', '12')
    setSearchParams(params)

    try {
      const { data } = await api.get(`/schools?${params}`)
      setSchools(data.schools || [])
      setTotal(data.total || 0)
    } finally {
      setLoading(false)
    }
  }, [search, city, domain, type])

  useEffect(() => { setPage(1); loadSchools(1) }, [search, city, domain, type])
  useEffect(() => { loadSchools(page) }, [page])

  const clearFilters = () => { setSearch(''); setCity(''); setDomain(''); setType('') }

  const activeFilters = [city, domain, type].filter(Boolean).length
  const typeLabels    = { public:'Public', private:'Privé', semipublic:'Semi-public' }

  return (
    <div className="max-w-7xl mx-auto px-6 pt-28 pb-16">
      <PageHeader
        label="Catalogue"
        title="Établissements au Maroc"
        subtitle={`${total} établissement${total !== 1 ? 's' : ''} répertorié${total !== 1 ? 's' : ''}`}
      />

      {/* Barre recherche + filtres */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-white/30"/>
          <input
            type="text"
            className="input-field pl-10 dark:bg-dark-surface-container dark:text-white/90"
            placeholder="Rechercher un établissement..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowFilters(f => !f)}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
            showFilters ? 'bg-primary text-on-primary' : 'bg-surface-container dark:bg-dark-surface-container text-on-surface dark:text-white/70'
          }`}
        >
          <SlidersHorizontal size={16}/>
          Filtres
          {activeFilters > 0 && (
            <span className="w-5 h-5 rounded-full bg-secondary-container text-on-secondary-container text-xs flex items-center justify-center font-bold">
              {activeFilters}
            </span>
          )}
        </button>
        {activeFilters > 0 && (
          <button onClick={clearFilters} className="flex items-center gap-1.5 text-sm text-on-surface-variant dark:text-white/40 hover:text-error transition-colors px-3">
            <X size={14}/> Effacer
          </button>
        )}
      </div>

      {/* Panneau filtres */}
      {showFilters && (
        <div className="bg-surface-container-lowest dark:bg-dark-surface-container rounded-3xl shadow-ambient p-6 mb-8 grid sm:grid-cols-3 gap-4 animate-fade-up">
          <Select
            label="Ville"
            placeholder="Toutes les villes"
            options={filters.cities.map(c => ({ value: c, label: c }))}
            value={city}
            onChange={e => setCity(e.target.value)}
          />
          <Select
            label="Domaine"
            placeholder="Tous les domaines"
            options={filters.domains.map(d => ({ value: d, label: d }))}
            value={domain}
            onChange={e => setDomain(e.target.value)}
          />
          <Select
            label="Type"
            placeholder="Tous les types"
            options={[
              { value:'public',     label:'Public' },
              { value:'private',    label:'Privé' },
              { value:'semipublic', label:'Semi-public' },
            ]}
            value={type}
            onChange={e => setType(e.target.value)}
          />
        </div>
      )}

      {/* Chips filtres actifs */}
      {activeFilters > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {domain && <Badge variant="primary" className="cursor-pointer" onClick={() => setDomain('')}>{domain} ×</Badge>}
          {city   && <Badge variant="primary" className="cursor-pointer" onClick={() => setCity('')}>{city} ×</Badge>}
          {type   && <Badge variant="primary" className="cursor-pointer" onClick={() => setType('')}>{typeLabels[type] || type} ×</Badge>}
        </div>
      )}

      {/* Résultats */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg"/></div>
      ) : schools.length === 0 ? (
        <EmptyState
          icon="school"
          title="Aucun établissement trouvé"
          description="Essayez de modifier vos filtres ou votre recherche."
          action={<Button variant="ghost" onClick={clearFilters}>Effacer les filtres</Button>}
        />
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
            {schools.map(school => (
              <div key={school.id} className="animate-fade-up">
                <SchoolCard school={school}/>
              </div>
            ))}
          </div>

          {total > 12 && (
            <div className="flex justify-center items-center gap-3 mt-12">
              <Button variant="outline" onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}>
                Précédent
              </Button>
              <span className="text-sm text-on-surface-variant dark:text-white/40 font-semibold">
                Page {page} / {Math.ceil(total/12)}
              </span>
              <Button variant="outline" onClick={() => setPage(p => p+1)} disabled={page>=Math.ceil(total/12)}>
                Suivant
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}