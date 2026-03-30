/**
 * routes/announcements.js
 * FIX FINAL : le JOIN counselors utilise user_id (pas counselor_id)
 * car la table counselors a une FK sur users.id via user_id
 */

const router  = require('express').Router();
const supabase = require('../config/supabase');
const { requireAuth } = require('../middleware/auth');

function requireCounselor(req, res, next) {
  if (!req.user || !['counselor','admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Accès conseiller requis' });
  }
  next();
}

// ── GET /api/announcements ────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { school_id, search, page = 1, limit = 12 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Requête SANS le JOIN counselors qui cause le 500
    // On récupère les annonces + école + user du conseiller
    let query = supabase
      .from('announcements')
      .select(`
        *,
        schools (id, name, city, domain),
        users!announcements_counselor_id_fkey (id, full_name)
      `, { count: 'exact' })
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (school_id) query = query.eq('school_id', school_id);
    if (search)    query = query.ilike('title', `%${search}%`);

    const { data, error, count } = await query;

    if (error) {
      console.error('Announcements error:', error);
      return res.status(500).json({ error: error.message });
    }

    // Enrichir avec les données counselor séparément (évite le JOIN problématique)
    const enriched = await Promise.all((data || []).map(async (ann) => {
      const { data: counselor } = await supabase
        .from('counselors')
        .select('id, rating, total_reviews, is_verified')
        .eq('user_id', ann.counselor_id)
        .maybeSingle();
      return { ...ann, counselors: counselor || null };
    }));

    res.json({ announcements: enriched, total: count || 0, page: parseInt(page) });
  } catch (err) {
    console.error('Announcements catch:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── GET /api/announcements/my ────────────────────────────────
router.get('/my', requireAuth, requireCounselor, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select(`*, schools (name, city)`)
      .eq('counselor_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json({ announcements: data });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── GET /api/announcements/:id ───────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select(`
        *,
        schools (id, name, city, domain, description),
        users!announcements_counselor_id_fkey (id, full_name, email)
      `)
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Annonce non trouvée' });

    // Récupérer le profil counselor séparément
    const { data: counselor } = await supabase
      .from('counselors')
      .select('bio, specialties, rating, total_reviews, is_verified')
      .eq('user_id', data.counselor_id)
      .maybeSingle();

    res.json({ announcement: { ...data, counselors: counselor || null } });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── POST /api/announcements ──────────────────────────────────
router.post('/', requireAuth, requireCounselor, async (req, res) => {
  const { title, description, price, school_id, max_students, deadline } = req.body;
  if (!title || !price) return res.status(400).json({ error: 'title et price requis' });

  try {
    const { data, error } = await supabase
      .from('announcements')
      .insert({
        counselor_id: req.user.id,
        title, description, price,
        school_id: school_id || null,
        max_students: max_students || 10,
        deadline: deadline || null,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json({ announcement: data });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── PUT /api/announcements/:id ───────────────────────────────
router.put('/:id', requireAuth, requireCounselor, async (req, res) => {
  try {
    const { data: ann } = await supabase
      .from('announcements').select('counselor_id').eq('id', req.params.id).single();
    if (!ann) return res.status(404).json({ error: 'Introuvable' });
    if (ann.counselor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    const { title, description, price, max_students, deadline, is_active } = req.body;
    const { data, error } = await supabase
      .from('announcements')
      .update({ title, description, price, max_students, deadline, is_active })
      .eq('id', req.params.id)
      .select().single();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ announcement: data });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── DELETE /api/announcements/:id ───────────────────────────
router.delete('/:id', requireAuth, requireCounselor, async (req, res) => {
  try {
    const { data: ann } = await supabase
      .from('announcements').select('counselor_id').eq('id', req.params.id).single();
    if (!ann) return res.status(404).json({ error: 'Introuvable' });
    if (ann.counselor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    await supabase.from('announcements').update({ is_active: false }).eq('id', req.params.id);
    res.json({ message: 'Annonce supprimée' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;