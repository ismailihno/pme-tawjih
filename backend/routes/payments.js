/**
 * routes/payments.js
 * FIX : Les JOINs Supabase avec plusieurs FK vers la même table (users)
 * nécessitent le format : users!fk_name
 * FK confirmées : payments_student_id_fkey, payments_announcement_id_fkey
 * Solution : récupérer users séparément pour éviter l'ambiguïté
 */

const express = require('express')
const router  = express.Router()
const supabase = require('../config/supabase')
const { requireAuth, requireAdmin } = require('../middleware/auth')

const COMMISSION_RATE = 20

// ════════════════════════════════════════════════════════════
// POST /payments/simulate
// ════════════════════════════════════════════════════════════
router.post('/simulate', requireAuth, async (req, res) => {
  const { type, announcement_id } = req.body

  try {
    if (type === 'questionnaire' || type === 'premium') {
      const { data: student } = await supabase
        .from('students').select('profile_data').eq('user_id', req.user.id).single()

      const profileData = {
        ...(student?.profile_data || {}),
        is_premium: true,
        premium_activated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('students').update({ profile_data: profileData }).eq('user_id', req.user.id)

      if (error) return res.status(500).json({ error: error.message })
      return res.json({ success: true, message: 'Accès premium activé !' })
    }

    if (type === 'counselor_subscription') {
      const { data: existing } = await supabase
        .from('counselors').select('is_subscribed, subscription_expires_at')
        .eq('user_id', req.user.id).maybeSingle()

      const now = new Date()
      const expiresAt = existing?.subscription_expires_at ? new Date(existing.subscription_expires_at) : null

      if (existing?.is_subscribed && expiresAt && expiresAt > now) {
        return res.json({ success: true, message: 'Abonnement déjà actif.', expires_at: existing.subscription_expires_at })
      }

      const newExpiresAt = new Date(now.getTime())
      newExpiresAt.setMonth(newExpiresAt.getMonth() + 1)

      const { error } = await supabase.from('counselors').upsert({
        user_id: req.user.id,
        is_subscribed: true,
        subscription_ref: `SIM-${Date.now()}`,
        subscription_expires_at: newExpiresAt.toISOString(),
        is_verified: false,
        specialties: [],
      }, { onConflict: 'user_id' })

      if (error) return res.status(500).json({ error: error.message })

      await supabase.from('users').update({ role: 'counselor' }).eq('id', req.user.id)

      return res.json({ success: true, message: 'Abonnement conseiller activé !', expires_at: newExpiresAt.toISOString() })
    }

    if (type === 'announcement' && announcement_id) {
      const { data: ann } = await supabase
        .from('announcements').select('*').eq('id', announcement_id).single()

      if (!ann || !ann.is_active)
        return res.status(400).json({ error: 'Annonce introuvable' })

      const { data: existing } = await supabase
        .from('payments').select('id')
        .eq('student_id', req.user.id).eq('announcement_id', announcement_id)
        .in('status', ['pending', 'paid']).maybeSingle()

      if (existing) return res.status(409).json({ error: 'Déjà inscrit' })
      if (ann.enrolled_count >= ann.max_students)
        return res.status(400).json({ error: 'Plus de places' })

      const amount = parseFloat(ann.price)
      const commission_amount = parseFloat((amount * COMMISSION_RATE / 100).toFixed(2))
      const counselor_payout  = parseFloat((amount - commission_amount).toFixed(2))

      const { error } = await supabase.from('payments').insert({
        student_id: req.user.id,
        announcement_id,
        counselor_id: ann.counselor_id,
        amount, commission_rate: COMMISSION_RATE,
        commission_amount, counselor_payout,
        status: 'paid', payment_method: 'simulation',
        transaction_ref: `SIM-${Date.now()}`,
        paid_at: new Date().toISOString(),
      })

      if (error) return res.status(500).json({ error: error.message })
      return res.json({ success: true, message: 'Inscription confirmée !' })
    }

    return res.status(400).json({ error: 'Type invalide' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ════════════════════════════════════════════════════════════
// GET /payments/my — Historique étudiant
// ════════════════════════════════════════════════════════════
router.get('/my', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('payments').select('*').eq('student_id', req.user.id)
    if (error) return res.status(500).json({ error: error.message })
    res.json({ payments: data || [] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ════════════════════════════════════════════════════════════
// GET /payments/counselor — Inscriptions du conseiller
// ════════════════════════════════════════════════════════════
router.get('/counselor', requireAuth, async (req, res) => {
  try {
    // Récupérer paiements sans JOIN complexe
    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .eq('counselor_id', req.user.id)
      .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ error: error.message })

    // Enrichir avec les infos étudiant et annonce séparément
    const enriched = await Promise.all((payments || []).map(async (p) => {
      const [{ data: student }, { data: ann }] = await Promise.all([
        supabase.from('users').select('id, full_name, email').eq('id', p.student_id).maybeSingle(),
        supabase.from('announcements').select('id, title, price').eq('id', p.announcement_id).maybeSingle(),
      ])
      return { ...p, users: student || null, announcements: ann || null }
    }))

    const paid = enriched.filter(p => p.status === 'paid')
    const total_earned   = paid.reduce((sum, p) => sum + parseFloat(p.counselor_payout || 0), 0)
    const pending_amount = enriched.filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + parseFloat(p.counselor_payout || 0), 0)

    res.json({
      payments: enriched,
      total_earned:   parseFloat(total_earned.toFixed(2)),
      pending_amount: parseFloat(pending_amount.toFixed(2)),
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ════════════════════════════════════════════════════════════
// GET /payments/admin — Vue admin
// ════════════════════════════════════════════════════════════
router.get('/admin', requireAuth, requireAdmin, async (req, res) => {
  try {
    // Récupérer tous les paiements sans JOIN ambigu
    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ error: error.message })

    // Enrichir avec étudiant + annonce séparément
    const enriched = await Promise.all((payments || []).map(async (p) => {
      const [{ data: student }, { data: ann }] = await Promise.all([
        supabase.from('users').select('full_name, email').eq('id', p.student_id).maybeSingle(),
        supabase.from('announcements').select('title').eq('id', p.announcement_id).maybeSingle(),
      ])
      return { ...p, users: student || null, announcements: ann || null }
    }))

    const total_commission = enriched
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + parseFloat(p.commission_amount || 0), 0)

    res.json({
      payments: enriched,
      total_commission: parseFloat(total_commission.toFixed(2)),
      total: enriched.length,
      pending: enriched.filter(p => p.status === 'pending').length,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router