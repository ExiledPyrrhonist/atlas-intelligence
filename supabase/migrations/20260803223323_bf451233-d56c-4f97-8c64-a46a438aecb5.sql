-- Bidirectional sync between country leadership fields and political_figures

CREATE OR REPLACE FUNCTION public.sync_country_leaders()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  slot text;
  slot_tag text;
  leader_name text;
  default_position text;
  existing_id uuid;
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  FOREACH slot IN ARRAY ARRAY['head_of_state', 'head_of_government'] LOOP
    IF slot = 'head_of_state' THEN
      leader_name := btrim(coalesce(NEW.head_of_state, ''));
      slot_tag := 'head-of-state';
      default_position := 'President';
    ELSE
      leader_name := btrim(coalesce(NEW.head_of_government, ''));
      slot_tag := 'head-of-government';
      default_position := 'Prime Minister';
    END IF;

    SELECT id INTO existing_id
    FROM public.political_figures
    WHERE country_id = NEW.id AND slot_tag = ANY(tags)
    LIMIT 1;

    IF leader_name = '' THEN
      -- unlink, never delete the person's profile
      IF existing_id IS NOT NULL THEN
        UPDATE public.political_figures
        SET tags = array_remove(tags, slot_tag)
        WHERE id = existing_id;
      END IF;
      CONTINUE;
    END IF;

    IF existing_id IS NOT NULL THEN
      UPDATE public.political_figures
      SET name = leader_name
      WHERE id = existing_id AND name IS DISTINCT FROM leader_name;
    ELSE
      -- reuse an existing unlinked person with the same name in this country
      SELECT id INTO existing_id
      FROM public.political_figures
      WHERE country_id = NEW.id AND lower(btrim(name)) = lower(leader_name)
      LIMIT 1;

      IF existing_id IS NOT NULL THEN
        UPDATE public.political_figures
        SET tags = array_append(tags, slot_tag)
        WHERE id = existing_id;
      ELSE
        INSERT INTO public.political_figures
          (name, country_id, position, importance, confidence, tags)
        VALUES
          (leader_name, NEW.id, default_position, 'high', 'likely', ARRAY[slot_tag]);
      END IF;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_country_leaders_trg ON public.countries;
CREATE TRIGGER sync_country_leaders_trg
AFTER INSERT OR UPDATE OF head_of_state, head_of_government ON public.countries
FOR EACH ROW EXECUTE FUNCTION public.sync_country_leaders();

CREATE OR REPLACE FUNCTION public.sync_figure_to_country()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF pg_trigger_depth() > 1 OR NEW.country_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF 'head-of-state' = ANY(NEW.tags) THEN
    UPDATE public.countries
    SET head_of_state = NEW.name
    WHERE id = NEW.country_id AND head_of_state IS DISTINCT FROM NEW.name;
  END IF;

  IF 'head-of-government' = ANY(NEW.tags) THEN
    UPDATE public.countries
    SET head_of_government = NEW.name
    WHERE id = NEW.country_id AND head_of_government IS DISTINCT FROM NEW.name;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_figure_to_country_trg ON public.political_figures;
CREATE TRIGGER sync_figure_to_country_trg
AFTER INSERT OR UPDATE ON public.political_figures
FOR EACH ROW EXECUTE FUNCTION public.sync_figure_to_country();