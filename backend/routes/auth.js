/**
 * routes/auth.js — Avec choix de rôle student/counselor à l'inscription
 */
const router   = require('express').Router()
const supabase = require('../config/supabase')
const { requireAuth } = require('../middleware/auth')

// ── POST /api/auth/register ──────────────────────────────────
router.post('/register', async (req, res) => {
  const { email, password, full_name, bac_type, city, bac_year, role } = req.body

  if (!email || !password || !full_name)
    return res.status(400).json({ error: 'email, password, full_name sont requis' })

  // Sécurité : seuls student et counselor sont autorisés à l'inscription
  const userRole = role === 'counselor' ? 'counselor' : 'student'

  try {
    // 1. Créer dans Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email, password, email_confirm: true,
    })
    if (authError) return res.status(400).json({ error: authError.message })

    const userId = authData.user.id

    // 2. Insérer dans users avec le bon rôle
    const { error: userError } = await supabase.from('users').insert({
      id: userId, email, full_name, role: userRole,
    })
    if (userError) {
      await supabase.auth.admin.deleteUser(userId)
      return res.status(500).json({ error: 'Erreur création profil' })
    }

    // 3. Si étudiant → créer profil student
    if (userRole === 'student') {
      await supabase.from('students').insert({
        user_id: userId,
        bac_type: bac_type || null,
        bac_year: bac_year || null,
        city:     city || null,
        profile_data: { is_premium: false },
      })
    }

    // 4. Si conseiller → créer profil counselor (non vérifié par défaut)
    if (userRole === 'counselor') {
      await supabase.from('counselors').insert({
        user_id:     userId,
        is_verified: false,
        specialties: [],
      })
    }

    res.status(201).json({
      message: 'Compte créé avec succès',
      user: { id: userId, email, full_name, role: userRole },
    })
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ── POST /api/auth/login ─────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password)
    return res.status(400).json({ error: 'email et password requis' })

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return res.status(401).json({ error: 'Email ou mot de passe incorrect' })

    const { data: profile } = await supabase
      .from('users').select('role, full_name, is_active').eq('id', data.user.id).single()

    if (!profile?.is_active)
      return res.status(403).json({ error: 'Compte suspendu' })

    res.json({
      access_token:  data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: { id: data.user.id, email: data.user.email, full_name: profile?.full_name, role: profile?.role || 'student' },
    })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ── POST /api/auth/refresh ───────────────────────────────────
router.post('/refresh', async (req, res) => {
  const { refresh_token } = req.body
  if (!refresh_token) return res.status(400).json({ error: 'refresh_token requis' })
  const { data, error } = await supabase.auth.refreshSession({ refresh_token })
  if (error) return res.status(401).json({ error: error.message })
  res.json({ access_token: data.session.access_token })
})

// ── POST /api/auth/forgot-password ──────────────────────────
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'email requis' })
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
  })
  if (error) return res.status(400).json({ error: error.message })
  res.json({ message: 'Email de réinitialisation envoyé' })
})

// ── GET /api/auth/me ─────────────────────────────────────────
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user })
})

module.exports = router
