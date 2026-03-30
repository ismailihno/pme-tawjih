/**
 * pages/admin/AdminRecommendations.jsx
 * Edit orientation algorithm parameters per field.
 */

import { useState, useEffect } from 'react'
import api from '../../lib/api'
import AdminLayout from '../../components/admin/AdminLayout'
import { Input, Textarea, Button, Card, Alert, Spinner, Modal } from '../../components/ui'
import { Pencil } from 'lucide-react'

const fieldIcons = {
  'Informatique':'computer','Médecine':'medical_services',
  'Commerce':'storefront','Droit':'gavel','Ingénierie':'engineering',
}

export default function AdminRecommendations() {
  const [recs, setRecs]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm]         = useState({ description:'', icon:'', weight:'', keywords:'' })
  const [saving, setSaving]     = useState(false)
  const [feedback, setFeedback] = useState({ type:'', msg:'' })

  const load = () => {
    api.get('/recommendations').then(res => setRecs(res.data.recommendations || [])).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const openEdit = (rec) => {
    setSelected(rec)
    const params = rec.parameters || {}
    setForm({
      description: rec.description || '',
      icon:        rec.icon || '',
      weight:      params.weight || '1.0',
      keywords:    (params.keywords || []).join(', '),
    })
    setModal(true)
  }

  const handleSave = async () => {
    setSaving(true); setFeedback({type:'',msg:''})
    try {
      const params = {
        ...selected.parameters,
        weight:   parseFloat(form.weight) || 1.0,
        keywords: form.keywords.split(',').map(k => k.trim()).filter(Boolean),
      }
      await api.put(`/recommendations/${selected.field}`, {
        description: form.description,
        icon: form.icon,
        parameters: params,
      })
      setFeedback({ type:'success', msg:'Paramètres mis à jour.' })
      setModal(false); load()
    } catch (err) {
      setFeedback({ type:'error', msg: err.response?.data?.error || 'Erreur.' })
    } finally { setSaving(false) }
  }

  return (
    <AdminLayout title="Algorithme d'orientation">
      <div className="space-y-6">
        <div className="bg-secondary-container/10 dark:bg-secondary-container/5 border border-secondary-container/30 rounded-3xl p-5 flex gap-3">
          <span className="material-symbols-outlined text-secondary dark:text-secondary-container icon-md shrink-0">info</span>
          <div className="text-sm text-on-surface-variant dark:text-white/60 space-y-1">
            <p className="font-semibold text-on-surface dark:text-white/80">Comment fonctionne l'algorithme</p>
            <p>Chaque filière possède des <strong>mots-clés</strong> détectés dans les réponses des étudiants, une liste de <strong>types de Bac compatibles</strong>, et un <strong>poids</strong> multiplicateur (1.0 = neutre, 1.2 = favorisé).</p>
          </div>
        </div>

        <Alert type={feedback.type} message={feedback.msg} />

        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
            {recs.map(rec => (
              <Card key={rec.field} className="space-y-4 animate-fade-up">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 dark:bg-primary-fixed/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary dark:text-primary-fixed icon-md">
                        {fieldIcons[rec.field] || 'school'}
                      </span>
                    </div>
                    <div>
                      <p className="font-headline font-bold text-sm text-on-surface dark:text-white/90">{rec.field}</p>
                      <p className="text-xs text-on-surface-variant dark:text-white/40">
                        Poids: ×{rec.parameters?.weight || 1.0}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => openEdit(rec)}
                    className="p-1.5 rounded-xl text-primary dark:text-primary-fixed hover:bg-primary/10 transition-colors"
                  >
                    <Pencil size={15} />
                  </button>
                </div>

                {rec.description && (
                  <p className="text-xs text-on-surface-variant dark:text-white/50 leading-relaxed">{rec.description}</p>
                )}

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-on-surface-variant dark:text-white/40">Mots-clés ({rec.parameters?.keywords?.length || 0})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(rec.parameters?.keywords || []).slice(0,6).map(kw => (
                      <span key={kw} className="text-xs bg-surface-container dark:bg-white/10 text-on-surface-variant dark:text-white/50 px-2 py-0.5 rounded-full">
                        {kw}
                      </span>
                    ))}
                    {(rec.parameters?.keywords?.length || 0) > 6 && (
                      <span className="text-xs text-on-surface-variant dark:text-white/30">+{rec.parameters.keywords.length - 6}</span>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold text-on-surface-variant dark:text-white/40">Types Bac compatibles</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(rec.parameters?.bac_types || []).map(bt => (
                      <span key={bt} className="text-xs bg-primary/10 dark:bg-primary-fixed/10 text-primary dark:text-primary-fixed px-2 py-0.5 rounded-full font-medium">
                        {bt}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={`Modifier — ${selected?.field}`}>
        <div className="space-y-4">
          <Alert type={feedback.type} message={feedback.msg} />
          <Input
            label="Poids (multiplicateur)"
            type="number"
            step="0.1"
            min="0.1"
            max="3"
            value={form.weight}
            onChange={e => setForm(f => ({...f,weight:e.target.value}))}
          />
          <div>
            <label className="block text-sm font-semibold text-on-surface dark:text-white/80 mb-1.5">
              Mots-clés (séparés par des virgules)
            </label>
            <textarea
              className="input-field dark:bg-dark-surface-container dark:text-white/90 resize-none"
              rows={3}
              value={form.keywords}
              onChange={e => setForm(f => ({...f,keywords:e.target.value}))}
              placeholder="tech, code, logique, algorithme, informatique"
            />
          </div>
          <Textarea
            label="Description"
            value={form.description}
            onChange={e => setForm(f => ({...f,description:e.target.value}))}
            rows={2}
          />
          <Input
            label="Icône (Material Symbols)"
            value={form.icon}
            onChange={e => setForm(f => ({...f,icon:e.target.value}))}
            placeholder="computer"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setModal(false)}>Annuler</Button>
            <Button loading={saving} onClick={handleSave}>Enregistrer</Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  )
}
