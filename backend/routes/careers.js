/**
 * routes/careers.js — CRUD complet pour les filières/carrières
 * GET    /api/careers              → liste toutes les carrières
 * POST   /api/careers              → crée une carrière (admin)
 * PUT    /api/careers/:id          → modifie une carrière (admin)
 * DELETE /api/careers/:id          → supprime une carrière (admin)
 * GET    /api/careers/schools/:domain → écoles pour un domaine
 */
const router   = require('express').Router();
const supabase = require('../config/supabase');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// ── Données statiques par défaut (utilisées si la table est vide) ──────────
const DEFAULT_CAREERS = [
  // ── SANTÉ ──
  {
    id: 'medecin-generaliste', title: 'Médecin généraliste', sector: 'Santé',
    school_domain: 'Médecine', icon: 'medical_services',
    description: 'Diagnostiquer, traiter et prévenir les maladies. Premier contact entre le patient et le système de santé.',
    salary_min: 15000, salary_max: 40000, duration_studies: '7 ans',
    employability: 'très élevée', difficulty: 'très élevée',
    required_bac: ['Sciences'],
    ideal_profile: 'Empathique, rigoureux, résistant au stress, sens des responsabilités.',
    evolution: 'Spécialisation possible (cardiologue, dermatologue...), exercice en libéral.',
    advantages: 'Salaire élevé, impact social fort, respect de la profession.',
    disadvantages: 'Longues études, gardes de nuit, pression constante.',
  },
  {
    id: 'pharmacien', title: 'Pharmacien', sector: 'Santé',
    school_domain: 'Médecine', icon: 'local_pharmacy',
    description: 'Préparer et délivrer les médicaments, conseiller les patients sur leur traitement.',
    salary_min: 8000, salary_max: 25000, duration_studies: '6 ans',
    employability: 'élevée', difficulty: 'élevée',
    required_bac: ['Sciences'],
    ideal_profile: 'Précis, à l\'écoute, sens du commerce et de la chimie.',
    evolution: 'Pharmacie hospitalière, industrie pharmaceutique, recherche.',
    advantages: 'Exercice libéral possible, horaires réguliers.',
    disadvantages: 'Études longues et sélectives, marges commerciales faibles.',
  },
  // ── INGÉNIERIE ──
  {
    id: 'ingenieur-genie-civil', title: 'Ingénieur génie civil', sector: 'Ingénierie',
    school_domain: 'Ingénierie', icon: 'engineering',
    description: 'Concevoir et superviser la construction d\'infrastructures : bâtiments, ponts, routes, barrages.',
    salary_min: 8000, salary_max: 25000, duration_studies: '5 ans',
    employability: 'élevée', difficulty: 'élevée',
    required_bac: ['Sciences', 'Sciences Math', 'Technique'],
    ideal_profile: 'Analytique, rigoureux, bon en maths et physique, esprit terrain.',
    evolution: 'Chef de projet, directeur technique, consultant international.',
    advantages: 'Secteur en croissance au Maroc, projets variés.',
    disadvantages: 'Travail sur chantier difficile, pression des délais.',
  },
  {
    id: 'ingenieur-informatique', title: 'Ingénieur informatique', sector: 'Ingénierie',
    school_domain: 'Informatique', icon: 'computer',
    description: 'Concevoir des systèmes informatiques complexes, développer des logiciels et architecturer des solutions.',
    salary_min: 8000, salary_max: 30000, duration_studies: '5 ans',
    employability: 'très élevée', difficulty: 'élevée',
    required_bac: ['Sciences', 'Sciences Math'],
    ideal_profile: 'Logique, passionné de technologie, capacité d\'abstraction.',
    evolution: 'Architecte logiciel, CTO startup, consultant international.',
    advantages: 'Secteur en forte demande, télétravail possible, salaires compétitifs.',
    disadvantages: 'Veille technologique permanente, compétition internationale.',
  },
  // ── DIGITAL ──
  {
    id: 'developpeur-web', title: 'Développeur web', sector: 'Digital',
    school_domain: 'Informatique', icon: 'code',
    description: 'Créer des sites web et applications : interfaces utilisateur, APIs, bases de données.',
    salary_min: 5000, salary_max: 20000, duration_studies: '2 à 5 ans',
    employability: 'très élevée', difficulty: 'moyenne',
    required_bac: ['Sciences', 'Sciences Math', 'Technique'],
    ideal_profile: 'Créatif, logique, autonome, curieux des nouvelles technologies.',
    evolution: 'Lead dev, architecte, CTO, freelance international.',
    advantages: 'Forte demande, télétravail, freelance possible.',
    disadvantages: 'Évolution rapide des technologies, sédentarité.',
  },
  {
    id: 'data-scientist', title: 'Data Scientist', sector: 'Digital',
    school_domain: 'Informatique', icon: 'analytics',
    description: 'Analyser de grandes quantités de données pour extraire des insights et construire des modèles prédictifs.',
    salary_min: 10000, salary_max: 35000, duration_studies: '5 ans',
    employability: 'très élevée', difficulty: 'élevée',
    required_bac: ['Sciences', 'Sciences Math'],
    ideal_profile: 'Mathématicien, curieux, maîtrise Python/R, esprit analytique.',
    evolution: 'Lead Data, Chief Data Officer, consultant IA.',
    advantages: 'L\'un des métiers les mieux payés, très demandé.',
    disadvantages: 'Formation longue, compétences pointues requises.',
  },
  // ── COMMERCE ──
  {
    id: 'manager-commercial', title: 'Manager commercial', sector: 'Commerce',
    school_domain: 'Commerce', icon: 'storefront',
    description: 'Diriger une équipe de vente, définir la stratégie commerciale et développer le portefeuille clients.',
    salary_min: 8000, salary_max: 30000, duration_studies: '3 à 5 ans',
    employability: 'élevée', difficulty: 'moyenne',
    required_bac: ['Economie', 'Lettres', 'Sciences'],
    ideal_profile: 'Communicant, leadership, orienté résultats, négociateur.',
    evolution: 'Directeur commercial, DG, entrepreneur.',
    advantages: 'Primes variables importantes, évolution rapide.',
    disadvantages: 'Pression des objectifs, déplacements fréquents.',
  },
  {
    id: 'comptable', title: 'Comptable / Expert-comptable', sector: 'Commerce',
    school_domain: 'Commerce', icon: 'calculate',
    description: 'Gérer la comptabilité d\'une entreprise, préparer les bilans et conseiller sur la fiscalité.',
    salary_min: 5000, salary_max: 20000, duration_studies: '3 à 5 ans',
    employability: 'élevée', difficulty: 'moyenne',
    required_bac: ['Economie', 'Sciences'],
    ideal_profile: 'Rigoureux, précis, sens de l\'organisation, discrétion.',
    evolution: 'Expert-comptable indépendant, DAF, commissaire aux comptes.',
    advantages: 'Stabilité, exercice libéral possible.',
    disadvantages: 'Période fiscale stressante, travail répétitif.',
  },
  // ── DROIT ──
  {
    id: 'avocat', title: 'Avocat', sector: 'Droit',
    school_domain: 'Droit', icon: 'gavel',
    description: 'Défendre et conseiller les clients en matière juridique, représenter devant les tribunaux.',
    salary_min: 6000, salary_max: 30000, duration_studies: '6 à 8 ans',
    employability: 'moyenne', difficulty: 'élevée',
    required_bac: ['Lettres', 'Economie'],
    ideal_profile: 'Éloquent, persuasif, rigoureux, esprit de synthèse.',
    evolution: 'Associé cabinet, juge, conseiller juridique d\'entreprise.',
    advantages: 'Indépendance, diversité des dossiers, prestige.',
    disadvantages: 'Installation difficile, concurrence forte, revenus variables.',
  },
  // ── ARCHITECTURE ──
  {
    id: 'architecte', title: 'Architecte', sector: 'Architecture',
    school_domain: 'Ingénierie', icon: 'architecture',
    description: 'Concevoir des bâtiments et espaces, superviser les travaux de construction.',
    salary_min: 6000, salary_max: 20000, duration_studies: '6 ans',
    employability: 'moyenne', difficulty: 'élevée',
    required_bac: ['Sciences', 'Arts Appliques'],
    ideal_profile: 'Créatif, sens de l\'esthétique, rigueur technique.',
    evolution: 'Architecte associé, agence propre, urbanisme.',
    advantages: 'Créativité, voir ses projets se concrétiser.',
    disadvantages: 'Insertion difficile, revenus modestes au début.',
  },
  // ── ÉDUCATION ──
  {
    id: 'enseignant', title: 'Enseignant / Formateur', sector: 'Éducation',
    school_domain: 'Sciences', icon: 'school',
    description: 'Transmettre des connaissances aux élèves ou étudiants, préparer les cours et évaluer.',
    salary_min: 5000, salary_max: 15000, duration_studies: '4 à 6 ans',
    employability: 'élevée', difficulty: 'moyenne',
    required_bac: ['Lettres', 'Sciences', 'Economie'],
    ideal_profile: 'Pédagogue, patient, communicant, passion pour le savoir.',
    evolution: 'Directeur pédagogique, formateur entreprise, consultant.',
    advantages: 'Vacances scolaires, impact social, stabilité.',
    disadvantages: 'Salaires modestes, classes chargées.',
  },
  // ── MILITAIRE ──
  {
    id: 'officier-militaire', title: 'Officier des Forces Armées Royales', sector: 'Militaire',
    school_domain: 'Ingénierie', icon: 'military_tech',
    description: 'Commander des unités militaires, assurer la défense nationale, gérer des missions stratégiques.',
    salary_min: 8000, salary_max: 25000, duration_studies: '4 à 5 ans',
    employability: 'élevée', difficulty: 'très élevée',
    required_bac: ['Sciences', 'Sciences Math'],
    ideal_profile: 'Discipliné, leader, esprit d\'équipe, patriote.',
    evolution: 'Général, attaché militaire, reconversion civile.',
    advantages: 'Logement, primes, prestige, sécurité.',
    disadvantages: 'Contraintes de liberté, risques opérationnels.',
  },
  // ── ENTREPRENEURIAT ──
  {
    id: 'entrepreneur', title: 'Entrepreneur / Startuper', sector: 'Entrepreneuriat',
    school_domain: 'Commerce', icon: 'rocket_launch',
    description: 'Créer et développer sa propre entreprise ou startup, innover et prendre des risques calculés.',
    salary_min: 0, salary_max: 100000, duration_studies: '3 à 5 ans',
    employability: 'moyenne', difficulty: 'élevée',
    required_bac: ['Economie', 'Sciences', 'Lettres'],
    ideal_profile: 'Visionnaire, résilient, preneur de risques, leadership.',
    evolution: 'Scale-up, levée de fonds, expansion internationale.',
    advantages: 'Liberté totale, revenus illimités, impact direct.',
    disadvantages: 'Risque financier élevé, instabilité, stress.',
  },
  // ── INTERNATIONAL ──
  {
    id: 'diplomate', title: 'Diplomate / Relations internationales', sector: 'International',
    school_domain: 'Droit', icon: 'flight',
    description: 'Représenter le Maroc à l\'étranger, négocier des accords, gérer les relations entre pays.',
    salary_min: 10000, salary_max: 35000, duration_studies: '5 à 7 ans',
    employability: 'faible', difficulty: 'très élevée',
    required_bac: ['Lettres', 'Economie'],
    ideal_profile: 'Polyglotte, diplomate, culture générale exceptionnelle.',
    evolution: 'Ambassadeur, ONU, organisations internationales.',
    advantages: 'Voyages, salaire élevé, prestige.',
    disadvantages: 'Concours très sélectif, vie nomade, loin de la famille.',
  },
];

