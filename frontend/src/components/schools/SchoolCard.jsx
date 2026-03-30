/**
 * components/schools/SchoolCard.jsx
 */

import { Link } from 'react-router-dom'
import { Badge } from '../ui'
import { MapPin, Clock, ExternalLink } from 'lucide-react'

const domainIcons = {
  'Informatique': 'computer',
  'Médecine':     'medical_services',
  'Commerce':     'storefront',
  'Droit':        'gavel',
  'Ingénierie':   'engineering',
  'Sciences':     'science',
}

const typeLabels = {
  public:     { label: 'Public', variant: 'public' },
  private:    { label: 'Privé',  variant: 'private' },
  semipublic: { label: 'Semi-public', variant: 'semipublic' },
}

export default function SchoolCard({ school }) {
  const icon   = domainIcons[school.domain] || 'school'
  const typeInfo = typeLabels[school.type] || { label: school.type, variant: 'default' }

  return (
    <Link to={`/schools/${school.id}`} className="block group">
      <div className="
        bg-surface-container-lowest dark:bg-dark-surface-container rounded-3xl shadow-ambient p-5
        hover:shadow-ambient-md hover:-translate-y-0.5
        transition-all duration-300 ease-premium
        overflow-hidden relative
      ">
        {/* Zellige pattern accent */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-zellige opacity-50 rounded-bl-3xl" />

        <div className="relative space-y-4">
          {/* Header */}
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 dark:bg-primary-fixed/10 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary dark:text-primary-fixed icon-md">{icon}</span>
            </div>
            <div className="min-w-0">
              <h3 className="font-headline font-semibold text-sm text-on-surface dark:text-white/90 group-hover:text-primary dark:group-hover:text-primary-fixed transition-colors line-clamp-2">
                {school.name}
              </h3>
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin size={12} className="text-on-surface-variant dark:text-white/40 shrink-0" />
                <span className="text-xs text-on-surface-variant dark:text-white/40">{school.city}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          {school.description && (
            <p className="text-xs text-on-surface-variant dark:text-white/50 line-clamp-2 leading-relaxed">
              {school.description}
            </p>
          )}

          {/* Footer row */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={typeInfo.variant}>{typeInfo.label}</Badge>
              <Badge variant="primary">{school.domain}</Badge>
            </div>
            {school.duration && (
              <div className="flex items-center gap-1 text-xs text-on-surface-variant dark:text-white/40">
                <Clock size={11} />
                <span>{school.duration}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
