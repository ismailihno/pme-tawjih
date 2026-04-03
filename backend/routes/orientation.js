/**
 * routes/orientation.js
 * Questionnaire submission and recommendation algorithm.
 */

const router = require('express').Router();
const supabase = require('../config/supabase');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

/**
 * Core Orientation Algorithm
 * 
 * Scores each field based on:
 * - Keyword matches in interests and skills answers
 * - Bac type compatibility
 * - Weighted scores from recommendation config
 */
async function runOrientationAlgorithm(answers, bacType) {
  // Fetch current parameters from DB (admin-configurable)
  const { data: configs } = await supabase
    .from('recommendations')
    .select('field, parameters, description, icon');

  if (!configs) return [];

  const results = [];

  for (const config of configs) {
    const params = config.parameters;
    const keywords = params.keywords || [];
    const allowedBacTypes = params.bac_types || [];
    const weight = params.weight || 1.0;

    let score = 0;
    const matchedKeywords = [];

    // Score 1: Keyword matching in all text answers
    const allAnswerText = Object.values(answers).join(' ').toLowerCase();
    for (const keyword of keywords) {
      if (allAnswerText.includes(keyword.toLowerCase())) {
        score += 10;
        matchedKeywords.push(keyword);
      }
    }

    // Score 2: Bac type compatibility
    if (bacType && allowedBacTypes.includes(bacType)) {
      score += 20;
    }

    // Score 3: Explicit field preference in answers
    if (answers.preferred_field === config.field) {
      score += 30;
    }

    // Score 4: Subject matching
    const subjectMap = {
      'Informatique': ['math', 'informatique', 'physique', 'technologie'],
      'Médecine': ['biologie', 'chimie', 'sciences naturelles'],
      'Commerce': ['économie', 'gestion', 'comptabilité', 'mathematiques'],
      'Droit': ['français', 'histoire', 'philosophie', 'langue'],
      'Ingénierie': ['math', 'physique', 'technologie', 'mécanique'],
      'Arts': ['arts', 'dessin', 'musique', 'expression', 'créativité', 'esthétique'],
    };

    const subjects = answers.favorite_subjects || [];
    const fieldSubjects = subjectMap[config.field] || [];
    for (const sub of subjects) {
      if (fieldSubjects.some(fs => sub.toLowerCase().includes(fs))) {
        score += 15;
      }
    }

    // Score 5: Arts detection spécifique
    if (config.field === 'Arts') {
      const interests = answers.interests || [];
      const skills = answers.skills || [];
      const bacStrength = answers.bac_strength || '';
      
      if (interests.includes('art')) score += 25;
      if (skills.includes('créativité')) score += 20;
      if (bacStrength === 'arts') score += 30;
      if (answers.preferred_field === 'Arts') score += 30;
      if (allAnswerText.includes('art') || allAnswerText.includes('design') || allAnswerText.includes('créat')) score += 10;
    }

    // Apply weight multiplier
    const finalScore = Math.min(score * weight, 100);

    results.push({
      field: config.field,
      score: Math.round(finalScore * 100) / 100,
      description: config.description,
      icon: config.icon,
      matched_keywords: matchedKeywords,
    });
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  return results;
}

// ── POST /api/orientation/submit ─────────────────────────────
// Submit questionnaire and get recommendations
router.post('/submit', async (req, res) => {
  const { answers } = req.body;

  if (!answers || typeof answers !== 'object') {
    return res.status(400).json({ error: 'answers object is required' });
  }

  try {
    // Get student record
    const { data: student } = await supabase
      .from('students')
      .select('id, bac_type')
      .eq('user_id', req.user.id)
      .single();

    if (!student) {
      return res.status(404).json({ error: 'Please complete your profile first' });
    }

    // Run algorithm
    const results = await runOrientationAlgorithm(answers, student.bac_type);

    if (results.length === 0) {
      return res.status(500).json({ error: 'Algorithm failed to produce results' });
    }

    const top = results[0];

    // Generate explanation
    const explanation = generateExplanation(top, answers, student.bac_type);

    // Save the top recommendation to DB
    const { data: orientation, error } = await supabase
      .from('orientations')
      .insert({
        student_id: student.id,
        answers,
        suggested_field: top.field,
        score: top.score,
        explanation,
      })
      .select()
      .single();

    if (error) {
      console.error('Orientation insert error:', error);
    }

    res.json({
      orientation_id: orientation?.id,
      results,
      top_recommendation: { ...top, explanation },
    });
  } catch (err) {
    console.error('Submit orientation error:', err);
    res.status(500).json({ error: 'Failed to process orientation' });
  }
});

// ── GET /api/orientation/results ─────────────────────────────
router.get('/results', async (req, res) => {
  try {
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    if (!student) return res.status(404).json({ error: 'Student not found' });

    const { data, error } = await supabase
      .from('orientations')
      .select('*')
      .eq('student_id', student.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) return res.status(500).json({ error: error.message });

    res.json({ results: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

/**
 * Helper: Generate a human-readable explanation for the top result
 */
function generateExplanation(top, answers, bacType) {
  const keywords = top.matched_keywords.join(', ');
  let text = `Basé sur vos réponses, le domaine ${top.field} correspond le mieux à votre profil`;

  if (keywords) {
    text += ` (mots-clés détectés: ${keywords})`;
  }

  if (bacType) {
    text += `. Votre baccalauréat en ${bacType} est bien adapté à cette filière.`;
  } else {
    text += '.';
  }

  text += ` Avec un score de compatibilité de ${top.score}/100, cette orientation vous offre de bonnes perspectives.`;

  return text;
}

module.exports = router;