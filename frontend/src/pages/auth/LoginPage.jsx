/**
 * pages/auth/LoginPage.jsx
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Input, Button, Alert } from '../../components/ui'
import { GraduationCap, Mail, Lock } from 'lucide-react'

export default function LoginPage() {
  const { login }    = useAuth()
  const navigate     = useNavigate()
  const [form, setForm]   = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError('Email ou mot de passe incorrect.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-24 pb-12 zellige-bg">
      <div className="w-full max-w-md space-y-8 animate-fade-up">

        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto shadow-ambient-md">
            <GraduationCap size={28} className="text-white" />
          </div>
          <h1 className="font-headline font-bold text-2xl text-on-surface dark:text-white/90">Connexion</h1>
          <p className="text-sm text-on-surface-variant dark:text-white/50">
            Pas encore de compte ?{' '}
            <Link to="/register" className="text-primary dark:text-primary-fixed font-semibold hover:underline">
              S'inscrire
            </Link>
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface-container-lowest dark:bg-dark-surface-container rounded-3xl shadow-ambient p-8 space-y-6">
          <Alert type="error" message={error} />

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Adresse email"
              type="email"
              placeholder="vous@example.com"
              icon={<Mail size={16} />}
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              required
              autoComplete="email"
            />
            <Input
              label="Mot de passe"
              type="password"
              placeholder="••••••••"
              icon={<Lock size={16} />}
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              required
              autoComplete="current-password"
            />

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-primary dark:text-primary-fixed hover:underline">
                Mot de passe oublié ?
              </Link>
            </div>

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Se connecter
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
