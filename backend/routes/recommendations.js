/**
 * routes/recommendations.js
 * Admin management of orientation algorithm parameters.
 */

const router = require('express').Router();
const supabase = require('../config/supabase');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// ── GET /api/recommendations ─────────────────────────────────
// Public: get all field configs
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('recommendations')
      .select('*')
      .order('field');

    if (error) return res.status(500).json({ error: error.message });

    res.json({ recommendations: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

// ── PUT /api/recommendations/:field ──────────────────────────
// Admin only: update algorithm parameters for a field
router.put('/:field', requireAuth, requireAdmin, async (req, res) => {
  const { field } = req.params;
  const { parameters, description, icon } = req.body;

  try {
    const { data, error } = await supabase
      .from('recommendations')
      .update({ parameters, description, icon })
      .eq('field', field)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    res.json({ recommendation: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update recommendation' });
  }
});

// ── POST /api/recommendations ─────────────────────────────────
// Admin only: add a new orientation path
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const { field, parameters, description, icon } = req.body;

  if (!field || !parameters) {
    return res.status(400).json({ error: 'field and parameters are required' });
  }

  try {
    const { data, error } = await supabase
      .from('recommendations')
      .insert({ field, parameters, description, icon })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    res.status(201).json({ recommendation: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create recommendation' });
  }
});

module.exports = router;
