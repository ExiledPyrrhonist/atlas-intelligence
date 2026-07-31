-- updated timestamp helpers
CREATE OR REPLACE FUNCTION public.touch_last_updated()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.last_updated = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

ALTER TABLE public.research_notes ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'general';

DROP TRIGGER IF EXISTS touch_countries ON public.countries;
CREATE TRIGGER touch_countries BEFORE UPDATE ON public.countries FOR EACH ROW EXECUTE FUNCTION public.touch_last_updated();
DROP TRIGGER IF EXISTS touch_figures ON public.political_figures;
CREATE TRIGGER touch_figures BEFORE UPDATE ON public.political_figures FOR EACH ROW EXECUTE FUNCTION public.touch_last_updated();
DROP TRIGGER IF EXISTS touch_events ON public.political_events;
CREATE TRIGGER touch_events BEFORE UPDATE ON public.political_events FOR EACH ROW EXECUTE FUNCTION public.touch_last_updated();
DROP TRIGGER IF EXISTS touch_orgs ON public.organizations;
CREATE TRIGGER touch_orgs BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.touch_last_updated();
DROP TRIGGER IF EXISTS touch_notes ON public.research_notes;
CREATE TRIGGER touch_notes BEFORE UPDATE ON public.research_notes FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- open workspace write access (single-user personal research database, no auth)
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'countries','political_figures','political_events','organizations',
    'statistics','sources','record_sources','flashcards',
    'event_countries','figure_events','figure_organizations','organization_members'
  ] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO anon, authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('DROP POLICY IF EXISTS "workspace insert %1$s" ON public.%1$I', t);
    EXECUTE format('CREATE POLICY "workspace insert %1$s" ON public.%1$I FOR INSERT WITH CHECK (true)', t);
    EXECUTE format('DROP POLICY IF EXISTS "workspace update %1$s" ON public.%1$I', t);
    EXECUTE format('CREATE POLICY "workspace update %1$s" ON public.%1$I FOR UPDATE USING (true) WITH CHECK (true)', t);
    EXECUTE format('DROP POLICY IF EXISTS "workspace delete %1$s" ON public.%1$I', t);
    EXECUTE format('CREATE POLICY "workspace delete %1$s" ON public.%1$I FOR DELETE USING (true)', t);
  END LOOP;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.research_notes TO anon, authenticated;
GRANT ALL ON public.research_notes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.flashcard_reviews TO anon, authenticated;
GRANT ALL ON public.flashcard_reviews TO service_role;