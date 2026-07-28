
CREATE TYPE public.importance_level AS ENUM ('critical','high','medium','low');
CREATE TYPE public.confidence_level AS ENUM ('confirmed','likely','disputed','unknown');
CREATE TYPE public.event_type AS ENUM ('election','protest','revolution','coup','war','treaty','crisis','sanction','referendum');
CREATE TYPE public.source_type AS ENUM ('government_report','academic_paper','news_article','ngo_report','think_tank','database','book');
CREATE TYPE public.reliability_rating AS ENUM ('high','medium','low');
CREATE TYPE public.difficulty_level AS ENUM ('easy','medium','hard');

CREATE TABLE public.countries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  iso_a3 text NOT NULL UNIQUE,
  iso_numeric text NOT NULL UNIQUE,
  flag_emoji text NOT NULL DEFAULT '',
  region text NOT NULL DEFAULT '',
  subregion text NOT NULL DEFAULT '',
  capital text NOT NULL DEFAULT '',
  latitude double precision NOT NULL DEFAULT 0,
  longitude double precision NOT NULL DEFAULT 0,
  population bigint NOT NULL DEFAULT 0,
  gdp_usd numeric NOT NULL DEFAULT 0,
  government_type text NOT NULL DEFAULT '',
  political_system text NOT NULL DEFAULT '',
  head_of_state text NOT NULL DEFAULT '',
  head_of_government text NOT NULL DEFAULT '',
  major_parties jsonb NOT NULL DEFAULT '[]'::jsonb,
  ideologies text[] NOT NULL DEFAULT '{}',
  stability_rating integer NOT NULL DEFAULT 5,
  democracy_rating numeric NOT NULL DEFAULT 5,
  corruption_rating numeric NOT NULL DEFAULT 50,
  political_issues text[] NOT NULL DEFAULT '{}',
  key_allies text[] NOT NULL DEFAULT '{}',
  key_rivals text[] NOT NULL DEFAULT '{}',
  intl_organizations text[] NOT NULL DEFAULT '{}',
  current_conflicts text[] NOT NULL DEFAULT '{}',
  historical_conflicts text[] NOT NULL DEFAULT '{}',
  military_info text NOT NULL DEFAULT '',
  insurgencies text[] NOT NULL DEFAULT '{}',
  terrorism_risk text NOT NULL DEFAULT 'low',
  border_disputes text[] NOT NULL DEFAULT '{}',
  importance importance_level NOT NULL DEFAULT 'medium',
  confidence confidence_level NOT NULL DEFAULT 'likely',
  why_this_matters text NOT NULL DEFAULT '',
  research_notes text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  last_updated timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.political_figures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  country_id uuid REFERENCES public.countries(id) ON DELETE SET NULL,
  position text NOT NULL DEFAULT '',
  party text NOT NULL DEFAULT '',
  ideology text NOT NULL DEFAULT '',
  biography text NOT NULL DEFAULT '',
  important_actions text[] NOT NULL DEFAULT '{}',
  in_office_since text NOT NULL DEFAULT '',
  importance importance_level NOT NULL DEFAULT 'medium',
  confidence confidence_level NOT NULL DEFAULT 'likely',
  why_this_matters text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  last_updated timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.political_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  event_date date NOT NULL,
  end_date date,
  location text NOT NULL DEFAULT '',
  event_type event_type NOT NULL DEFAULT 'crisis',
  summary text NOT NULL DEFAULT '',
  causes text NOT NULL DEFAULT '',
  consequences text NOT NULL DEFAULT '',
  key_actors text[] NOT NULL DEFAULT '{}',
  is_ongoing boolean NOT NULL DEFAULT false,
  importance importance_level NOT NULL DEFAULT 'medium',
  confidence confidence_level NOT NULL DEFAULT 'likely',
  why_this_matters text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  last_updated timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  abbreviation text NOT NULL DEFAULT '',
  org_type text NOT NULL DEFAULT '',
  founded date,
  headquarters text NOT NULL DEFAULT '',
  purpose text NOT NULL DEFAULT '',
  leaders text[] NOT NULL DEFAULT '{}',
  member_count integer NOT NULL DEFAULT 0,
  website text NOT NULL DEFAULT '',
  importance importance_level NOT NULL DEFAULT 'medium',
  why_this_matters text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  last_updated timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  publisher text NOT NULL DEFAULT '',
  url text NOT NULL DEFAULT '',
  published_date date,
  accessed_date date NOT NULL DEFAULT current_date,
  source_type source_type NOT NULL DEFAULT 'database',
  reliability reliability_rating NOT NULL DEFAULT 'medium',
  summary text NOT NULL DEFAULT '',
  information_used text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.statistics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id uuid REFERENCES public.countries(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT '',
  name text NOT NULL,
  value numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT '',
  year integer NOT NULL,
  methodology text NOT NULL DEFAULT '',
  source_id uuid REFERENCES public.sources(id) ON DELETE SET NULL,
  why_this_matters text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.event_countries (
  event_id uuid NOT NULL REFERENCES public.political_events(id) ON DELETE CASCADE,
  country_id uuid NOT NULL REFERENCES public.countries(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT '',
  PRIMARY KEY (event_id, country_id)
);

CREATE TABLE public.figure_events (
  figure_id uuid NOT NULL REFERENCES public.political_figures(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.political_events(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT '',
  PRIMARY KEY (figure_id, event_id)
);

CREATE TABLE public.organization_members (
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  country_id uuid NOT NULL REFERENCES public.countries(id) ON DELETE CASCADE,
  membership_status text NOT NULL DEFAULT 'member',
  PRIMARY KEY (organization_id, country_id)
);

CREATE TABLE public.figure_organizations (
  figure_id uuid NOT NULL REFERENCES public.political_figures(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT '',
  PRIMARY KEY (figure_id, organization_id)
);

CREATE TABLE public.record_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  source_id uuid NOT NULL REFERENCES public.sources(id) ON DELETE CASCADE,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_type, entity_id, source_id)
);

CREATE TABLE public.research_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  importance importance_level NOT NULL DEFAULT 'medium',
  confidence confidence_level NOT NULL DEFAULT 'likely',
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  difficulty difficulty_level NOT NULL DEFAULT 'medium',
  country_id uuid REFERENCES public.countries(id) ON DELETE CASCADE,
  figure_id uuid REFERENCES public.political_figures(id) ON DELETE CASCADE,
  event_id uuid REFERENCES public.political_events(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.flashcard_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flashcard_id uuid NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
  correct boolean NOT NULL,
  reviewed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_stats_country ON public.statistics(country_id);
CREATE INDEX idx_figures_country ON public.political_figures(country_id);
CREATE INDEX idx_events_date ON public.political_events(event_date);
CREATE INDEX idx_notes_entity ON public.research_notes(entity_type, entity_id);
CREATE INDEX idx_record_sources_entity ON public.record_sources(entity_type, entity_id);
CREATE INDEX idx_reviews_card ON public.flashcard_reviews(flashcard_id);

GRANT SELECT ON public.countries, public.political_figures, public.political_events,
  public.organizations, public.sources, public.statistics, public.event_countries,
  public.figure_events, public.organization_members, public.figure_organizations,
  public.record_sources, public.flashcards TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.research_notes TO anon, authenticated;
GRANT SELECT, INSERT ON public.flashcard_reviews TO anon, authenticated;
GRANT ALL ON public.countries, public.political_figures, public.political_events,
  public.organizations, public.sources, public.statistics, public.event_countries,
  public.figure_events, public.organization_members, public.figure_organizations,
  public.record_sources, public.flashcards, public.research_notes,
  public.flashcard_reviews TO service_role;

ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.political_figures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.political_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.figure_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.figure_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.record_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read countries" ON public.countries FOR SELECT USING (true);
CREATE POLICY "public read figures" ON public.political_figures FOR SELECT USING (true);
CREATE POLICY "public read events" ON public.political_events FOR SELECT USING (true);
CREATE POLICY "public read orgs" ON public.organizations FOR SELECT USING (true);
CREATE POLICY "public read sources" ON public.sources FOR SELECT USING (true);
CREATE POLICY "public read statistics" ON public.statistics FOR SELECT USING (true);
CREATE POLICY "public read event_countries" ON public.event_countries FOR SELECT USING (true);
CREATE POLICY "public read figure_events" ON public.figure_events FOR SELECT USING (true);
CREATE POLICY "public read organization_members" ON public.organization_members FOR SELECT USING (true);
CREATE POLICY "public read figure_organizations" ON public.figure_organizations FOR SELECT USING (true);
CREATE POLICY "public read record_sources" ON public.record_sources FOR SELECT USING (true);
CREATE POLICY "public read flashcards" ON public.flashcards FOR SELECT USING (true);
CREATE POLICY "workspace read notes" ON public.research_notes FOR SELECT USING (true);
CREATE POLICY "workspace write notes" ON public.research_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "workspace update notes" ON public.research_notes FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "workspace delete notes" ON public.research_notes FOR DELETE USING (true);
CREATE POLICY "workspace read reviews" ON public.flashcard_reviews FOR SELECT USING (true);
CREATE POLICY "workspace write reviews" ON public.flashcard_reviews FOR INSERT WITH CHECK (true);
