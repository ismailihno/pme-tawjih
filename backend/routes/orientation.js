/**
 * routes/orientation.js
 * Questionnaire submission and recommendation algorithm.
 *
 * CORRECTION SCORE : normalisation relative — le meilleur domaine obtient
 * exactement 100, les autres sont proportionnels à leur score brut.
 * Ainsi jamais deux domaines à 100% en même temps.
 * Les 15 questions sont toutes prises en compte.
 */

const router = require('express').Router();
const supabase = require('../config/supabase');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

async function runOrientationAlgorithm(answers, bacType) {
  const { data: configs } = await supabase
    .from('recommendations')
    .select('field, parameters, description, icon');

  if (!configs || configs.length === 0) return [];

  const raw = []; // scores bruts avant normalisation

  for (const config of configs) {
    const params          = config.parameters;
    const keywords        = params.keywords || [];
    const allowedBacTypes = params.bac_types || [];
    const weight          = params.weight || 1.0;

    let score = 0;
    const matchedKeywords = [];

    // ── 1. Keyword matching (interests + skills via texte brut) ──
    const allAnswerText = Object.values(answers).join(' ').toLowerCase();
    for (const keyword of keywords) {
      if (allAnswerText.includes(keyword.toLowerCase())) {
        score += 10;
        matchedKeywords.push(keyword);
      }
    }

    // ── 2. Compatibilité type de bac ──
    if (bacType && allowedBacTypes.includes(bacType)) {
      score += 20;
    }

    // ── 3. Filière préférée explicite ──
    if (answers.preferred_field === config.field) {
      score += 30;
    }

    // ── 4. Matières préférées ──
    const subjectMap = {
      'Informatique': ['math', 'informatique', 'physique', 'technologie'],
      'Médecine':     ['biologie', 'chimie', 'sciences naturelles'],
      'Commerce':     ['économie', 'gestion', 'comptabilité', 'mathematiques'],
      'Droit':        ['français', 'histoire', 'philosophie', 'langue'],
      'Ingénierie':   ['math', 'physique', 'technologie', 'mécanique'],
      'Arts':         ['arts', 'dessin', 'musique', 'expression', 'créativité'],
    };
    const subjects      = answers.favorite_subjects || [];
    const fieldSubjects = subjectMap[config.field] || [];
    for (const sub of subjects) {
      if (fieldSubjects.some(fs => sub.toLowerCase().includes(fs))) {
        score += 15;
      }
    }

    // ── 5. Point fort au bac (bac_strength) ──
    const bacStrengthMap = {
      'Informatique': ['sciences_exactes', 'technologie'],
      'Médecine':     ['sciences_vie', 'sciences_exactes'],
      'Commerce':     ['sciences_eco'],
      'Droit':        ['lettres'],
      'Ingénierie':   ['sciences_exactes', 'technologie'],
      'Arts':         ['arts'],
    };
    if (answers.bac_strength && (bacStrengthMap[config.field] || []).includes(answers.bac_strength)) {
      score += 20;
    }

    // ── 6. Environnement de travail (work_style) ──
    const workStyleMap = {
      'Informatique': ['bureau', 'independant', 'international'],
      'Médecine':     ['hopital'],
      'Commerce':     ['bureau', 'entreprise', 'international'],
      'Droit':        ['bureau'],
      'Ingénierie':   ['terrain', 'entreprise', 'international'],
      'Arts':         ['independant', 'bureau'],
    };
    if (answers.work_style && (workStyleMap[config.field] || []).includes(answers.work_style)) {
      score += 15;
    }

    // ── 7. Motivation principale ──
    const motivationMap = {
      'Informatique': ['salaire', 'innovation'],
      'Médecine':     ['impact', 'prestige'],
      'Commerce':     ['salaire', 'prestige', 'innovation'],
      'Droit':        ['prestige', 'impact', 'securite'],
      'Ingénierie':   ['salaire', 'innovation', 'securite'],
      'Arts':         ['passion', 'innovation'],
    };
    if (answers.motivation && (motivationMap[config.field] || []).includes(answers.motivation)) {
      score += 15;
    }

    // ── 8. Secteur préféré ──
    const sectorMap = {
      'Informatique': ['tech_digital'],
      'Médecine':     ['sante_pharma'],
      'Commerce':     ['finance_banque'],
      'Droit':        ['juridique'],
      'Ingénierie':   ['industrie', 'tech_digital'],
      'Arts':         ['arts_design'],
    };
    if (answers.preferred_sector && (sectorMap[config.field] || []).includes(answers.preferred_sector)) {
      score += 20;
    }

    // ── 9. Défi personnel ──
    const challengeMap = {
      'Informatique': ['technique', 'analyser'],
      'Médecine':     ['aider'],
      'Commerce':     ['leadership2', 'communication2'],
      'Droit':        ['communication2', 'analyser'],
      'Ingénierie':   ['technique', 'creation'],
      'Arts':         ['creation'],
    };
    if (answers.personal_challenge && (challengeMap[config.field] || []).includes(answers.personal_challenge)) {
      score += 15;
    }

    // ── 10. Modèle de réussite ──
    const roleModelMap = {
      'Informatique': ['developpeur'],
      'Médecine':     ['medecin'],
      'Commerce':     ['entrepreneur'],
      'Droit':        ['juriste'],
      'Ingénierie':   ['ingenieur'],
      'Arts':         ['chercheur'],
    };
    if (answers.role_model_type && (roleModelMap[config.field] || []).includes(answers.role_model_type)) {
      score += 20;
    }

    // ── 11. Durée d'études ──
    const durationMap = {
      'Informatique': ['3ans', '5ans', 'nsp'],
      'Médecine':     ['7ans'],
      'Commerce':     ['3ans', '5ans', 'nsp'],
      'Droit':        ['5ans', '7ans'],
      'Ingénierie':   ['5ans'],
      'Arts':         ['3ans', '5ans', 'nsp'],
    };
    if (answers.study_duration && (durationMap[config.field] || []).includes(answers.study_duration)) {
      score += 10;
    }

    // ── 12. Attentes salariales ──
    const highSalaryFields = ['Médecine', 'Ingénierie', 'Commerce', 'Informatique'];
    if (answers.income_expectation === 'tres_eleve' && highSalaryFields.includes(config.field)) score += 10;
    else if (answers.income_expectation === 'eleve' && highSalaryFields.includes(config.field)) score += 5;

    // ── 13. Type d'établissement ──
    const schoolTypeMap = {
      'Médecine':     ['public', 'grande_ecole'],
      'Ingénierie':   ['grande_ecole', 'public'],
      'Droit':        ['public', 'universite'],
      'Commerce':     ['prive', 'grande_ecole'],
      'Arts':         ['prive', 'grande_ecole'],
      'Informatique': ['prive', 'grande_ecole', 'public'],
    };
    if (answers.school_type && (schoolTypeMap[config.field] || []).includes(answers.school_type)) {
      score += 8;
    }

    // ── 14. Langue d'enseignement ──
    const languageMap = {
      'Informatique': ['francais', 'anglais', 'international'],
      'Médecine':     ['francais', 'arabe', 'bilingue'],
      'Commerce':     ['francais', 'anglais', 'international'],
      'Droit':        ['francais', 'arabe', 'bilingue'],
      'Ingénierie':   ['francais', 'anglais', 'international'],
      'Arts':         ['francais', 'international'],
    };
    if (answers.language_preference && (languageMap[config.field] || []).includes(answers.language_preference)) {
      score += 8;
    }

    // ── Appliquer le poids (multiplicateur de la DB) ──
    const weightedScore = score * weight;

    raw.push({
      field: config.field,
      rawScore: weightedScore,
      description: config.description,
      icon: config.icon,
      matched_keywords: matchedKeywords,
    });
  }

  // ── CORRECTION : Normalisation relative ──────────────────────
  // Le domaine avec le score brut le plus haut obtient exactement 100.
  // Les autres sont proportionnels → jamais deux domaines à 100%.
  const maxRaw = Math.max(...raw.map(r => r.rawScore));

  const results = raw.map(r => ({
    field: r.field,
    score: maxRaw > 0 ? Math.round((r.rawScore / maxRaw) * 100) : 0,
    description: r.description,
    icon: r.icon,
    matched_keywords: r.matched_keywords,
  }));

  results.sort((a, b) => b.score - a.score);
  return results;
}

