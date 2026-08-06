import { supabase } from "@/integrations/supabase/client";

/**
 * Field level source attribution.
 *
 * Attachments are stored in the existing `record_sources` table: the `note`
 * column holds `field:<column>` so a single row can cite one specific fact of
 * one specific record. No schema change is required.
 *
 * A field without a row is treated as "User Input" — manually entered and not
 * yet linked to a source. Sources are never required to save a value.
 */
export const FIELD_NOTE_PREFIX = "field:";

export type SourceLite = {
  id: string;
  title: string;
  publisher: string | null;
  url: string | null;
  source_type: string | null;
  reliability: string | null;
};

export type FieldSourceMap = Record<string, SourceLite>;

export function fieldSourcesQuery(entityType: string, entityId: string | undefined) {
  return {
    queryKey: ["field_sources", entityType, entityId ?? ""],
    enabled: Boolean(entityId),
    queryFn: async (): Promise<FieldSourceMap> => {
      if (!entityId) return {};
      const { data, error } = await supabase
        .from("record_sources")
        .select("note, sources(id, title, publisher, url, source_type, reliability)")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .like("note", `${FIELD_NOTE_PREFIX}%`);
      if (error) throw error;
      const map: FieldSourceMap = {};
      for (const row of data ?? []) {
        const source = row.sources as unknown as SourceLite | null;
        if (!source) continue;
        map[String(row.note).slice(FIELD_NOTE_PREFIX.length)] = source;
      }
      return map;
    },
  };
}

/** All sources, for the searchable selector. */
export const sourceOptionsQuery = {
  queryKey: ["source_options"],
  queryFn: async (): Promise<SourceLite[]> => {
    const { data, error } = await supabase
      .from("sources")
      .select("id, title, publisher, url, source_type, reliability")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as SourceLite[];
  },
};

/** Attaches a source to one field, or clears it back to "User Input". */
export async function setFieldSource(
  entityType: string,
  entityId: string,
  fieldKey: string,
  sourceId: string | null,
) {
  const note = `${FIELD_NOTE_PREFIX}${fieldKey}`;
  const del = await supabase
    .from("record_sources")
    .delete()
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .eq("note", note);
  if (del.error) throw new Error(del.error.message);
  if (!sourceId) return;
  const ins = await supabase
    .from("record_sources")
    .insert({ entity_type: entityType, entity_id: entityId, source_id: sourceId, note } as never);
  if (ins.error) throw new Error(ins.error.message);
}

/** Creates a source from the compact inline form and returns its id. */
export async function createQuickSource(values: {
  title: string;
  publisher?: string;
  url?: string;
  source_type?: string;
  reliability?: string;
}): Promise<string> {
  const { data, error } = await supabase
    .from("sources")
    .insert({
      title: values.title,
      publisher: values.publisher ?? "",
      url: values.url ?? "",
      source_type: values.source_type ?? "news_article",
      reliability: values.reliability ?? "medium",
      accessed_date: new Date().toISOString().slice(0, 10),
    } as never)
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id as string;
}
