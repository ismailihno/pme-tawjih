/**
 * pages/admin/AdminSchools.jsx
 * Full CRUD for schools — add, edit, delete.
 */

import { useState, useEffect } from 'react'
import api from '../../lib/api'
import AdminLayout from '../../components/admin/AdminLayout'
import { Input, Select, Textarea, Button, Badge, Spinner, Modal, Alert, EmptyState } from '../../components/ui'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'

const DOMAINS = ['Informatique','Médecine','Commerce','Droit','Ingénierie','Sciences','Architecture','Arts','Communication','Tourisme']
const CITIES  = ['Casablanca','Rabat','Marrakech','Fès','Tanger','Agadir','Meknès','Oujda','Tétouan','Safi','Kenitra','Beni Mellal']
const TYPES   = [{ value:'public',label:'Public' },{ value:'private',label:'Privé' },{ value:'semipublic',label:'Semi-public' }]

const EMPTY_FORM = { name:'',city:'',domain:'',type:'public',description:'',admission_info:'',duration:'',website:'' }

export default function AdminSchools() {
  const [schools, setSchools]   = useState([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [modal, setModal]       = useState(null) // 'create' | 'edit' | 'delete'
  const [selected, setSelected] = useState(null)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [saving, setSaving]     = useState(false)
  const [feedback, setFeedback] = useState({ type:'', msg:'' })
  const [page, setPage]         = useState(1)

  const load = async () => {
    setLoading(true)
    const params = new URLSearchParams({ page, limit: 15 })
    if (search) params.set('search', search)
    try {
      const { data } = await api.get(`/schools?${params}&include_inactive=true`)
      setSchools(data.schools || [])
      setTotal(data.total || 0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page, search])

  const openCreate = () => { setForm(EMPTY_FORM); setModal('create') }
  const openEdit   = (s)  => { setSelected(s); setForm({ name:s.name,city:s.city,domain:s.domain,type:s.type,description:s.description||'',admission_info:s.admission_info||'',duration:s.duration||'',website:s.website||'' }); setModal('edit') }
  const openDelete = (s)  => { setSelected(s); setModal('delete') }

  const set = (k,v) => setForm(f => ({...f,[k]:v}))

  const handleSave = async () => {
    setSaving(true); setFeedback({type:'',msg:''})
    try {
      if (modal === 'create') await api.post('/schools', form)
      if (modal === 'edit')   await api.put(`/schools/${selected.id}`, form)
      setFeedback({ type:'success', msg: modal==='create' ? 'Établissement créé.' : 'Établissement mis à jour.' })
      setModal(null); load()
    } catch (err) {
      setFeedback({ type:'error', msg: err.response?.data?.error || 'Erreur.' })
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await api.delete(`/schools/${selected.id}`)
      setFeedback({ type:'success', msg: 'Établissement supprimé.' })
      setModal(null); load()
    } catch { setFeedback({ type:'error', msg: 'Erreur lors de la suppression.' }) }
    finally { setSaving(false) }
  }

  const typeColors = { public:'public', private:'private', semipublic:'semipublic' }

  return (
    <AdminLayout title="Établissements">
      <div className="space-y-6">
        <Alert type={feedback.type} message={feedback.msg} />

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-white/30" />
            <input className="input-field pl-10 dark:bg-dark-surface-container dark:text-white/90" placeholder="Rechercher..." value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          <Button onClick={openCreate} className="flex items-center gap-2 shrink-0">
            <Plus size={16} /> Ajouter un établissement
          </Button>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : schools.length === 0 ? (
          <EmptyState icon="school" title="Aucun établissement" action={<Button onClick={openCreate} className="flex items-center gap-2"><Plus size={16}/>Ajouter</Button>} />
        ) : (
          <div className="bg-surface-container-lowest dark:bg-dark-surface-container rounded-3xl shadow-ambient overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-container dark:border-white/5">
                  {['Établissement','Ville','Domaine','Type','Actions'].map(h => (
                    <th key={h} className={`px-5 py-4 text-left text-xs font-semibold text-on-surface-variant dark:text-white/40 uppercase tracking-wider ${h==='Actions'?'text-right':''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container dark:divide-white/5">
                {schools.map(s => (
                  <tr key={s.id} className={`hover:bg-surface-container-low dark:hover:bg-white/3 transition-colors ${!s.is_active?'opacity-50':''}`}>
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-on-surface dark:text-white/80 max-w-xs truncate">{s.name}</p>
                      {!s.is_active && <Badge variant="danger" className="mt-1">Désactivé</Badge>}
                    </td>
                    <td className="px-5 py-4 text-sm text-on-surface-variant dark:text-white/50">{s.city}</td>
                    <td className="px-5 py-4"><Badge variant="primary">{s.domain}</Badge></td>
                    <td className="px-5 py-4"><Badge variant={typeColors[s.type]}>{TYPES.find(t=>t.value===s.type)?.label||s.type}</Badge></td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg text-primary dark:text-primary-fixed hover:bg-primary/10 transition-colors" title="Modifier">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => openDelete(s)} className="p-1.5 rounded-lg text-error hover:bg-error-container/30 transition-colors" title="Supprimer">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {total > 15 && (
              <div className="flex justify-between items-center px-5 py-4 border-t border-surface-container dark:border-white/5">
                <p className="text-xs text-on-surface-variant dark:text-white/40">{total} établissements</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p=>Math.max(1,p-1))} disabled={page===1}>Préc.</Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p=>p+1)} disabled={page>=Math.ceil(total/15)}>Suiv.</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create / Edit modal */}
      <Modal open={modal==='create'||modal==='edit'} onClose={() => setModal(null)} title={modal==='create'?'Ajouter un établissement':'Modifier l\'établissement'} maxWidth="max-w-2xl">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <Alert type={feedback.type} message={feedback.msg} />
          <Input label="Nom de l'établissement *" value={form.name} onChange={e=>set('name',e.target.value)} placeholder="ENSA Agadir" required />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Ville *" options={CITIES.map(c=>({value:c,label:c}))} placeholder="Choisir..." value={form.city} onChange={e=>set('city',e.target.value)} />
            <Select label="Domaine *" options={DOMAINS.map(d=>({value:d,label:d}))} placeholder="Choisir..." value={form.domain} onChange={e=>set('domain',e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Type *" options={TYPES} value={form.type} onChange={e=>set('type',e.target.value)} />
            <Input label="Durée" value={form.duration} onChange={e=>set('duration',e.target.value)} placeholder="5 ans" />
          </div>
          <Textarea label="Description" value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Présentation de l'établissement..." rows={3} />
          <Textarea label="Conditions d'admission" value={form.admission_info} onChange={e=>set('admission_info',e.target.value)} placeholder="Bac Sciences + concours national..." rows={3} />
          <Input label="Site web" type="url" value={form.website} onChange={e=>set('website',e.target.value)} placeholder="https://..." />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setModal(null)}>Annuler</Button>
            <Button loading={saving} onClick={handleSave}>{modal==='create'?'Créer':'Enregistrer'}</Button>
          </div>
        </div>
      </Modal>

      {/* Delete modal */}
      <Modal open={modal==='delete'} onClose={() => setModal(null)} title="Supprimer l'établissement">
        <p className="text-sm text-on-surface-variant dark:text-white/60 mb-5">
          Voulez-vous supprimer <strong>{selected?.name}</strong> ? Cette action est irréversible.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setModal(null)}>Annuler</Button>
          <Button variant="danger" loading={saving} onClick={handleDelete}>Supprimer</Button>
        </div>
      </Modal>
    </AdminLayout>
  )
}
