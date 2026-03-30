/**
 * pages/admin/AdminCareers.jsx
 * CRUD complet pour les filières/carrières.
 */

import { useState, useEffect } from 'react'
import api from '../../lib/api'
import AdminLayout from '../../components/admin/AdminLayout'
import { Input, Select, Textarea, Button, Badge, Spinner, Modal, Alert, EmptyState } from '../../components/ui'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'

const SECTORS = [
  'Santé','Ingénierie','Digital','Commerce','Droit',
  'Architecture','Éducation','Militaire','Entrepreneuriat','International',
]

const DOMAINS = [
  'Informatique','Médecine','Commerce','Droit',
  'Ingénierie','Sciences','Architecture','Arts','Communication','Tourisme',
]

const EMPLOYABILITY = ['très élevée','élevée','moyenne','faible']
const DIFFICULTY    = ['très élevée','élevée','moyenne','faible']
const BAC_OPTIONS   = ['Sciences','Sciences Math','Lettres','Economie','Technique','Arts Appliques']

const EMPTY_FORM = {
  id: '',
  title: '',
  sector: '',
  school_domain: '',
  icon: 'work',
  description: '',
  salary_min: '',
  salary_max: '',
  duration_studies: '',
  employability: 'élevée',
  difficulty: 'élevée',
  required_bac: [],
  ideal_profile: '',
  evolution: '',
  advantages: '',
  disadvantages: '',
}

