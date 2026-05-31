-- =============================================================================
-- Mora: google_ads_tokens — customer IDs + RLS (lectura usuario, escritura API)
-- Ejecutá en Supabase → SQL Editor → Run
-- =============================================================================

ALTER TABLE public.google_ads_tokens
  ADD COLUMN IF NOT EXISTS customer_id text,
  ADD COLUMN IF NOT EXISTS login_customer_id text;

ALTER TABLE public.google_ads_tokens ENABLE ROW LEVEL SECURITY;

-- Si existían políticas permisivas, eliminarlas (revisá nombres en Table Editor → Policies)
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON public.google_ads_tokens;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.google_ads_tokens;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.google_ads_tokens;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.google_ads_tokens;

DROP POLICY IF EXISTS "google_ads_tokens_select_own" ON public.google_ads_tokens;
CREATE POLICY "google_ads_tokens_select_own"
  ON public.google_ads_tokens
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Sin políticas INSERT/UPDATE/DELETE para authenticated/anon → solo service_role (API admin)
REVOKE INSERT, UPDATE, DELETE ON public.google_ads_tokens FROM authenticated, anon;
GRANT SELECT ON public.google_ads_tokens TO authenticated;