// ── POST /api/orientation/submit ─────────────────────────────
router.post('/submit', async (req, res) => {
  const { answers } = req.body;

  if (!answers || typeof answers !== 'object') {
    return res.status(400).json({ error: 'answers object is required' });
  }

  try {
    const { data: student } = await supabase
      .from('students')
      .select('id, bac_type')
      .eq('user_id', req.user.id)
      .single();

    if (!student) {
      return res.status(404).json({ error: 'Please complete your profile first' });
    }

    const results = await runOrientationAlgorithm(answers, student.bac_type);

    if (results.length === 0) {
      return res.status(500).json({ error: 'Algorithm failed to produce results' });
    }

    const top         = results[0];
    const explanation = generateExplanation(top, answers, student.bac_type);

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

    if (error) console.error('Orientation insert error:', error);

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

// ── Génération de l'explication ──────────────────────────────
function generateExplanation(top, answers, bacType) {
  const keywords = top.matched_keywords.join(', ');
  let text = `Basé sur vos réponses, le domaine ${top.field} correspond le mieux à votre profil`;

  if (keywords) text += ` (mots-clés détectés : ${keywords})`;
  if (bacType)  text += `. Votre baccalauréat en ${bacType} est bien adapté à cette filière.`;
  else          text += '.';

  text += ` Score de compatibilité : ${top.score}/100.`;
  return text;
}

module.exports = router;