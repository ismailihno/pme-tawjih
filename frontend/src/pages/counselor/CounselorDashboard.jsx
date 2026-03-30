/**
 * pages/counselor/CounselorDashboard.jsx
 *
 * FIX BUG 1 — Page paiement revient après 1 visite :
 *   - On stocke is_subscribed + expires_at dans localStorage comme cache
 *   - On vérifie d'abord le cache local (immédiat) PUIS l'API
 *   - Après paiement réussi : on écrit dans localStorage ET en base
 *   - handleSuccess attend la confirmation API avant de débloquer
 *
 * FIX BUG 2 — Annonces ne s'affichent pas (côté frontend) :
 *   - Géré dans announcements.js backend (LEFT JOIN au lieu de INNER JOIN)
 */
import { useState, useEffect, useCallback } from 'react'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { Card, StatCard, Button, Badge, Spinner, Modal, Input, Select, Alert, EmptyState } from '../../components/ui'
import PaymentModal from '../../components/ui/PaymentModal'
import { Plus, Pencil, Trash2, CheckCircle } from 'lucide-react'

const EMPTY_FORM = { title:'', description:'', price:'', school_id:'', max_students:'10', deadline:'' }

// ── Clé localStorage ──────────────────────────────────────────
const subKey = (userId) => `tawjih_counselor_sub_${userId}`

function getLocalSub(userId) {
  try {
    const raw = localStorage.getItem(subKey(userId))
    if (!raw) return null
    return JSON.parse(raw)
  } catch { return null }
}

function setLocalSub(userId, expiresAt) {
  try {
    localStorage.setItem(subKey(userId), JSON.stringify({
      is_subscribed: true,
      expires_at: expiresAt,
      saved_at: new Date().toISOString(),
    }))
  } catch {}
}

function clearLocalSub(userId) {
  try { localStorage.removeItem(subKey(userId)) } catch {}
}

function isLocalSubValid(userId) {
  const sub = getLocalSub(userId)
  if (!sub?.is_subscribed || !sub?.expires_at) return false
  return new Date(sub.expires_at) > new Date()
}

