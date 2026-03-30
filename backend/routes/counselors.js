/**
 * routes/counselors.js
 *
 * FIX BUG 1 — Page paiement revient :
 *   GET /:id utilise .maybeSingle() (pas .single() qui crash si 0 résultat)
 *   et retourne is_subscribed recalculé selon subscription_expires_at.
 */

const router  = require('express').Router();
const supabase = require('../config/supabase');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// ── GET /api/counselors ───────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('counselors')
      .select(`*, users!counselors_user_id_fkey(full_name, email)`)
      .eq('is_verified', true)
      .order('rating', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json({ counselors: data });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── GET /api/counselors/:id ───────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    // FIX : maybeSingle() ne crash pas si pas encore de profil counselor
    const { data, error } = await supabase
      .from('counselors')
      .select(`
        *,
        users!counselors_user_id_fkey(full_name, email),
        announcements!announcements_counselor_id_fkey(id, title, price, enrolled_count, max_students, is_active)
      `)
      .eq('user_id', req.params.id)
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });

    // Pas de profil → non abonné
    if (!data) {
      return res.json({ counselor: { is_subscribed: false, subscription_expires_at: null } });
    }

    // FIX : recalculer is_subscribed selon subscription_expires_at
    let isActiveSubscription = data.is_subscribed;
    if (data.subscription_expires_at) {
      isActiveSubscription = data.is_subscribed && new Date(data.subscription_expires_at) > new Date();
    }

    res.json({ counselor: { ...data, is_subscribed: isActiveSubscription } });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── POST /api/counselors/profile ──────────────────────────────
router.post('/profile', requireAuth, async (req, res) => {
  const { bio, specialties, phone } = req.body;
  try {
    const { data, error } = await supabase
      .from('counselors')
      .upsert({ user_id: req.user.id, bio, specialties, phone }, { onConflict: 'user_id' })
      .select().single();

    if (error) return res.status(500).json({ error: error.message });

    if (req.user.role === 'student') {
      await supabase.from('users').update({ role: 'counselor' }).eq('id', req.user.id);
    }

    res.json({ counselor: data });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── POST /api/counselors/verify/:userId ───────────────────────
router.post('/verify/:userId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('counselors')
      .update({ is_verified: true })
      .eq('user_id', req.params.userId)
      .select().single();

    if (error || !data) return res.status(404).json({ error: 'Conseiller introuvable' });
    res.json({ message: 'Conseiller vérifié', counselor: data });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;