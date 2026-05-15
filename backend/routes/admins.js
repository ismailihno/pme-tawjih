/**
 * routes/admins.js
 * Admin-only routes: user management, stats, and admin creation.
 *
 * MODIFICATION : Ajout de 2 routes pour les signalements d'annonces :
 *  - GET  /api/admins/reports        → liste tous les signalements
 *  - PATCH /api/admins/reports/:id   → résoudre ou ignorer un signalement
 */

const router = require('express').Router();
const supabase = require('../config/supabase');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.use(requireAuth, requireAdmin);

// ── GET /api/admins/stats ─────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [
      { count: totalUsers },
      { count: totalStudents },
      { count: totalSchools },
      { count: totalOrientations },
      { data: popularFields },
      { data: recentOrientations },
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('students').select('*', { count: 'exact', head: true }),
      supabase.from('schools').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('orientations').select('*', { count: 'exact', head: true }),
      supabase.from('orientations').select('suggested_field').order('created_at', { ascending: false }).limit(100),
      supabase.from('orientations').select('created_at, suggested_field').order('created_at', { ascending: false }).limit(5),
    ]);

    const fieldCounts = {};
    (popularFields || []).forEach(o => {
      fieldCounts[o.suggested_field] = (fieldCounts[o.suggested_field] || 0) + 1;
    });

    const topFields = Object.entries(fieldCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([field, count]) => ({ field, count }));

    res.json({
      total_users: totalUsers || 0,
      total_students: totalStudents || 0,
      total_schools: totalSchools || 0,
      total_orientations: totalOrientations || 0,
      popular_fields: topFields,
      recent_orientations: recentOrientations || [],
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// ── GET /api/admins/users ─────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from('users')
      .select(`
        id, email, full_name, role, is_active, created_at,
        students (bac_type, city)
      `, { count: 'exact' })
      .range(offset, offset + parseInt(limit) - 1)
      .order('created_at', { ascending: false });

    if (role)   query = query.eq('role', role);
    if (search) query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);

    const { data, error, count } = await query;
    if (error) return res.status(500).json({ error: error.message });

    res.json({ users: data, total: count, page: parseInt(page) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ── PUT /api/admins/users/:id ─────────────────────────────────
router.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { is_active, role, full_name } = req.body;

  if (id === req.user.id && is_active === false) {
    return res.status(400).json({ error: 'Cannot suspend your own account' });
  }

  try {
    const updates = {};
    if (typeof is_active === 'boolean') updates.is_active = is_active;
    if (role && ['student', 'admin'].includes(role)) updates.role = role;
    if (full_name) updates.full_name = full_name;

    const { error } = await supabase.from('users').update(updates).eq('id', id);
    if (error) return res.status(500).json({ error: error.message });

    if (role === 'admin') {
      await supabase.from('admins').upsert({ user_id: id }, { onConflict: 'user_id' });
    }

    res.json({ message: 'User updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// ── POST /api/admins/create ───────────────────────────────────
router.post('/create', async (req, res) => {
  const { email, password, full_name, permissions } = req.body;
  if (!email || !password || !full_name) {
    return res.status(400).json({ error: 'email, password, full_name required' });
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email, password, email_confirm: true,
    });
    if (authError) return res.status(400).json({ error: authError.message });

    const userId = authData.user.id;
    await supabase.from('users').insert({ id: userId, email, full_name, role: 'admin' });
    await supabase.from('admins').insert({
      user_id: userId,
      permissions: permissions || { manage_schools: true, manage_users: true, manage_admins: false },
    });

    res.status(201).json({ message: 'Admin created successfully', id: userId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create admin' });
  }
});

// ── DELETE /api/admins/users/:id ──────────────────────────────
router.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  if (id === req.user.id) {
    return res.status(400).json({ error: 'Cannot deactivate your own account' });
  }
  try {
    const { error } = await supabase.from('users').update({ is_active: false }).eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Account deactivated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to deactivate account' });
  }
});

// ── GET /api/admins/premium-stats ─────────────────────────────
router.get('/premium-stats', async (req, res) => {
  try {
    const { data: students, error } = await supabase.from('students').select('profile_data');
    if (error) return res.status(500).json({ error: error.message });

    const premiumCount = (students || []).filter(s => s.profile_data?.is_premium === true).length;
    res.json({ count: premiumCount, revenue: premiumCount * 200 });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch premium stats' });
  }
});

// ── GET /api/admins/reports ───────────────────────────────────
// MODIFICATION : Liste tous les signalements d'annonces
router.get('/reports', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('announcement_reports')
      .select(`
        id, cause, comment, status, admin_note, created_at,
        announcements (
          id, title,
          users!announcements_counselor_id_fkey (full_name, email)
        ),
        users!announcement_reports_reporter_id_fkey (full_name, email)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Reports fetch error:', error);
      return res.status(500).json({ error: error.message });
    }

    // Reformater pour que le frontend accède facilement aux données
    const reports = (data || []).map(r => ({
      id:         r.id,
      cause:      r.cause,
      comment:    r.comment,
      status:     r.status,
      admin_note: r.admin_note,
      created_at: r.created_at,
      announcements: r.announcements
        ? { title: r.announcements.title, users: r.announcements.users }
        : null,
      users: r.users, // reporter
    }));

    res.json({ reports });
  } catch (err) {
    console.error('Reports error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── PATCH /api/admins/reports/:id ────────────────────────────
// MODIFICATION : Résoudre ou ignorer un signalement
router.patch('/reports/:id', async (req, res) => {
  const { status, admin_note } = req.body;

  if (!['resolved', 'dismissed'].includes(status)) {
    return res.status(400).json({ error: 'status doit être "resolved" ou "dismissed"' });
  }

  try {
    const { data, error } = await supabase
      .from('announcement_reports')
      .update({ status, admin_note: admin_note || null })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      console.error('Report update error:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ report: data, message: 'Signalement mis à jour.' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;