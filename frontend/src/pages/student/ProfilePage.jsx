/**
 * pages/student/ProfilePage.jsx
 */

import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../lib/api'
import { Input, Select, Button, Card, Alert, PageHeader } from '../../components/ui'
import { Spinner } from '../../components/ui'

const BAC_TYPES = [
  { value: 'Sciences',       label: 'Sciences (SP/SVT)' },
  { value: 'Sciences Math',  label: 'Sciences Mathématiques' },
  { value: 'Economie',       label: 'Sciences Économiques' },
  { value: 'Lettres',        label: 'Lettres et Sciences Humaines' },
  { value: 'Technique',      label: 'Baccalauréat Technique' },
  { value: 'Arts Appliques', label: 'Arts Appliqués' },
]

const CITIES = ['Casablanca', 'Rabat', 'Marrakech', 'Fès', 'Tanger', 'Agadir', 'Meknès', 'Oujda', 'Tétouan', 'Safi', 'Autre']

export default function ProfilePage() {
  const { user, fetchProfile } = useAuth()
  const [form, setForm]         = useState({ full_name: '', bac_type: '', city: '', bac_year: '' })
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [success, setSuccess]   = useState('')
  const [error, setError]       = useState('')

  useEffect(() => {
    api.get('/students/profile').then(res => {
      const { user: u, student } = res.data
      setForm({
        full_name: u?.full_name || '',
        bac_type:  student?.bac_type || '',
        city:      student?.city || '',
        bac_year:  student?.bac_year || '',
      })
    }).finally(() => setLoading(false))
  }, [])

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await api.put('/students/profile', form)
      await fetchProfile()
      setSuccess('Profil mis à jour avec succès !')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la mise à jour.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center pt-24"><Spinner size="lg" /></div>
  }

  return (
    <div className="max-w-2xl mx-auto px-6 pt-28 pb-16">
      <PageHeader
        label="Compte"
        title="Mon profil"
        subtitle="Gardez vos informations à jour pour des recommandations précises."
      />

      {/* Avatar */}
      <Card className="mb-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shrink-0 text-2xl font-headline font-bold text-white">
          {form.full_name?.[0]?.toUpperCase() || '?'}
        </div>
        <div>
          <p className="font-headline font-bold text-on-surface dark:text-white/90">{form.full_name || 'Votre nom'}</p>
          <p className="text-sm text-on-surface-variant dark:text-white/40">{user?.email}</p>
          <p className="text-xs mt-1 bg-primary/10 text-primary dark:text-primary-fixed px-2.5 py-0.5 rounded-full inline-block font-semibold">
            {user?.role === 'admin' ? 'Administrateur' : 'Étudiant'}
          </p>
        </div>
      </Card>

      <Card>
        <Alert type="success" message={success} className="mb-5" />
        <Alert type="error" message={error} className="mb-5" />

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Nom complet"
            value={form.full_name}
            onChange={e => set('full_name', e.target.value)}
            placeholder="Votre nom complet"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Type de Bac"
              placeholder="Sélectionner..."
              options={BAC_TYPES}
              value={form.bac_type}
              onChange={e => set('bac_type', e.target.value)}
            />
            <Input
              label="Année du Bac"
              type="number"
              min={2015}
              max={new Date().getFullYear() + 1}
              value={form.bac_year}
              onChange={e => set('bac_year', e.target.value)}
              placeholder={new Date().getFullYear()}
            />
          </div>

          <Select
            label="Ville"
            placeholder="Sélectionner..."
            options={CITIES.map(c => ({ value: c, label: c }))}
            value={form.city}
            onChange={e => set('city', e.target.value)}
          />

          <div className="pt-2">
            <Button type="submit" size="lg" loading={saving} className="w-full sm:w-auto">
              Sauvegarder les modifications
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
