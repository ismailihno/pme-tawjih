/**
 * context/AuthContext.jsx - Version stable, sans boucle infinie
 */
import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import api from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)
  const fetchingRef           = useRef(false)  // évite les appels parallèles

  const fetchProfile = async () => {
    if (fetchingRef.current) return   // déjà en cours → on ignore
    fetchingRef.current = true
    try {
      const { data } = await api.get('/auth/me')
      setUser(data.user)
    } catch {
      setUser(null)
    } finally {
      fetchingRef.current = false
      setLoading(false)
    }
  }

  useEffect(() => {
    // 1. Vérifier la session au montage UNE SEULE FOIS
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchProfile()
      } else {
        setLoading(false)
      }
    }).catch(() => setLoading(false))

    // 2. Écouter les changements d'auth (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        fetchProfile()
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setLoading(false)
      }
      // IGNORER TOKEN_REFRESHED → c'était la source de la boucle !
    })

    return () => subscription.unsubscribe()
  }, [])   // [] = une seule fois au montage

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    await fetchProfile()
    return data
  }

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload)
    await login(payload.email, payload.password)
    return data
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{
      user, loading,
      isAdmin:   user?.role === 'admin',
      isStudent: user?.role === 'student',
      isCounselor: user?.role === 'counselor',
      login, register, logout, fetchProfile
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
