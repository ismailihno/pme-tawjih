/**
 * routes/payments.js
 * FIX : GET /admin inclut maintenant tests + abonnements dans payments[]
 */

const express = require('express')
const router  = express.Router()
const supabase = require('../config/supabase')
const { requireAuth, requireAdmin } = require('../middleware/auth')

const COMMISSION_RATE     = 20
const COUNSELOR_SUB_PRICE = 150
const QUESTIONNAIRE_PRICE = 200

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
        premium_amount: QUESTIONNAIRE_PRICE,
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
        subscription_amount: COUNSELOR_SUB_PRICE,
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
      if (!ann || !ann.is_active) return res.status(400).json({ error: 'Annonce introuvable' })
      const { data: existing } = await supabase
        .from('payments').select('id')
        .eq('student_id', req.user.id).eq('announcement_id', announcement_id)
        .in('status', ['pending', 'paid']).maybeSingle()
      if (existing) return res.status(409).json({ error: 'Déjà inscrit' })
      if (ann.enrolled_count >= ann.max_students) return res.status(400).json({ error: 'Plus de places' })
      const amount            = parseFloat(ann.price)
      const commission_amount = parseFloat((amount * COMMISSION_RATE / 100).toFixed(2))
      const counselor_payout  = parseFloat((amount - commission_amount).toFixed(2))
      const { error } = await supabase.from('payments').insert({
        student_id: req.user.id, announcement_id, counselor_id: ann.counselor_id,
        amount, commission_rate: COMMISSION_RATE, commission_amount, counselor_payout,
        status: 'paid', payment_method: 'simulation',
        transaction_ref: `SIM-${Date.now()}`, paid_at: new Date().toISOString(),
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
// GET /payments/my
// ════════════════════════════════════════════════════════════
router.get('/my', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('payments').select('*').eq('student_id', req.user.id)
    if (error) return res.status(500).json({ error: error.message })
    res.json({ payments: data || [] })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ════════════════════════════════════════════════════════════
// GET /payments/counselor
// ════════════════════════════════════════════════════════════
router.get('/counselor', requireAuth, async (req, res) => {
  try {
    const { data: payments, error } = await supabase
      .from('payments').select('*').eq('counselor_id', req.user.id)
      .order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    const enriched = await Promise.all((payments || []).map(async (p) => {
      const [{ data: student }, { data: ann }] = await Promise.all([
        supabase.from('users').select('id, full_name, email').eq('id', p.student_id).maybeSingle(),
        supabase.from('announcements').select('id, title, price').eq('id', p.announcement_id).maybeSingle(),
      ])
      return { ...p, users: student || null, announcements: ann || null }
    }))
    const paid           = enriched.filter(p => p.status === 'paid')
    const total_earned   = paid.reduce((sum, p) => sum + parseFloat(p.counselor_payout || 0), 0)
    const pending_amount = enriched.filter(p => p.status === 'pending').reduce((sum, p) => sum + parseFloat(p.counselor_payout || 0), 0)
    res.json({ payments: enriched, total_earned: parseFloat(total_earned.toFixed(2)), pending_amount: parseFloat(pending_amount.toFixed(2)) })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ════════════════════════════════════════════════════════════
// GET /payments/admin — TABLEAU COMPLET (annonces + tests + profs)
// ════════════════════════════════════════════════════════════
router.get('/admin', requireAuth, requireAdmin, async (req, res) => {
  try {

    // ── 1. Paiements annonces ─────────────────────────────
    const { data: rawPayments, error } = await supabase
      .from('payments').select('*').order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })

    const annoncesRows = await Promise.all((rawPayments || []).map(async (p) => {
      const [{ data: student }, { data: ann }] = await Promise.all([
        supabase.from('users').select('full_name, email').eq('id', p.student_id).maybeSingle(),
        supabase.from('announcements').select('title').eq('id', p.announcement_id).maybeSingle(),
      ])
      return {
        ...p,
        users:         student || null,
        announcements: { title: ann?.title || '—' },
        payment_type:  'annonce',
        type_label:    'Inscription annonce',
      }
    }))

    // ── 2. Tests étudiants ────────────────────────────────
    const { data: allStudents } = await supabase
      .from('students')
      .select('user_id, profile_data, created_at')

    const testRows = []
    for (const s of (allStudents || [])) {
      if (s.profile_data?.is_premium !== true) continue
      const { data: u } = await supabase
        .from('users').select('full_name, email').eq('id', s.user_id).maybeSingle()
      testRows.push({
        id:               `test-${s.user_id}`,
        payment_type:     'test',
        type_label:       "Test d'orientation",
        status:           'paid',
        amount:           QUESTIONNAIRE_PRICE,
        commission_amount: 0,
        counselor_payout:  0,
        paid_at:          s.profile_data?.premium_activated_at || s.created_at,
        created_at:       s.profile_data?.premium_activated_at || s.created_at,
        users:            u || null,
        announcements:    { title: "Test d'orientation (200 MAD)" },
      })
    }

    // ── 3. Abonnements prof ───────────────────────────────
    const { data: counselors } = await supabase
      .from('counselors')
      .select('user_id, is_subscribed, subscription_amount, subscription_expires_at, subscription_ref, created_at')
      .eq('is_subscribed', true)

    const profRows = []
    for (const c of (counselors || [])) {
      const { data: u } = await supabase
        .from('users').select('full_name, email').eq('id', c.user_id).maybeSingle()
      const amount = parseFloat(c.subscription_amount || COUNSELOR_SUB_PRICE)
      profRows.push({
        id:               `sub-${c.user_id}`,
        payment_type:     'abonnement',
        type_label:       'Abonnement prof',
        status:           'paid',
        amount,
        commission_amount: 0,
        counselor_payout:  0,
        transaction_ref:   c.subscription_ref || null,
        paid_at:          c.created_at,
        created_at:       c.created_at,
        users:            u || null,
        announcements:    { title: `Abonnement prof (${amount} MAD/mois)` },
      })
    }

    // ── 4. Fusionner et trier ─────────────────────────────
    const allPayments = [...annoncesRows, ...testRows, ...profRows]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    // ── 5. Stats ──────────────────────────────────────────
    const total_commission = annoncesRows
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + parseFloat(p.commission_amount || 0), 0)
    const revenue_tests = testRows.length * QUESTIONNAIRE_PRICE
    const revenue_prof  = profRows.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
    const total_general = total_commission + revenue_tests + revenue_prof

    res.json({
      payments:         allPayments,          // ← contient les 3 types
      total_tests:      testRows.length,
      revenue_tests:    parseFloat(revenue_tests.toFixed(2)),
      total_prof:       profRows.length,
      revenue_prof:     parseFloat(revenue_prof.toFixed(2)),
      total_commission: parseFloat(total_commission.toFixed(2)),
      total_general:    parseFloat(total_general.toFixed(2)),
      total:            annoncesRows.length,
      pending:          annoncesRows.filter(p => p.status === 'pending').length,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ════════════════════════════════════════════════════════════
// POST /payments/confirm/:id  /  POST /payments/refund/:id
// ════════════════════════════════════════════════════════════
router.post('/confirm/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { error } = await supabase.from('payments')
      .update({ status: 'paid', notes: req.body.notes || null, paid_at: new Date().toISOString() })
      .eq('id', req.params.id)
    if (error) return res.status(500).json({ error: error.message })
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/refund/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { error } = await supabase.from('payments')
      .update({ status: 'refunded', notes: req.body.notes || null })
      .eq('id', req.params.id)
    if (error) return res.status(500).json({ error: error.message })
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router