/**
 * components/orientation/OrientationCard.jsx
 * Displays a single orientation recommendation with score.
 */

const fieldColors = {
  'Informatique': { bg: 'bg-blue-50 dark:bg-blue-900/20',   text: 'text-blue-700 dark:text-blue-300',   bar: 'from-blue-400 to-blue-600' },
  'Médecine':     { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-300', bar: 'from-green-400 to-green-600' },
  'Commerce':     { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300', bar: 'from-amber-400 to-amber-600' },
  'Droit':        { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300', bar: 'from-purple-400 to-purple-600' },
  'Ingénierie':   { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-300', bar: 'from-orange-400 to-orange-600' },
}

const fieldIcons = {
  'Informatique': 'computer',
  'Médecine':     'medical_services',
  'Commerce':     'storefront',
  'Droit':        'gavel',
  'Ingénierie':   'engineering',
}

export default function OrientationCard({ result, rank = null, showExplanation = false }) {
  const colors = fieldColors[result.field] || {
    bg: 'bg-surface-container dark:bg-white/5',
    text: 'text-on-surface dark:text-white/80',
    bar: 'from-primary to-primary-container',
  }
  const icon = fieldIcons[result.field] || 'school'
  const isTop = rank === 1

  return (
    <div className={`
      rounded-3xl p-5 space-y-4
      ${isTop ? 'bg-primary text-on-primary shadow-ambient-lg' : 'bg-surface-container-lowest dark:bg-dark-surface-container shadow-ambient'}
      transition-all duration-300
    `}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {rank && (
            <div className={`
              w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
              ${isTop ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container dark:bg-white/10 text-on-surface-variant dark:text-white/50'}
            `}>
              {rank}
            </div>
          )}
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${isTop ? 'bg-white/20' : colors.bg}`}>
            <span className={`material-symbols-outlined icon-md ${isTop ? 'text-white' : colors.text}`}>{icon}</span>
          </div>
          <div>
            <h3 className={`font-headline font-bold text-base ${isTop ? 'text-white' : 'text-on-surface dark:text-white/90'}`}>
              {result.field}
            </h3>
            {isTop && <span className="text-xs text-white/70 font-semibold">Recommandation principale</span>}
          </div>
        </div>
        <div className={`text-right shrink-0 ${isTop ? 'text-white' : ''}`}>
          <p className={`text-2xl font-headline font-bold ${isTop ? 'text-secondary-container' : 'text-primary dark:text-primary-fixed'}`}>
            {Math.round(result.score)}
          </p>
          <p className={`text-xs ${isTop ? 'text-white/60' : 'text-on-surface-variant dark:text-white/40'}`}>/ 100</p>
        </div>
      </div>

      {/* Score bar */}
      <div className={`h-1.5 rounded-full overflow-hidden ${isTop ? 'bg-white/20' : 'bg-surface-container dark:bg-white/10'}`}>
        <div
          className={`h-full rounded-full transition-all duration-700 ease-premium bg-gradient-to-r ${isTop ? 'from-secondary-container to-tertiary-container' : colors.bar}`}
          style={{ width: `${Math.min(result.score, 100)}%` }}
        />
      </div>

      {/* Description */}
      {result.description && (
        <p className={`text-sm leading-relaxed ${isTop ? 'text-white/80' : 'text-on-surface-variant dark:text-white/50'}`}>
          {result.description}
        </p>
      )}

      {/* Explanation (for saved results) */}
      {showExplanation && result.explanation && (
        <p className={`text-xs leading-relaxed p-3 rounded-2xl ${isTop ? 'bg-white/10 text-white/70' : 'bg-surface-container dark:bg-white/5 text-on-surface-variant dark:text-white/40'}`}>
          {result.explanation}
        </p>
      )}

      {/* Matched keywords */}
      {result.matched_keywords?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {result.matched_keywords.map(kw => (
            <span
              key={kw}
              className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${isTop ? 'bg-white/15 text-white/80' : 'bg-surface-container dark:bg-white/10 text-on-surface-variant dark:text-white/50'}`}
            >
              {kw}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
