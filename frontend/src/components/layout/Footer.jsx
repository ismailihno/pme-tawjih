/**
 * components/layout/Footer.jsx
 */

import { Link } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-surface-container-low dark:bg-dark-surface-container border-t border-surface-container dark:border-white/5 mt-20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                <GraduationCap size={20} className="text-white" />
              </div>
              <span className="font-headline font-bold text-xl text-primary dark:text-primary-fixed">Tawjih</span>
            </div>
            <p className="text-sm text-on-surface-variant dark:text-white/50 max-w-xs leading-relaxed">
              La plateforme de référence pour l'orientation post-bac au Maroc. Trouvez votre voie avec confiance.
            </p>
            <p className="text-xs text-on-surface-variant/60 dark:text-white/30 font-arabic">
              منصة التوجيه بعد الباكالوريا في المغرب
            </p>
          </div>

          {/* Links */}
          <div className="space-y-3">
            <p className="section-label">Plateforme</p>
            <ul className="space-y-2">
              {[
                { to: '/', label: 'Accueil' },
                { to: '/schools', label: 'Établissements' },
                { to: '/questionnaire', label: 'Questionnaire' },
                { to: '/dashboard', label: 'Mon espace' },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-on-surface-variant dark:text-white/50 hover:text-primary dark:hover:text-primary-fixed transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Domains */}
          <div className="space-y-3">
            <p className="section-label">Filières</p>
            <ul className="space-y-2">
              {['Informatique', 'Médecine', 'Commerce', 'Droit', 'Ingénierie'].map(f => (
                <li key={f}>
                  <Link to={`/schools?domain=${f}`} className="text-sm text-on-surface-variant dark:text-white/50 hover:text-primary dark:hover:text-primary-fixed transition-colors">
                    {f}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-surface-container dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-on-surface-variant/60 dark:text-white/30">
            © {new Date().getFullYear()} Tawjih. Tous droits réservés.
          </p>
          <p className="text-xs text-on-surface-variant/40 dark:text-white/20">
            Conçu pour les bacheliers marocains 🇲🇦
          </p>
        </div>
      </div>
    </footer>
  )
}