export default function AdminCareers() {
  const [careers, setCareers]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [modal, setModal]       = useState(null)   // 'create' | 'edit' | 'delete'
  const [selected, setSelected] = useState(null)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [saving, setSaving]     = useState(false)
  const [feedback, setFeedback] = useState({ type: '', msg: '' })

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/careers')
      setCareers(data.careers || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = careers.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.sector.toLowerCase().includes(search.toLowerCase())
  )

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const toggleBac = (bac) => {
    set('required_bac', form.required_bac.includes(bac)
      ? form.required_bac.filter(b => b !== bac)
      : [...form.required_bac, bac]
    )
  }

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setFeedback({ type: '', msg: '' })
    setModal('create')
  }

  const openEdit = (c) => {
    setSelected(c)
    setForm({
      id: c.id,
      title: c.title,
      sector: c.sector,
      school_domain: c.school_domain,
      icon: c.icon || 'work',
      description: c.description || '',
      salary_min: c.salary_min ?? '',
      salary_max: c.salary_max ?? '',
      duration_studies: c.duration_studies || '',
      employability: c.employability || 'élevée',
      difficulty: c.difficulty || 'élevée',
      required_bac: c.required_bac || [],
      ideal_profile: c.ideal_profile || '',
      evolution: c.evolution || '',
      advantages: c.advantages || '',
      disadvantages: c.disadvantages || '',
    })
    setFeedback({ type: '', msg: '' })
    setModal('edit')
  }

  const openDelete = (c) => { setSelected(c); setModal('delete') }

  const handleSave = async () => {
    if (!form.title || !form.sector || !form.school_domain) {
      setFeedback({ type: 'error', msg: 'Titre, secteur et domaine sont requis.' })
      return
    }
    setSaving(true); setFeedback({ type: '', msg: '' })
    const payload = {
      ...form,
      salary_min: form.salary_min !== '' ? Number(form.salary_min) : null,
      salary_max: form.salary_max !== '' ? Number(form.salary_max) : null,
    }
    try {
      if (modal === 'create') await api.post('/careers', payload)
      if (modal === 'edit')   await api.put(`/careers/${selected.id}`, payload)
      setFeedback({ type: 'success', msg: modal === 'create' ? 'Carrière créée.' : 'Carrière mise à jour.' })
      setModal(null); load()
    } catch (err) {
      setFeedback({ type: 'error', msg: err.response?.data?.error || 'Erreur.' })
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await api.delete(`/careers/${selected.id}`)
      setFeedback({ type: 'success', msg: 'Carrière supprimée.' })
      setModal(null); load()
    } catch { setFeedback({ type: 'error', msg: 'Erreur lors de la suppression.' }) }
    finally { setSaving(false) }
  }

  const empColor = { 'très élevée': 'success', 'élevée': 'primary', 'moyenne': 'warning', 'faible': 'danger' }
  const difColor = { 'très élevée': 'danger',  'élevée': 'warning', 'moyenne': 'primary',  'faible': 'success' }

  return (
    <AdminLayout title="Filières & Carrières">
      <div className="space-y-6">
        <Alert type={feedback.type} message={feedback.msg} />

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-white/30" />
            <input
              className="input-field pl-10 dark:bg-dark-surface-container dark:text-white/90"
              placeholder="Rechercher par titre ou secteur..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Button onClick={openCreate} className="flex items-center gap-2 shrink-0">
            <Plus size={16} /> Ajouter une carrière
          </Button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="work"
            title="Aucune carrière"
            action={<Button onClick={openCreate} className="flex items-center gap-2"><Plus size={16} />Ajouter</Button>}
          />
        ) : (
          <div className="bg-surface-container-lowest dark:bg-dark-surface-container rounded-3xl shadow-ambient overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-container dark:border-white/5">
                  {['Carrière', 'Secteur', 'Domaine', 'Salaire (MAD)', 'Employabilité', 'Difficulté', 'Actions'].map(h => (
                    <th key={h} className={`px-5 py-4 text-left text-xs font-semibold text-on-surface-variant dark:text-white/40 uppercase tracking-wider ${h === 'Actions' ? 'text-right' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container dark:divide-white/5">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-surface-container-low dark:hover:bg-white/3 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary dark:text-primary-fixed" style={{ fontSize: 18 }}>{c.icon}</span>
                        <p className="text-sm font-semibold text-on-surface dark:text-white/80 max-w-[180px] truncate">{c.title}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4"><Badge variant="primary">{c.sector}</Badge></td>
                    <td className="px-5 py-4 text-sm text-on-surface-variant dark:text-white/50">{c.school_domain}</td>
                    <td className="px-5 py-4 text-sm text-on-surface-variant dark:text-white/50">
                      {c.salary_min != null && c.salary_max != null
                        ? `${c.salary_min.toLocaleString()} – ${c.salary_max.toLocaleString()}`
                        : '—'}
                    </td>
                    <td className="px-5 py-4"><Badge variant={empColor[c.employability] || 'primary'}>{c.employability}</Badge></td>
                    <td className="px-5 py-4"><Badge variant={difColor[c.difficulty] || 'warning'}>{c.difficulty}</Badge></td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-primary dark:text-primary-fixed hover:bg-primary/10 transition-colors" title="Modifier">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => openDelete(c)} className="p-1.5 rounded-lg text-error hover:bg-error-container/30 transition-colors" title="Supprimer">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-5 py-4 border-t border-surface-container dark:border-white/5">
              <p className="text-xs text-on-surface-variant dark:text-white/40">{filtered.length} carrière{filtered.length > 1 ? 's' : ''}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Create / Edit modal ── */}
      <Modal
        open={modal === 'create' || modal === 'edit'}
        onClose={() => setModal(null)}
        title={modal === 'create' ? 'Ajouter une carrière' : 'Modifier la carrière'}
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          <Alert type={feedback.type} message={feedback.msg} />

          {/* Identifiant & Titre */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Identifiant unique (slug) *"
              value={form.id}
              onChange={e => set('id', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
              placeholder="medecin-generaliste"
              disabled={modal === 'edit'}
            />
            <Input
              label="Icône Material"
              value={form.icon}
              onChange={e => set('icon', e.target.value)}
              placeholder="medical_services"
            />
          </div>

          <Input
            label="Titre de la carrière *"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="Médecin généraliste"
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Secteur *"
              options={SECTORS.map(s => ({ value: s, label: s }))}
              placeholder="Choisir..."
              value={form.sector}
              onChange={e => set('sector', e.target.value)}
            />
            <Select
              label="Domaine scolaire *"
              options={DOMAINS.map(d => ({ value: d, label: d }))}
              placeholder="Choisir..."
              value={form.school_domain}
              onChange={e => set('school_domain', e.target.value)}
            />
          </div>

          <Textarea
            label="Description"
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="Description du métier..."
            rows={3}
          />

          {/* Salaire & Durée */}
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Salaire min (MAD)"
              type="number"
              value={form.salary_min}
              onChange={e => set('salary_min', e.target.value)}
              placeholder="5000"
            />
            <Input
              label="Salaire max (MAD)"
              type="number"
              value={form.salary_max}
              onChange={e => set('salary_max', e.target.value)}
              placeholder="25000"
            />
            <Input
              label="Durée des études"
              value={form.duration_studies}
              onChange={e => set('duration_studies', e.target.value)}
              placeholder="5 ans"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Employabilité"
              options={EMPLOYABILITY.map(e => ({ value: e, label: e }))}
              value={form.employability}
              onChange={e => set('employability', e.target.value)}
            />
            <Select
              label="Difficulté"
              options={DIFFICULTY.map(d => ({ value: d, label: d }))}
              value={form.difficulty}
              onChange={e => set('difficulty', e.target.value)}
            />
          </div>

          {/* Bac requis — checkboxes */}
          <div>
            <p className="text-sm font-medium text-on-surface dark:text-white/80 mb-2">Bac requis</p>
            <div className="flex flex-wrap gap-2">
              {BAC_OPTIONS.map(bac => (
                <button
                  key={bac}
                  type="button"
                  onClick={() => toggleBac(bac)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    form.required_bac.includes(bac)
                      ? 'bg-primary text-on-primary border-primary'
                      : 'border-surface-container dark:border-white/10 text-on-surface-variant dark:text-white/50 hover:border-primary/50'
                  }`}
                >
                  {bac}
                </button>
              ))}
            </div>
          </div>

          <Textarea
            label="Profil idéal"
            value={form.ideal_profile}
            onChange={e => set('ideal_profile', e.target.value)}
            placeholder="Empathique, rigoureux..."
            rows={2}
          />
          <Textarea
            label="Évolution de carrière"
            value={form.evolution}
            onChange={e => set('evolution', e.target.value)}
            placeholder="Spécialisation possible..."
            rows={2}
          />
          <div className="grid grid-cols-2 gap-4">
            <Textarea
              label="Avantages"
              value={form.advantages}
              onChange={e => set('advantages', e.target.value)}
              placeholder="Salaire élevé, impact social..."
              rows={2}
            />
            <Textarea
              label="Inconvénients"
              value={form.disadvantages}
              onChange={e => set('disadvantages', e.target.value)}
              placeholder="Longues études, pression..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setModal(null)}>Annuler</Button>
            <Button loading={saving} onClick={handleSave}>
              {modal === 'create' ? 'Créer' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Delete modal ── */}
      <Modal open={modal === 'delete'} onClose={() => setModal(null)} title="Supprimer la carrière">
        <p className="text-sm text-on-surface-variant dark:text-white/60 mb-5">
          Voulez-vous supprimer <strong>{selected?.title}</strong> ? Cette action est irréversible.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setModal(null)}>Annuler</Button>
          <Button variant="danger" loading={saving} onClick={handleDelete}>Supprimer</Button>
        </div>
      </Modal>
    </AdminLayout>
  )
}