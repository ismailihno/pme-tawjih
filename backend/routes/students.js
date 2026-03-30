/**
 * routes/students.js
 * Student profile management and progress tracking.
 *
 * FIX BUG 1 : Le PUT /profile ne doit pas écraser profile_data (is_premium).
 *              On fusionne l'ancien profile_data avec les nouvelles valeurs.
 */

const router = require('express').Router();
const supabase = require('../config/supabase');
const { requireAuth } = require('../middleware/auth');

// All routes require authentication
router.use(requireAuth);

// ── GET /api/students/profile ────────────────────────────────
router.get('/profile', async (req, res) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('id, email, full_name, role, created_at')
      .eq('id', req.user.id)
      .single();

    const { data: student } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    res.json({ user, student });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// ── PUT /api/students/profile ────────────────────────────────
router.put('/profile', async (req, res) => {
  const { full_name, bac_type, bac_year, city, profile_data } = req.body;

  try {
    // Update users table
    if (full_name) {
      await supabase.from('users').update({ full_name }).eq('id', req.user.id);
    }

    // ✅ FIX BUG 1 : Récupérer l'ancien profile_data pour ne pas écraser is_premium
    const { data: existingStudent } = await supabase
      .from('students')
      .select('profile_data')
      .eq('user_id', req.user.id)
      .maybeSingle();

    // Fusionner : anciennes valeurs + nouvelles (sans jamais supprimer is_premium)
    const mergedProfileData = {
      ...(existingStudent?.profile_data || {}),
      ...(profile_data || {}),
    };

    // Update or upsert students table
    const { error } = await supabase.from('students').upsert({
      user_id: req.user.id,
      bac_type,
      bac_year,
      city,
      profile_data: mergedProfileData,  // ← données fusionnées, is_premium préservé
    }, { onConflict: 'user_id' });

    if (error) return res.status(500).json({ error: error.message });

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ── GET /api/students/orientations ──────────────────────────
// Get all orientation results for this student
router.get('/orientations', async (req, res) => {
  try {
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    const { data, error } = await supabase
      .from('orientations')
      .select('*')
      .eq('student_id', student.id)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    res.json({ orientations: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orientations' });
  }
});

// ── PUT /api/students/orientations/:id/save ──────────────────
// Toggle save/unsave an orientation result
router.put('/orientations/:id/save', async (req, res) => {
  const { id } = req.params;
  const { is_saved } = req.body;

  try {
    const { error } = await supabase
      .from('orientations')
      .update({ is_saved })
      .eq('id', id);

    if (error) return res.status(500).json({ error: error.message });

    res.json({ message: 'Orientation save status updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update' });
  }
});

module.exports = router;