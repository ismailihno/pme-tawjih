-- =============================================================
-- Tawjih Platform — Supabase Database Schema
-- Run this in Supabase SQL Editor before starting the app
-- =============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================
-- USERS TABLE
-- =====================
-- Extends Supabase Auth users with role and profile info
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL UNIQUE,
  full_name   TEXT,
  role        TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- STUDENTS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.students (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bac_type        TEXT CHECK (bac_type IN ('Sciences', 'Sciences Math', 'Economie', 'Lettres', 'Technique', 'Arts Appliques')),
  bac_year        INTEGER,
  city            TEXT,
  profile_data    JSONB DEFAULT '{}',  -- interests, skills, hobbies
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- =====================
-- ADMINS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.admins (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  permissions  JSONB DEFAULT '{"manage_schools": true, "manage_users": true, "manage_admins": false}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- =====================
-- SCHOOLS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.schools (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  city            TEXT NOT NULL,
  domain          TEXT NOT NULL,  -- e.g. Informatique, Médecine, Commerce
  type            TEXT NOT NULL CHECK (type IN ('public', 'private', 'semipublic')),
  description     TEXT,
  admission_info  TEXT,           -- admission requirements
  duration        TEXT,           -- e.g. "3 ans", "5 ans"
  website         TEXT,
  logo_url        TEXT,
  tags            TEXT[] DEFAULT '{}',
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- ORIENTATIONS TABLE
-- =====================
-- Stores questionnaire results and suggested paths per student
CREATE TABLE IF NOT EXISTS public.orientations (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id        UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  answers           JSONB NOT NULL DEFAULT '{}',  -- questionnaire answers
  suggested_field   TEXT NOT NULL,
  score             NUMERIC(5,2),
  explanation       TEXT,
  is_saved          BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- RECOMMENDATIONS CONFIG TABLE
-- =====================
-- Admin-configurable algorithm parameters per field
CREATE TABLE IF NOT EXISTS public.recommendations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  field       TEXT NOT NULL UNIQUE,  -- Informatique, Médecine, etc.
  parameters  JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  icon        TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- SEED: DEFAULT RECOMMENDATION PARAMETERS
-- =====================
INSERT INTO public.recommendations (field, parameters, description, icon) VALUES
('Informatique', '{"keywords": ["tech","code","math","logique","algorithme"], "bac_types": ["Sciences", "Sciences Math"], "weight": 1.0}', 'Génie logiciel, intelligence artificielle, réseaux et systèmes.', 'computer'),
('Médecine', '{"keywords": ["biologie","chimie","sante","sciences","corps"], "bac_types": ["Sciences"], "weight": 1.2}', 'Médecine générale, pharmacie, dentisterie, infirmerie.', 'medical_services'),
('Commerce', '{"keywords": ["gestion","business","economie","marketing","finance"], "bac_types": ["Economie", "Lettres"], "weight": 1.0}', 'Business, finance, marketing, logistique.', 'storefront'),
('Droit', '{"keywords": ["justice","loi","societe","politique","debat"], "bac_types": ["Lettres", "Economie"], "weight": 1.0}', 'Droit privé, droit public, relations internationales.', 'gavel'),
('Ingénierie', '{"keywords": ["physique","math","construction","mécanique","energie"], "bac_types": ["Sciences", "Sciences Math", "Technique"], "weight": 1.1}', 'Génie civil, mécanique, électrique, industriel.', 'engineering')
ON CONFLICT (field) DO NOTHING;

-- =====================
-- SEED: SAMPLE MOROCCAN SCHOOLS
-- =====================
INSERT INTO public.schools (name, city, domain, type, description, admission_info, duration) VALUES
('École Nationale des Sciences Appliquées (ENSA)', 'Agadir', 'Ingénierie', 'public', 'Formation d''ingénieurs d''état dans les domaines des sciences et technologies.', 'Concours national après bac Sciences Math ou Sciences.', '5 ans'),
('ENCG Casablanca', 'Casablanca', 'Commerce', 'public', 'Grande école de commerce et de gestion, formation de cadres dirigeants.', 'Concours national ENCG après bac.', '5 ans'),
('Faculté de Médecine et de Pharmacie', 'Rabat', 'Médecine', 'public', 'Formation médicale complète — médecine, pharmacie, chirurgie dentaire.', 'Concours d''accès en 1ère année après bac Sciences.', '7 ans'),
('ENSIAS', 'Rabat', 'Informatique', 'public', 'École nationale supérieure d''informatique et d''analyse des systèmes.', 'Classes préparatoires + concours national.', '5 ans'),
('Faculté de Droit Souissi', 'Rabat', 'Droit', 'public', 'Formation en sciences juridiques, économiques et sociales.', 'Bac toutes filières. Inscription directe.', '4 ans'),
('EMSI', 'Casablanca', 'Informatique', 'private', 'École marocaine des sciences de l''ingénieur, filière informatique et réseaux.', 'Entretien et test de niveau.', '5 ans'),
('ISCAE', 'Casablanca', 'Commerce', 'semipublic', 'Institut supérieur de commerce et d''administration des entreprises.', 'Concours sur dossier et entretien.', '5 ans'),
('Université Cadi Ayyad — FST', 'Marrakech', 'Sciences', 'public', 'Faculté des sciences et techniques, licence et master en sciences.', 'Bac Sciences, inscription directe.', '3 ans'),
('INPT', 'Rabat', 'Informatique', 'semipublic', 'Institut national des postes et télécommunications.', 'Classes préparatoires + concours.', '5 ans'),
('UIR', 'Rabat', 'Ingénierie', 'private', 'Université internationale de Rabat, campus moderne et formations bilingues.', 'Dossier scolaire + entretien.', '5 ans')
ON CONFLICT DO NOTHING;

-- =====================
-- ROW-LEVEL SECURITY (RLS)
-- =====================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orientations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Users: can read own record, admins read all
CREATE POLICY "users_self_read" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_self_update" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Students: can read/write own record
CREATE POLICY "students_self" ON public.students FOR ALL USING (auth.uid() = user_id);

-- Orientations: can read/write own record
CREATE POLICY "orientations_self" ON public.orientations FOR ALL USING (
  student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
);

-- Schools: anyone can read, only service role can write (handled via backend)
CREATE POLICY "schools_public_read" ON public.schools FOR SELECT USING (TRUE);

-- Recommendations: anyone can read
CREATE POLICY "recommendations_public_read" ON public.recommendations FOR SELECT USING (TRUE);

-- =====================
-- AUTO-UPDATE updated_at TRIGGER
-- =====================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER schools_updated_at BEFORE UPDATE ON public.schools FOR EACH ROW EXECUTE FUNCTION update_updated_at();
