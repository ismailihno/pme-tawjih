/**
 * routes/schools.js
 * Public school listing + admin CRUD operations.
 *
 * MODIFICATION : Le filtre "Ville" affiche toutes les villes du Maroc
 * sous forme de liste fixe complète, indépendamment de ce qui est stocké
 * en base de données.
 */

const router = require('express').Router();
const supabase = require('../config/supabase');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// ── Liste complète des villes du Maroc ───────────────────────
const ALL_MOROCCAN_CITIES = [
  'Agadir',
  'Aït Melloul',
  'Al Hoceïma',
  'Azemmour',
  'Azrou',
  'Beni Mellal',
  'Benguerir',
  'Berkane',
  'Berrechid',
  'Boujdour',
  'Bouskoura',
  'Casablanca',
  'Chefchaouen',
  'Dakhla',
  'El Jadida',
  'El Kelaa des Sraghna',
  'Errachidia',
  'Essaouira',
  'Fès',
  'Figuig',
  'Fnideq',
  'Guelmim',
  'Ifrane',
  'Inezgane',
  'Kalaat Mgouna',
  'Kénitra',
  'Khémisset',
  'Khénifra',
  'Khouribga',
  'Laâyoune',
  'Larache',
  'Marrakech',
  'Martil',
  'Meknès',
  'Midelt',
  'Mohammedia',
  'Nador',
  'Ouarzazate',
  'Oued Zem',
  'Oujda',
  'Rabat',
  'Safi',
  'Salé',
  'Sefrou',
  'Settat',
  'Sidi Kacem',
  'Sidi Slimane',
  'Skhirat',
  'Tan-Tan',
  'Tanger',
  'Taounate',
  'Taroudant',
  'Taza',
  'Tétouan',
  'Tiznit',
  'Youssoufia',
  'Zagora',
];

// ── GET /api/schools ─────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { city, domain, type, search, page = 1, limit = 12 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from('schools')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .range(offset, offset + parseInt(limit) - 1)
      .order('name');

    if (city)   query = query.eq('city', city);
    if (domain) query = query.eq('domain', domain);
    if (type)   query = query.eq('type', type);
    if (search) query = query.ilike('name', `%${search}%`);

    const { data, error, count } = await query;
    if (error) return res.status(500).json({ error: error.message });

    res.json({
      schools: data,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      total_pages: Math.ceil(count / parseInt(limit)),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch schools' });
  }
});

// ── GET /api/schools/filters ─────────────────────────────────
// MODIFICATION : retourne la liste fixe de toutes les villes du Maroc
router.get('/filters', async (req, res) => {
  try {
    const { data: schools } = await supabase
      .from('schools')
      .select('domain, type')
      .eq('is_active', true);

    const domains = [...new Set(schools.map(s => s.domain).filter(Boolean))].sort();
    const types   = ['public', 'private', 'semipublic'];

    res.json({ cities: ALL_MOROCCAN_CITIES, domains, types });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch filters' });
  }
});

// ── GET /api/schools/:id ─────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'School not found' });
    res.json({ school: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch school' });
  }
});

// ── POST /api/schools ─────────────────────────────────────────
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const { name, city, domain, type, description, admission_info, duration, website, logo_url, tags } = req.body;
  if (!name || !city || !domain || !type)
    return res.status(400).json({ error: 'name, city, domain, type are required' });

  try {
    const { data, error } = await supabase
      .from('schools')
      .insert({ name, city, domain, type, description, admission_info, duration, website, logo_url, tags })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json({ school: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create school' });
  }
});

// ── PUT /api/schools/:id ──────────────────────────────────────
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  const { name, city, domain, type, description, admission_info, duration, website, logo_url, tags, is_active } = req.body;
  try {
    const { data, error } = await supabase
      .from('schools')
      .update({ name, city, domain, type, description, admission_info, duration, website, logo_url, tags, is_active })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ school: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update school' });
  }
});

// ── DELETE /api/schools/:id ───────────────────────────────────
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { error } = await supabase
      .from('schools')
      .update({ is_active: false })
      .eq('id', req.params.id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'School deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete school' });
  }
});

module.exports = router;