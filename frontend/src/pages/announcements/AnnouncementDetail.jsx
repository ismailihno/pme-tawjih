/**
 * pages/announcements/AnnouncementDetail.jsx — Paiement simulé
 */
import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { Badge, Spinner, Button, Modal, Alert } from '../../components/ui'
import { MapPin, Clock, Users, Star, ArrowLeft, CheckCircle, CreditCard } from 'lucide-react'

export default function AnnouncementDetail() {
  const { id }  = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [ann,     setAnn]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)
  const [paying,  setPaying]  = useState(false)
  const [success, setSuccess] = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    api.get(`/announcements/${id}`)
      .then(res => setAnn(res.data.announcement))
      .catch(() => navigate('/announcements'))
      .finally(() => setLoading(false))
  }, [id])

  const handlePay = async () => {
    setError(''); setPaying(true)
    try {
      const { data } = await api.post('/payments/simulate', {
        type: 'announcement',
        announcement_id: ann.id,
      })
      if (data.success) setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors du paiement.')
    } finally { setPaying(false) }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center pt-24"><Spinner size="lg"/></div>
  if (!ann) return null

  const spots    = ann.max_students - (ann.enrolled_count || 0)
  const isFull   = spots <= 0
  const counselor = ann.users
  const school    = ann.schools

  return (
    <div className="max-w-4xl mx-auto px-6 pt-28 pb-16 space-y-8">

      <Link to="/announcements" className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors font-semibold">
        <ArrowLeft size={16}/> Retour aux annonces
      </Link>

      {/* Hero */}
      <div className="bg-primary rounded-3xl p-8 text-white zellige-bg shadow-ambient-lg">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="space-y-3">
            <h1 className="font-headline font-extrabold text-2xl sm:text-3xl leading-tight">{ann.title}</h1>
            {school && (
              <div className="flex items-center gap-2 text-white/70">
                <MapPin size={14}/><span className="text-sm">{school.name} — {school.city}</span>
              </div>
            )}
            {ann.deadline && (
              <div className="flex items-center gap-2 text-white/70">
                <Clock size={14}/><span className="text-sm">Clôture : {new Date(ann.deadline).toLocaleDateString('fr-MA',{day:'numeric',month:'long',year:'numeric'})}</span>
              </div>
            )}
          </div>
          <div className="shrink-0 text-right">
            <p className="font-headline font-extrabold text-4xl text-secondary-container">{parseFloat(ann.price).toFixed(0)}</p>
            <p className="text-white/60 text-sm">MAD</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">

        {/* Contenu */}
        <div className="md:col-span-2 space-y-6">
          {ann.description && (
            <div className="bg-surface-container-lowest dark:bg-dark-surface-container rounded-3xl shadow-ambient p-6 space-y-3">
              <h2 className="font-headline font-bold text-on-surface dark:text-white/90">Description</h2>
              <p className="text-on-surface-variant dark:text-white/60 leading-relaxed">{ann.description}</p>
            </div>
          )}
          {school?.description && (
            <div className="bg-surface-container-lowest dark:bg-dark-surface-container rounded-3xl shadow-ambient p-6 space-y-3">
              <h2 className="font-headline font-bold text-on-surface dark:text-white/90">L'établissement</h2>
              <p className="text-on-surface-variant dark:text-white/60 leading-relaxed">{school.description}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-surface-container-lowest dark:bg-dark-surface-container rounded-3xl shadow-ambient p-5 space-y-4">
            <h3 className="font-headline font-semibold text-sm text-on-surface dark:text-white/80">Votre conseiller</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white font-bold text-lg shrink-0">
                {counselor?.full_name?.[0]?.toUpperCase() || 'C'}
              </div>
              <div>
                <p className="font-semibold text-on-surface dark:text-white/80">{counselor?.full_name}</p>
                {ann.counselors?.is_verified && <Badge variant="success" className="mt-0.5">Vérifié</Badge>}
              </div>
            </div>

            {ann.counselors?.bio && (
              <p className="text-xs text-on-surface-variant dark:text-white/50 leading-relaxed">{ann.counselors.bio}</p>
            )}

            {ann.counselors?.rating > 0 && (
              <div className="flex items-center gap-2">
                {[1,2,3,4,5].map(i=>(
                  <Star key={i} size={14} className={i<=Math.round(ann.counselors.rating)?'text-secondary fill-secondary':'text-on-surface-variant/20'}/>
                ))}
                <span className="text-sm font-semibold text-on-surface dark:text-white/70">{parseFloat(ann.counselors.rating).toFixed(1)}</span>
                <span className="text-xs text-on-surface-variant dark:text-white/40">({ann.counselors.total_reviews} avis)</span>
              </div>
            )}

            <div className="flex items-center justify-between text-sm pt-2 border-t border-surface-container dark:border-white/5">
              <span className="text-on-surface-variant dark:text-white/40">Places restantes</span>
              <span className="font-semibold text-on-surface dark:text-white/80">{isFull ? 'Complet' : spots}</span>
            </div>
          </div>

          {/* CTA */}
          {user ? (
            !isFull ? (
              <Button onClick={()=>setModal(true)} variant="secondary" className="w-full" size="lg">
                S'inscrire — {parseFloat(ann.price).toFixed(0)} MAD
              </Button>
            ) : (
              <div className="w-full text-center py-3.5 rounded-full bg-surface-container dark:bg-white/5 text-on-surface-variant text-sm font-semibold">
                Annonce complète
              </div>
            )
          ) : (
            <Link to="/login" className="btn-primary w-full text-center block py-3.5">
              Se connecter pour s'inscrire
            </Link>
          )}
        </div>
      </div>

      {/* Modal paiement */}
      <Modal open={modal} onClose={()=>{setModal(false);setSuccess(false);setError('')}}
        title={success ? 'Inscription confirmée !' : "Confirmer l'inscription"}>

        {success ? (
          <div className="space-y-5 text-center py-4">
            <CheckCircle size={56} className="text-green-500 mx-auto"/>
            <div>
              <p className="font-headline font-bold text-xl text-on-surface dark:text-white/90 mb-2">
                Inscription réussie !
              </p>
              <p className="text-sm text-on-surface-variant dark:text-white/60">
                Le conseiller va vous contacter prochainement.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={()=>{ setModal(false); setSuccess(false) }} className="flex-1">
                Fermer
              </Button>
              <Link to="/payments" className="btn-primary flex-1 flex items-center justify-center">
                Mes paiements
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <Alert type="error" message={error}/>

            {/* Résumé commande */}
            <div className="bg-surface-container dark:bg-white/5 rounded-2xl p-4 space-y-2">
              <p className="font-semibold text-sm text-on-surface dark:text-white/80">{ann.title}</p>
              <p className="text-xs text-on-surface-variant dark:text-white/50">Conseiller : {counselor?.full_name}</p>
              <div className="flex items-center justify-between pt-2 border-t border-surface-container-high dark:border-white/10 mt-2">
                <span className="text-sm text-on-surface-variant dark:text-white/50">Montant</span>
                <span className="font-headline font-bold text-lg text-secondary dark:text-secondary-container">
                  {parseFloat(ann.price).toFixed(0)} MAD
                </span>
              </div>
            </div>

            {/* Badge mode test */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 icon-sm">science</span>
              <p className="text-xs text-amber-700 dark:text-amber-400">Mode test — Paiement simulé, aucune carte requise.</p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={()=>setModal(false)} className="flex-1">Annuler</Button>
              <Button loading={paying} onClick={handlePay} className="flex-1 flex items-center justify-center gap-2">
                <CreditCard size={16}/> Confirmer
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
