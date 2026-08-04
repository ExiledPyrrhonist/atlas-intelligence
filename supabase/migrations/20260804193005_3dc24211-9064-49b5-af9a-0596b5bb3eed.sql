ALTER TABLE public.research_notes
  ADD COLUMN IF NOT EXISTS summary text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS region text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS country_id uuid REFERENCES public.countries(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS figure_id uuid REFERENCES public.political_figures(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES public.political_events(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_id uuid REFERENCES public.sources(id) ON DELETE SET NULL;

ALTER TABLE public.statistics
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS touch_statistics ON public.statistics;
CREATE TRIGGER touch_statistics
BEFORE UPDATE ON public.statistics
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX IF NOT EXISTS research_notes_country_id_idx ON public.research_notes(country_id);
CREATE INDEX IF NOT EXISTS statistics_country_id_idx ON public.statistics(country_id);