// Cache en mémoire (remplacé par Supabase si table disponible)
let careersStore = null;

async function getStore() {
  if (careersStore !== null) return careersStore;
  // Tenter de lire depuis Supabase (table careers optionnelle)
  try {
    const { data, error } = await supabase.from('careers').select('*');
    if (!error && data && data.length > 0) {
      careersStore = data;
      return careersStore;
    }
  } catch (_) {}
  // Fallback : données statiques
  careersStore = JSON.parse(JSON.stringify(DEFAULT_CAREERS));
  return careersStore;
}

function invalidateStore() { careersStore = null; }

// ── GET /api/careers ─────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const careers = await getStore();

    // Compter les écoles par domaine depuis Supabase
    const { data: schools } = await supabase.from('schools').select('domain').eq('is_active', true);
    if (schools) {
      for (const career of careers) {
        career.schools_count = schools.filter(s => s.domain === career.school_domain).length;
      }
    }

    res.json({ careers, total: careers.length });
  } catch (err) {
    console.error('Careers GET error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── POST /api/careers ─────────────────────────────────────── (admin)
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id, title, sector, school_domain, icon, description,
            salary_min, salary_max, duration_studies, employability,
            difficulty, required_bac, ideal_profile, evolution,
            advantages, disadvantages } = req.body;

    if (!id || !title || !sector || !school_domain) {
      return res.status(400).json({ error: 'id, title, sector et school_domain sont requis.' });
    }

    const store = await getStore();
    if (store.find(c => c.id === id)) {
      return res.status(409).json({ error: `L'identifiant "${id}" existe déjà.` });
    }

    const newCareer = {
      id, title, sector, school_domain, icon: icon || 'work',
      description: description || '',
      salary_min: salary_min ?? null, salary_max: salary_max ?? null,
      duration_studies: duration_studies || '',
      employability: employability || 'élevée',
      difficulty: difficulty || 'élevée',
      required_bac: Array.isArray(required_bac) ? required_bac : [],
      ideal_profile: ideal_profile || '',
      evolution: evolution || '',
      advantages: advantages || '',
      disadvantages: disadvantages || '',
      created_at: new Date().toISOString(),
    };

    // Essayer d'insérer dans Supabase
    try {
      await supabase.from('careers').insert(newCareer);
    } catch (_) {}

    store.push(newCareer);
    res.status(201).json({ career: newCareer });
  } catch (err) {
    console.error('Careers POST error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── PUT /api/careers/:id ──────────────────────────────────── (admin)
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const store = await getStore();
    const idx = store.findIndex(c => c.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Carrière introuvable.' });

    const updates = req.body;
    delete updates.id; // l'id ne change pas

    store[idx] = { ...store[idx], ...updates, updated_at: new Date().toISOString() };

    // Essayer de mettre à jour dans Supabase
    try {
      await supabase.from('careers').update(updates).eq('id', id);
    } catch (_) {}

    res.json({ career: store[idx] });
  } catch (err) {
    console.error('Careers PUT error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── DELETE /api/careers/:id ───────────────────────────────── (admin)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const store = await getStore();
    const idx = store.findIndex(c => c.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Carrière introuvable.' });

    store.splice(idx, 1);

    // Essayer de supprimer dans Supabase
    try {
      await supabase.from('careers').delete().eq('id', id);
    } catch (_) {}

    res.json({ message: 'Carrière supprimée.' });
  } catch (err) {
    console.error('Careers DELETE error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── GET /api/careers/schools/:domain ─────────────────────────
router.get('/schools/:domain', async (req, res) => {
  try {
    const domain = decodeURIComponent(req.params.domain);
    const { data: schools, error } = await supabase
      .from('schools')
      .select('*')
      .eq('domain', domain)
      .eq('is_active', true)
      .order('name');

    if (error) return res.status(500).json({ error: error.message });
    res.json({ schools: schools || [], total: schools?.length || 0 });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;