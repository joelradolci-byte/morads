-- =============================================================================
-- Mora: extender tabla feedback para encuestas (NPS + bloques de producto)
-- Ejecutá en Supabase → SQL Editor → Run
-- =============================================================================

-- Revisá en Table Editor qué columnas ya existen antes de correr.
-- Este script es idempotente (IF NOT EXISTS).

ALTER TABLE public.feedback
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tipo text DEFAULT 'mensaje',
  ADD COLUMN IF NOT EXISTS nps smallint,
  ADD COLUMN IF NOT EXISTS feature_ratings jsonb,
  ADD COLUMN IF NOT EXISTS intereses jsonb;

-- created_at por si la tabla legacy no lo tenía
ALTER TABLE public.feedback
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Normalizar filas viejas
UPDATE public.feedback SET tipo = 'mensaje' WHERE tipo IS NULL;

ALTER TABLE public.feedback
  ALTER COLUMN tipo SET DEFAULT 'mensaje';

-- Constraints (ignorá el error si ya existen)
DO $$
BEGIN
  ALTER TABLE public.feedback
    ADD CONSTRAINT feedback_tipo_check
    CHECK (tipo IN ('mensaje', 'encuesta'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.feedback
    ADD CONSTRAINT feedback_nps_check
    CHECK (nps IS NULL OR (nps >= 0 AND nps <= 10));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS feedback_tipo_created_idx
  ON public.feedback (tipo, created_at DESC);

CREATE INDEX IF NOT EXISTS feedback_user_encuesta_idx
  ON public.feedback (user_id, created_at DESC)
  WHERE tipo = 'encuesta';

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Usuario: insertar su propio feedback (mensaje o encuesta)
DROP POLICY IF EXISTS "feedback_insert_own" ON public.feedback;
CREATE POLICY "feedback_insert_own"
  ON public.feedback FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR user_id IS NULL
  );

-- Usuario: leer solo sus filas (opcional, para "ya respondiste")
DROP POLICY IF EXISTS "feedback_select_own" ON public.feedback;
CREATE POLICY "feedback_select_own"
  ON public.feedback FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Sin SELECT global para usuarios → agregados solo vía service role en /api/admin