// ── Mur d'abonnement ─────────────────────────────────────────
function SubscriptionWall({ onActivated, userId }) {
  const [showPayment, setShowPayment] = useState(false)
  const [activating,  setActivating]  = useState(false)
  const [error,       setError]       = useState('')

  // ✅ FIX : handleSuccess attend la confirmation API complète
  const handleSuccess = async () => {
    setActivating(true)
    setError('')
    try {
      const { data } = await api.post('/payments/simulate', { type: 'counselor_subscription' })
      if (data?.success) {
        // Sauvegarder dans localStorage avec la date d'expiration retournée par l'API
        const expiresAt = data.expires_at || (() => {
          const d = new Date(); d.setMonth(d.getMonth() + 1); return d.toISOString()
        })()
        setLocalSub(userId, expiresAt)
        onActivated()
      } else {
        setError('Activation échouée, veuillez réessayer.')
        setActivating(false)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur réseau. Veuillez réessayer.')
      setActivating(false)
    }
  }

  if (activating) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 pt-24">
      <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"/>
      <p className="text-on-surface-variant dark:text-white/50 text-sm">Activation de votre abonnement...</p>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-6 pt-28 pb-16">
      <div className="text-center space-y-8 animate-fade-up">
        <div className="space-y-3">
          <p className="section-label">Comment ça marche</p>
          <h1 className="font-headline font-bold text-3xl text-on-surface dark:text-white/90">
            Devenez conseiller sur Tawjih
          </h1>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { n:'1', icon:'credit_card',  title:'Abonnez-vous',         desc:'99 MAD/mois' },
            { n:'2', icon:'campaign',     title:'Créez une annonce',    desc:'Établissement + prix + places' },
            { n:'3', icon:'group',        title:'Recevez des inscrits', desc:'80% de chaque paiement' },
          ].map(s => (
            <div key={s.n} className="bg-surface-container-lowest dark:bg-dark-surface-container rounded-2xl p-4 shadow-ambient space-y-2">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center mx-auto text-white font-bold text-sm">{s.n}</div>
              <span className="material-symbols-outlined text-primary dark:text-primary-fixed icon-md block">{s.icon}</span>
              <p className="font-semibold text-xs text-on-surface dark:text-white/80">{s.title}</p>
              <p className="text-xs text-on-surface-variant dark:text-white/40">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="bg-surface-container-lowest dark:bg-dark-surface-container rounded-3xl shadow-ambient p-6 space-y-3 text-left">
          <p className="font-headline font-semibold text-on-surface dark:text-white/90 mb-2">Votre abonnement inclut</p>
          {[
            'Annonces illimitées visibles par tous les étudiants',
            '80% de chaque inscription payée par un étudiant',
            'Email de chaque étudiant inscrit pour le contacter',
            'Tableau de bord : revenus, inscrits, statistiques',
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-3">
              <CheckCircle size={16} className="text-green-500 shrink-0"/>
              <span className="text-sm text-on-surface dark:text-white/80">{f}</span>
            </div>
          ))}
        </div>
        {error && <div className="bg-error-container text-on-error-container rounded-2xl p-3 text-sm">{error}</div>}
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-3">
            <span className="font-headline font-extrabold text-5xl text-primary dark:text-primary-fixed">99</span>
            <div className="text-left">
              <p className="font-semibold text-on-surface dark:text-white/80">MAD / mois</p>
              <p className="text-xs text-on-surface-variant dark:text-white/40">Résiliable à tout moment</p>
            </div>
          </div>
          <Button onClick={() => setShowPayment(true)} size="lg" className="w-full flex items-center justify-center gap-2">
            <span className="material-symbols-outlined icon-md">credit_card</span>
            S'abonner et créer mes annonces
          </Button>
        </div>
      </div>
      <PaymentModal open={showPayment} onClose={() => setShowPayment(false)}
        amount={99} description="Abonnement Conseiller Tawjih — 1 mois"
        onSuccess={handleSuccess}/>
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────
export default function CounselorDashboard() {
  const { user }  = useAuth()
  const [paymentsData,  setPaymentsData]  = useState({ payments:[], total_earned:0, pending_amount:0 })
  const [announcements, setAnnouncements] = useState([])
  const [schools,       setSchools]       = useState([])
  const [loading,       setLoading]       = useState(true)
  const [isSubscribed,  setIsSubscribed]  = useState(false)
  const [modal,         setModal]         = useState(null)
  const [selected,      setSelected]      = useState(null)
  const [form,          setForm]          = useState(EMPTY_FORM)
  const [saving,        setSaving]        = useState(false)
  const [feedback,      setFeedback]      = useState({ type:'', msg:'' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // ✅ FIX BUG 1 : Vérifier d'abord le cache localStorage (rapide)
      const localValid = isLocalSubValid(user.id)

      const [counselorRes, paymentsRes, annRes, schoolsRes] = await Promise.all([
        api.get(`/counselors/${user.id}`).catch(() => ({ data: null })),
        api.get('/payments/counselor').catch(() => ({ data:{ payments:[], total_earned:0, pending_amount:0 } })),
        api.get('/announcements/my').catch(() => ({ data:{ announcements:[] } })),
        api.get('/schools?limit=100').catch(() => ({ data:{ schools:[] } })),
      ])

      const apiSubscribed = counselorRes.data?.counselor?.is_subscribed === true
      const apiExpiresAt  = counselorRes.data?.counselor?.subscription_expires_at

      // ✅ Mettre à jour localStorage si l'API confirme l'abonnement
      if (apiSubscribed && apiExpiresAt) {
        setLocalSub(user.id, apiExpiresAt)
      } else if (!apiSubscribed) {
        // L'API dit non-abonné → effacer le cache local si expiré
        const local = getLocalSub(user.id)
        if (local && new Date(local.expires_at) <= new Date()) {
          clearLocalSub(user.id)
        }
      }

      // ✅ Abonné si API dit oui OU si cache local encore valide
      const subscribed = apiSubscribed || localValid
      setIsSubscribed(subscribed)
      setPaymentsData(paymentsRes.data || { payments:[], total_earned:0, pending_amount:0 })
      setAnnouncements(annRes.data.announcements || [])
      setSchools(schoolsRes.data.schools || [])
    } catch (err) {
      console.error('Load error:', err)
      // En cas d'erreur réseau, on fait confiance au cache local
      if (isLocalSubValid(user.id)) {
        setIsSubscribed(true)
      }
    } finally {
      setLoading(false)
    }
  }, [user.id])

  useEffect(() => { load() }, [load])

  // ✅ FIX : handleSubscribed appelé uniquement après succès API + localStorage
  const handleSubscribed = useCallback(() => {
    setIsSubscribed(true)
    load()
  }, [load])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const openCreate = () => { setForm(EMPTY_FORM); setSelected(null); setModal('form') }
  const openEdit   = (ann) => {
    setSelected(ann)
    setForm({ title:ann.title||'', description:ann.description||'', price:ann.price||'',
      school_id:ann.school_id||'', max_students:ann.max_students||'10',
      deadline:ann.deadline?ann.deadline.slice(0,10):'' })
    setModal('form')
  }
  const openDelete = (ann) => { setSelected(ann); setModal('delete') }

  const handleSave = async () => {
    if (!form.title) return setFeedback({ type:'error', msg:'Titre requis.' })
    if (!form.price || parseFloat(form.price) <= 0) return setFeedback({ type:'error', msg:'Prix invalide.' })
    setSaving(true); setFeedback({ type:'', msg:'' })
    try {
      const payload = {
        title:        form.title.trim(),
        description:  form.description.trim(),
        price:        parseFloat(form.price),
        max_students: parseInt(form.max_students) || 10,
        school_id:    form.school_id || null,
        deadline:     form.deadline  || null,
      }
      if (selected) await api.put(`/announcements/${selected.id}`, payload)
      else          await api.post('/announcements', payload)
      setFeedback({ type:'success', msg: selected ? 'Mise à jour effectuée.' : 'Annonce publiée !' })
      setModal(null); load()
    } catch (err) {
      setFeedback({ type:'error', msg: err.response?.data?.error || 'Erreur.' })
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await api.delete(`/announcements/${selected.id}`)
      setModal(null); load()
    } finally { setSaving(false) }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center pt-24"><Spinner size="lg"/></div>
  if (!isSubscribed) return <SubscriptionWall onActivated={handleSubscribed} userId={user.id}/>

  return (
    <div className="max-w-6xl mx-auto px-6 pt-28 pb-16 space-y-10">

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="section-label">Espace conseiller</p>
          <h1 className="font-headline font-bold text-3xl text-on-surface dark:text-white/90">
            Bonjour, {user?.full_name?.split(' ')[0]}
          </h1>
        </div>
        <Button onClick={openCreate} className="flex items-center gap-2 shrink-0">
          <Plus size={16}/> Nouvelle annonce
        </Button>
      </div>

      <Alert type={feedback.type} message={feedback.msg}/>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="payments"  label="Revenus confirmés"  value={`${parseFloat(paymentsData.total_earned||0).toFixed(0)} MAD`}  color="green"/>
        <StatCard icon="pending"   label="En attente"         value={`${parseFloat(paymentsData.pending_amount||0).toFixed(0)} MAD`} color="amber"/>
        <StatCard icon="campaign"  label="Annonces publiées"  value={announcements.filter(a=>a.is_active).length}                    color="primary"/>
        <StatCard icon="group"     label="Étudiants inscrits" value={(paymentsData.payments||[]).filter(p=>p.status==='paid').length} color="blue"/>
      </div>

      {/* Guide premier usage */}
      {announcements.length === 0 && (
        <div className="bg-primary/5 dark:bg-primary-fixed/5 border border-primary/20 rounded-3xl p-6 space-y-4">
          <p className="font-headline font-semibold text-on-surface dark:text-white/80">Créez votre première annonce</p>
          <div className="space-y-2">
            {['Cliquez "Nouvelle annonce" en haut à droite',
              'Choisissez l\'établissement cible (ex: ENSA Agadir)',
              'Définissez votre prix et le nombre de places disponibles',
              'Décrivez votre service : aide au dossier, simulation entretien...',
              'Publiez — visible immédiatement par les étudiants'].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">{i+1}</div>
                <p className="text-sm text-on-surface-variant dark:text-white/60">{step}</p>
              </div>
            ))}
          </div>
          <Button onClick={openCreate} className="flex items-center gap-2"><Plus size={16}/>Créer ma première annonce</Button>
        </div>
      )}

      {/* Annonces */}
      {announcements.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-headline font-bold text-xl text-on-surface dark:text-white/90">Mes annonces</h2>
            <span className="text-sm text-on-surface-variant dark:text-white/40">{announcements.length} annonce{announcements.length>1?'s':''}</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {announcements.map(ann => (
              <Card key={ann.id} className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-headline font-semibold text-on-surface dark:text-white/90 line-clamp-2">{ann.title}</p>
                    {ann.schools && <p className="text-xs text-on-surface-variant dark:text-white/40 mt-0.5">{ann.schools.name}</p>}
                  </div>
                  <p className="font-headline font-bold text-secondary dark:text-secondary-container shrink-0">{parseFloat(ann.price).toFixed(0)} MAD</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={ann.is_active?'success':'danger'}>{ann.is_active?'Publiée':'Inactive'}</Badge>
                  <span className="text-xs text-on-surface-variant dark:text-white/40">{ann.enrolled_count}/{ann.max_students} inscrits</span>
                </div>
                <div className="h-1.5 bg-surface-container dark:bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-primary/60 rounded-full" style={{width:`${Math.min((ann.enrolled_count/ann.max_students)*100,100)}%`}}/>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={()=>openEdit(ann)} className="flex items-center gap-1.5 flex-1">
                    <Pencil size={13}/> Modifier
                  </Button>
                  <button onClick={()=>openDelete(ann)} className="p-2 rounded-xl text-error hover:bg-error-container/30 transition-colors">
                    <Trash2 size={15}/>
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Étudiants inscrits */}
      <div className="space-y-4">
        <h2 className="font-headline font-bold text-xl text-on-surface dark:text-white/90">
          Étudiants inscrits {(paymentsData.payments||[]).filter(p=>p.status==='paid').length > 0 &&
            `(${(paymentsData.payments||[]).filter(p=>p.status==='paid').length})`}
        </h2>

        {(paymentsData.payments||[]).filter(p=>p.status==='paid').length === 0 ? (
          <div className="bg-surface-container-lowest dark:bg-dark-surface-container rounded-3xl p-8 text-center shadow-ambient">
            <span className="material-symbols-outlined text-on-surface-variant dark:text-white/20 icon-xl block mb-2">group</span>
            <p className="text-on-surface-variant dark:text-white/40 text-sm">Aucun étudiant inscrit pour le moment</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(paymentsData.payments||[]).filter(p=>p.status==='paid').map(p => (
              <div key={p.id} className="bg-surface-container-lowest dark:bg-dark-surface-container rounded-2xl shadow-ambient p-5 flex items-center gap-4 flex-wrap">
                <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {p.users?.full_name?.[0]?.toUpperCase() || 'E'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-on-surface dark:text-white/90">{p.users?.full_name || '—'}</p>
                  <p className="text-sm text-on-surface-variant dark:text-white/50">{p.announcements?.title || '—'}</p>
                  <p className="text-xs text-on-surface-variant dark:text-white/30 mt-0.5">
                    Inscrit le {new Date(p.created_at).toLocaleDateString('fr-MA',{day:'numeric',month:'long',year:'numeric'})}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-headline font-bold text-green-600 dark:text-green-400">+{parseFloat(p.counselor_payout||0).toFixed(0)} MAD</p>
                  <Badge variant="success">Confirmé</Badge>
                </div>
                <div className="w-full border-t border-surface-container dark:border-white/5 pt-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary dark:text-primary-fixed icon-sm">mail</span>
                    <span className="text-sm font-semibold text-primary dark:text-primary-fixed">{p.users?.email || 'Email non disponible'}</span>
                  </div>
                  <a
                    href={`mailto:${p.users?.email}?subject=Inscription ${p.announcements?.title}&body=Bonjour ${p.users?.full_name},%0A%0AVotre inscription pour "${p.announcements?.title}" est confirmée.%0A%0AJe vous contacte pour organiser la suite.%0A%0ACordialement`}
                    className="btn-primary text-sm py-2 px-4 flex items-center gap-1.5 shrink-0"
                  >
                    <span className="material-symbols-outlined icon-sm">send</span>
                    Contacter
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal créer/modifier */}
      <Modal open={modal==='form'} onClose={()=>setModal(null)}
        title={selected?"Modifier l'annonce":"Créer une annonce d'inscription"} maxWidth="max-w-2xl">
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          <Alert type={feedback.type} message={feedback.msg}/>
          <Input label="Titre *" value={form.title} onChange={e=>set('title',e.target.value)}
            placeholder='Ex: "Accompagnement inscription ENSA Agadir 2025"'/>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Prix (MAD) *" type="number" min="1" value={form.price}
              onChange={e=>set('price',e.target.value)} placeholder="250"/>
            <Input label="Places disponibles" type="number" min="1" value={form.max_students}
              onChange={e=>set('max_students',e.target.value)}/>
          </div>
          <Select label="Établissement cible" placeholder="Choisir..."
            options={schools.map(s=>({value:s.id,label:`${s.name} — ${s.city}`}))}
            value={form.school_id} onChange={e=>set('school_id',e.target.value)}/>
          <Input label="Date limite" type="date" value={form.deadline}
            onChange={e=>set('deadline',e.target.value)}/>
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-on-surface dark:text-white/80">Description du service</label>
            <textarea className="input-field resize-none dark:bg-dark-surface-container dark:text-white/90" rows={5}
              value={form.description} onChange={e=>set('description',e.target.value)}
              placeholder={`Décrivez ce que vous offrez :\n- Vérification du dossier complet\n- Préparation à l'entretien\n- Aide lettre de motivation\n- Suivi jusqu'à la réponse`}/>
          </div>
          {form.price && parseFloat(form.price) > 0 && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-3 text-sm">
              <p className="font-semibold text-green-800 dark:text-green-300">Vos revenus estimés</p>
              <p className="text-green-700 dark:text-green-400 text-xs mt-1">
                Par inscription : <strong>{(parseFloat(form.price)*0.8).toFixed(0)} MAD</strong>
                {form.max_students?` · Si complet : ${(parseFloat(form.price)*0.8*parseInt(form.max_students)).toFixed(0)} MAD`:''}
              </p>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={()=>setModal(null)}>Annuler</Button>
            <Button loading={saving} onClick={handleSave} className="flex items-center gap-2">
              <Plus size={15}/>{selected?'Enregistrer':"Publier l'annonce"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={modal==='delete'} onClose={()=>setModal(null)} title="Supprimer l'annonce">
        <p className="text-sm text-on-surface-variant dark:text-white/60 mb-5">
          Supprimer <strong>"{selected?.title}"</strong> ? Cette action est irréversible.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={()=>setModal(null)}>Annuler</Button>
          <Button variant="danger" loading={saving} onClick={handleDelete}>Supprimer</Button>
        </div>
      </Modal>
    </div>
  )
}