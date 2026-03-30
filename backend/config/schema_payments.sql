-- =============================================================
-- Tawjih — Schema Paiements & Annonces
-- Coller dans Supabase SQL Editor et cliquer Run
-- =============================================================

-- 1. Ajouter le rôle "counselor"
ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('student', 'admin', 'counselor'));

-- 2. Profils conseillers
CREATE TABLE IF NOT EXISTS public.counselors (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bio          TEXT,
  specialties  TEXT[] DEFAULT '{}',
  phone        TEXT,
  is_verified  BOOLEAN DEFAULT FALSE,
  rating       NUMERIC(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 3. Annonces d'inscription
CREATE TABLE IF NOT EXISTS public.announcements (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  counselor_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  school_id       UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  price           NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  max_students    INTEGER DEFAULT 10,
  enrolled_count  INTEGER DEFAULT 0,
  deadline        TIMESTAMPTZ,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Paiements
CREATE TABLE IF NOT EXISTS public.payments (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  announcement_id   UUID NOT NULL REFERENCES public.announcements(id) ON DELETE RESTRICT,
  counselor_id      UUID NOT NULL REFERENCES public.users(id),
  amount            NUMERIC(10,2) NOT NULL,
  commission_rate   NUMERIC(5,2) DEFAULT 20.00,
  commission_amount NUMERIC(10,2) NOT NULL,
  counselor_payout  NUMERIC(10,2) NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'refunded', 'failed')),
  payment_method    TEXT DEFAULT 'manual',
  transaction_ref   TEXT,
  notes             TEXT,
  paid_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Avis
CREATE TABLE IF NOT EXISTS public.reviews (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  counselor_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  payment_id    UUID REFERENCES public.payments(id),
  rating        INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, counselor_id)
);

-- 6. Trigger updated_at sur announcements
CREATE TRIGGER announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 7. Trigger enrolled_count
CREATE OR REPLACE FUNCTION increment_enrolled()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
    UPDATE public.announcements
    SET enrolled_count = enrolled_count + 1
    WHERE id = NEW.announcement_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_enrolled_trigger
  AFTER UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION increment_enrolled();

-- 8. RLS
ALTER TABLE public.counselors    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews       ENABLE ROW LEVEL SECURITY;

CREATE POLICY "announcements_public_read"
  ON public.announcements FOR SELECT USING (is_active = TRUE);
CREATE POLICY "counselors_public_read"
  ON public.counselors FOR SELECT USING (TRUE);
CREATE POLICY "payments_own"
  ON public.payments FOR SELECT
  USING (auth.uid() = student_id OR auth.uid() = counselor_id);
CREATE POLICY "reviews_public_read"
  ON public.reviews FOR SELECT USING (TRUE);
