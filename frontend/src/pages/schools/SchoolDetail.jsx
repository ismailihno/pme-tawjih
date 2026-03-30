/**
 * pages/schools/SchoolDetail.jsx
 */

import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../lib/api'
import { Badge, Spinner, Button } from '../../components/ui'
import { MapPin, Clock, Globe, ArrowLeft, ExternalLink } from 'lucide-react'

const domainIcons = {
  'Informatique': 'computer', 'Médecine': 'medical_services',
  'Commerce': 'storefront',   'Droit': 'gavel',
  'Ingénierie': 'engineering','Sciences': 'science',
}
const typeLabels = { public: 'Public', private: 'Privé', semipublic: 'Semi-public' }
const typeVariants = { public: 'public', private: 'private', semipublic: 'semipublic' }

export default function SchoolDetail() {
  const { id }              = useParams()
  const [school, setSchool] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(false)

  useEffect(() => {
    api.get(`/schools/${id}`)
      .then(res => setSchool(res.data.school))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="min-h-screen flex items-center justify-center pt-24"><Spinner size="lg" /></div>

  if (error || !school) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-24 gap-4">
        <p className="text-on-surface-variant">Établissement non trouvé.</p>
        <Link to="/schools" className="btn-primary">Retour au catalogue</Link>
      </div>
    )
  }

  const icon = domainIcons[school.domain] || 'school'

  return (
    <div className="max-w-4xl mx-auto px-6 pt-28 pb-16 space-y-8">

      {/* Back */}
      <Link to="/schools" className="inline-flex items-center gap-2 text-sm text-on-surface-variant dark:text-white/40 hover:text-primary dark:hover:text-primary-fixed transition-colors font-semibold">
        <ArrowLeft size={16} /> Retour aux établissements
      </Link>

      {/* Hero card */}
      <div className="bg-primary rounded-3xl p-8 text-white zellige-bg shadow-ambient-lg overflow-hidden relative">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-start gap-6">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-white icon-xl">{icon}</span>
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant={typeVariants[school.type] || 'default'}>
                {typeLabels[school.type] || school.type}
              </Badge>
              <Badge className="bg-white/20 text-white border-0">{school.domain}</Badge>
            </div>
            <h1 className="font-headline font-extrabold text-2xl sm:text-3xl leading-tight">
              {school.name}
            </h1>
            <div className="flex flex-wrap items-center gap-5 text-white/70 text-sm">
              <div className="flex items-center gap-1.5">
                <MapPin size={14} /> {school.city}
              </div>
              {school.duration && (
                <div className="flex items-center gap-1.5">
                  <Clock size={14} /> {school.duration}
                </div>
              )}
              {school.website && (
                <a href={school.website} target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-1.5 hover:text-white transition-colors">
                  <Globe size={14} /> Site officiel <ExternalLink size={11} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content grid */}
      <div className="grid md:grid-cols-3 gap-6">

        {/* Main info */}
        <div className="md:col-span-2 space-y-6">
          {school.description && (
            <div className="bg-surface-container-lowest dark:bg-dark-surface-container rounded-3xl shadow-ambient p-6 space-y-3">
              <h2 className="font-headline font-bold text-on-surface dark:text-white/90 flex items-center gap-2">
                <span className="material-symbols-outlined icon-sm text-primary dark:text-primary-fixed">info</span>
                Présentation
              </h2>
              <p className="text-on-surface-variant dark:text-white/60 leading-relaxed">{school.description}</p>
            </div>
          )}

          {school.admission_info && (
            <div className="bg-surface-container-lowest dark:bg-dark-surface-container rounded-3xl shadow-ambient p-6 space-y-3">
              <h2 className="font-headline font-bold text-on-surface dark:text-white/90 flex items-center gap-2">
                <span className="material-symbols-outlined icon-sm text-secondary dark:text-secondary-container">checklist</span>
                Conditions d'admission
              </h2>
              <p className="text-on-surface-variant dark:text-white/60 leading-relaxed">{school.admission_info}</p>
            </div>
          )}

          {school.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {school.tags.map(tag => (
                <Badge key={tag} variant="default">{tag}</Badge>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-surface-container-lowest dark:bg-dark-surface-container rounded-3xl shadow-ambient p-5 space-y-4">
            <h3 className="font-headline font-semibold text-sm text-on-surface dark:text-white/80">Infos rapides</h3>

            {[
              { label: 'Domaine',  value: school.domain,                        icon: 'category' },
              { label: 'Ville',    value: school.city,                           icon: 'location_on' },
              { label: 'Type',     value: typeLabels[school.type] || school.type, icon: 'business' },
              { label: 'Durée',    value: school.duration,                       icon: 'schedule' },
            ].filter(i => i.value).map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-surface-container dark:bg-white/5 flex items-center justify-center">
                  <span className="material-symbols-outlined icon-sm text-on-surface-variant dark:text-white/40">{item.icon}</span>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant dark:text-white/30">{item.label}</p>
                  <p className="text-sm font-semibold text-on-surface dark:text-white/80">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          <Link to={`/schools?domain=${school.domain}`}>
            <Button variant="outline" className="w-full flex items-center gap-2">
              <span className="material-symbols-outlined icon-sm">{icon}</span>
              Autres en {school.domain}
            </Button>
          </Link>

          <Link to="/questionnaire">
            <Button variant="secondary" className="w-full">
              Tester ma compatibilité
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
