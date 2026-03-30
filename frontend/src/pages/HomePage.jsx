/**
 * pages/HomePage.jsx
 * Landing page — "The Modern Riad" aesthetic.
 */

import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ArrowRight, Star, Users, BookOpen, TrendingUp } from 'lucide-react'

const fields = [
  { name: 'Informatique', icon: 'computer',         desc: 'IA, développement, réseaux',      color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300' },
  { name: 'Médecine',     icon: 'medical_services', desc: 'Médecine, pharmacie, dentisterie', color: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300' },
  { name: 'Commerce',     icon: 'storefront',       desc: 'Business, finance, marketing',    color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-300' },
  { name: 'Droit',        icon: 'gavel',            desc: 'Droit privé, public, international', color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300' },
  { name: 'Ingénierie',   icon: 'engineering',      desc: 'Civil, mécanique, électrique',   color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-300' },
]

const stats = [
  { value: '10+',  label: 'Établissements',  icon: 'school' },
  { value: '5',    label: 'Filières guidées', icon: 'route' },
  { value: '100%', label: 'Gratuit',          icon: 'star' },
  { value: '🇲🇦',  label: 'Made in Morocco',  icon: null },
]

const steps = [
  { n: '01', title: 'Créez votre profil', desc: 'Renseignez votre type de bac, vos matières préférées et vos centres d\'intérêt.' },
  { n: '02', title: 'Répondez au questionnaire', desc: 'Un questionnaire intelligent analyse vos compétences, aspirations et aptitudes.' },
  { n: '03', title: 'Découvrez vos recommandations', desc: 'Notre algorithme vous propose les meilleures filières avec des scores de compatibilité.' },
  { n: '04', title: 'Explorez les établissements', desc: 'Consultez les écoles et universités correspondant à votre orientation.' },
]

export default function HomePage() {
  const { user } = useAuth()

  return (
    <div className="overflow-x-hidden">

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex items-center pt-28 pb-16 zellige-bg">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary-container/10 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Copy */}
          <div className="space-y-8 animate-fade-up">
            <div className="inline-flex items-center gap-2 bg-secondary-container/20 dark:bg-secondary-container/10 text-secondary dark:text-secondary-container px-4 py-2 rounded-full text-sm font-semibold">
              <span className="w-2 h-2 rounded-full bg-secondary-container animate-pulse-soft" />
              Plateforme d'orientation post-Bac 2025
            </div>

            <h1 className="font-headline font-extrabold text-5xl lg:text-6xl text-on-surface dark:text-white/90 leading-[1.1] tracking-tight">
              Trouvez votre{' '}
              <span className="relative">
                <span className="text-primary dark:text-primary-fixed">voie</span>
                <span className="absolute bottom-1 left-0 right-0 h-1 bg-secondary-container rounded-full" />
              </span>{' '}
              après le Bac
            </h1>

            <p className="text-lg text-on-surface-variant dark:text-white/60 max-w-xl leading-relaxed">
              Tawjih analyse votre profil de bachelier marocain et vous recommande les filières, écoles et universités les mieux adaptées à vos ambitions.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              {user ? (
                <Link to="/questionnaire" className="btn-secondary flex items-center gap-2 text-base">
                  Commencer le test <ArrowRight size={18} />
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn-secondary flex items-center gap-2 text-base">
                    Démarrer gratuitement <ArrowRight size={18} />
                  </Link>
                  <Link to="/schools" className="btn-ghost text-base">
                    Explorer les écoles
                  </Link>
                </>
              )}
            </div>

            {/* Trust signals */}
            <div className="flex items-center gap-6 pt-2">
              {stats.map(s => (
                <div key={s.label} className="text-center">
                  <p className="font-headline font-bold text-xl text-on-surface dark:text-white/90">{s.value}</p>
                  <p className="text-xs text-on-surface-variant dark:text-white/40">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Visual card stack */}
          <div className="hidden lg:flex flex-col gap-4 animate-fade-up" style={{animationDelay:'150ms'}}>
            <div className="bg-surface-container-lowest dark:bg-dark-surface-container rounded-3xl shadow-ambient-lg p-6 space-y-4 zellige-bg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-white icon-md">psychology</span>
                </div>
                <div>
                  <p className="font-headline font-bold text-sm text-on-surface dark:text-white/90">Votre recommandation</p>
                  <p className="text-xs text-on-surface-variant dark:text-white/40">Basée sur votre profil</p>
                </div>
              </div>
              <div className="bg-primary rounded-2xl p-4 text-white space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-headline font-bold">Informatique</p>
                  <span className="text-xl font-headline font-bold text-secondary-container">87</span>
                </div>
                <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-secondary-container rounded-full" style={{width:'87%'}} />
                </div>
                <p className="text-xs text-white/70">Bac Sciences Math — Compatibilité élevée</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[{f:'Ingénierie',s:72},{f:'Commerce',s:54}].map(r => (
                  <div key={r.f} className="bg-surface-container-low dark:bg-white/5 rounded-2xl p-3 space-y-1.5">
                    <p className="text-xs font-semibold text-on-surface dark:text-white/70">{r.f}</p>
                    <div className="h-1 bg-surface-container dark:bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-primary/50 dark:bg-primary-fixed/50 rounded-full" style={{width:`${r.s}%`}} />
                    </div>
                    <p className="text-xs text-on-surface-variant dark:text-white/40">{r.s}/100</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-secondary-container rounded-3xl p-5 flex items-center gap-4 shadow-amber">
              <div className="w-10 h-10 rounded-2xl bg-white/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-on-secondary-container icon-md">school</span>
              </div>
              <div>
                <p className="font-headline font-bold text-sm text-on-secondary-container">ENSIAS — Rabat</p>
                <p className="text-xs text-on-secondary-container/70">Informatique · Public · 5 ans</p>
              </div>
              <ArrowRight size={16} className="ml-auto text-on-secondary-container/60" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Fields grid ─────────────────────────────────────── */}
      <section className="py-24 bg-surface-container-low dark:bg-dark-surface-container">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-3 mb-14">
            <p className="section-label">Filières disponibles</p>
            <h2 className="font-headline font-bold text-3xl text-on-surface dark:text-white/90">
              5 domaines, des centaines de débouchés
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 stagger">
            {fields.map(field => (
              <Link
                key={field.name}
                to={`/schools?domain=${field.name}`}
                className="bg-surface-container-lowest dark:bg-dark-surface-container rounded-3xl p-5 shadow-ambient hover:shadow-ambient-md hover:-translate-y-1 transition-all duration-300 ease-premium text-center space-y-3 animate-fade-up group"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${field.color}`}>
                  <span className="material-symbols-outlined icon-lg">{field.icon}</span>
                </div>
                <div>
                  <p className="font-headline font-semibold text-sm text-on-surface dark:text-white/80 group-hover:text-primary dark:group-hover:text-primary-fixed transition-colors">
                    {field.name}
                  </p>
                  <p className="text-xs text-on-surface-variant dark:text-white/40 mt-0.5">{field.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-3 mb-16">
            <p className="section-label">Comment ça marche</p>
            <h2 className="font-headline font-bold text-3xl text-on-surface dark:text-white/90">
              Votre orientation en 4 étapes
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 stagger">
            {steps.map((step, i) => (
              <div key={step.n} className="relative animate-fade-up">
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-6 left-full w-full h-0.5 bg-gradient-to-r from-surface-container to-transparent z-0" />
                )}
                <div className="bg-surface-container-lowest dark:bg-dark-surface-container rounded-3xl p-6 shadow-ambient space-y-4 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-primary text-on-primary flex items-center justify-center font-headline font-bold text-sm">
                    {step.n}
                  </div>
                  <div>
                    <h3 className="font-headline font-semibold text-on-surface dark:text-white/90 mb-2">{step.title}</h3>
                    <p className="text-sm text-on-surface-variant dark:text-white/50 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ──────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-primary rounded-[2rem] p-10 text-center space-y-6 zellige-bg shadow-ambient-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-zellige-amber pointer-events-none" />
            <p className="section-label text-on-primary/60">Prêt à commencer ?</p>
            <h2 className="font-headline font-extrabold text-3xl text-white relative z-10">
              Votre avenir commence ici
            </h2>
            <p className="text-white/70 max-w-md mx-auto">
              Rejoignez des milliers de bacheliers qui ont trouvé leur orientation grâce à Tawjih.
            </p>
            <Link
              to={user ? '/questionnaire' : '/register'}
              className="inline-flex items-center gap-2 bg-secondary-container text-on-secondary-container font-headline font-bold px-8 py-4 rounded-full hover:shadow-amber hover:brightness-105 transition-all duration-300"
            >
              {user ? 'Passer le test d\'orientation' : 'Créer mon compte gratuit'}
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
