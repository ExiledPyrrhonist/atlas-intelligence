import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Country = Tables<"countries">;
export type Figure = Tables<"political_figures">;
export type PoliticalEvent = Tables<"political_events">;
export type Organization = Tables<"organizations">;
export type Statistic = Tables<"statistics">;
export type Source = Tables<"sources">;
export type ResearchNote = Tables<"research_notes">;
export type Flashcard = Tables<"flashcards">;

export type Party = { name: string; ideology: string };

export function parseParties(value: unknown): Party[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is Party =>
      typeof item === "object" && item !== null && "name" in (item as Record<string, unknown>),
  );
}

export const IMPORTANCE_ORDER = ["critical", "high", "medium", "low"] as const;

export function importanceClass(level: string): string {
  switch (level) {
    case "critical":
      return "border-critical/50 bg-critical/12 text-critical";
    case "high":
      return "border-high/50 bg-high/12 text-high";
    case "medium":
      return "border-medium/40 bg-medium/12 text-medium";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

export function confidenceClass(level: string): string {
  switch (level) {
    case "confirmed":
      return "border-primary/40 bg-primary/10 text-primary";
    case "likely":
      return "border-medium/40 bg-medium/10 text-medium";
    case "disputed":
      return "border-signal/50 bg-signal/12 text-signal";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatCompact(value: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(
    value,
  );
}

export function formatMoney(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  return `$${formatNumber(value)}`;
}

export function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* ---------------- queries ---------------- */

export const countriesQuery = {
  queryKey: ["countries"],
  queryFn: async (): Promise<Country[]> => {
    const { data, error } = await supabase.from("countries").select("*").order("name");
    if (error) throw error;
    return data ?? [];
  },
};

export const countryQuery = (iso: string) => ({
  queryKey: ["country", iso],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("countries")
      .select("*")
      .eq("iso_a3", iso.toUpperCase())
      .maybeSingle();
    if (error) throw error;
    return data;
  },
});

export const figuresQuery = {
  queryKey: ["figures"],
  queryFn: async (): Promise<Figure[]> => {
    const { data, error } = await supabase.from("political_figures").select("*").order("name");
    if (error) throw error;
    return data ?? [];
  },
};

export const eventsQuery = {
  queryKey: ["events"],
  queryFn: async (): Promise<PoliticalEvent[]> => {
    const { data, error } = await supabase
      .from("political_events")
      .select("*")
      .order("event_date", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
};

export const organizationsQuery = {
  queryKey: ["organizations"],
  queryFn: async (): Promise<Organization[]> => {
    const { data, error } = await supabase.from("organizations").select("*").order("name");
    if (error) throw error;
    return data ?? [];
  },
};

export const sourcesQuery = {
  queryKey: ["sources"],
  queryFn: async (): Promise<Source[]> => {
    const { data, error } = await supabase.from("sources").select("*").order("title");
    if (error) throw error;
    return data ?? [];
  },
};

export const statisticsQuery = {
  queryKey: ["statistics"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("statistics")
      .select("*, countries(name, iso_a3, flag_emoji), sources(title, publisher, reliability)")
      .order("category");
    if (error) throw error;
    return data ?? [];
  },
};

export const flashcardsQuery = {
  queryKey: ["flashcards"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("flashcards")
      .select("*, countries(name, iso_a3, flag_emoji), political_figures(name), political_events(name), organizations(name)");
    if (error) throw error;
    return data ?? [];
  },
};

export const reviewsQuery = {
  queryKey: ["flashcard_reviews"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("flashcard_reviews")
      .select("*")
      .order("reviewed_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    return data ?? [];
  },
};

export const NOTE_CATEGORIES = [
  "Politics",
  "Government",
  "Elections",
  "Political Violence",
  "Conflict",
  "Economy",
  "Military",
  "Human Rights",
  "Foreign Policy",
  "Society",
  "Demographics",
  "Energy",
] as const;

export type NoteRow = ResearchNote & {
  countries?: { name: string; iso_a3: string; flag_emoji: string; region: string } | null;
  political_figures?: { name: string } | null;
  organizations?: { name: string } | null;
  political_events?: { name: string } | null;
  sources?: { title: string } | null;
};

export const notesQuery = (entityType?: string, entityId?: string) => ({
  queryKey: ["research_notes", entityType ?? "all", entityId ?? "all"],
  queryFn: async (): Promise<NoteRow[]> => {
    let q = supabase
      .from("research_notes")
      .select(
        "*, countries(name, iso_a3, flag_emoji, region), political_figures(name), organizations(name), political_events(name), sources(title)",
      )
      .order("updated_at", { ascending: false });
    if (entityType) q = q.eq("entity_type", entityType);
    if (entityId) q = q.eq("entity_id", entityId);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as unknown as NoteRow[];
  },
});


export const countryDossierQuery = (countryId: string) => ({
  queryKey: ["dossier", countryId],
  queryFn: async () => {
    const [figures, links, stats, sources, orgs] = await Promise.all([
      supabase.from("political_figures").select("*").eq("country_id", countryId).order("name"),
      supabase
        .from("event_countries")
        .select("role, political_events(*)")
        .eq("country_id", countryId),
      supabase
        .from("statistics")
        .select("*, sources(title, publisher, reliability, url)")
        .eq("country_id", countryId)
        .order("category"),
      supabase.from("record_sources").select("note, sources(*)").eq("entity_id", countryId),
      supabase
        .from("organization_members")
        .select("membership_status, organizations(*)")
        .eq("country_id", countryId),
    ]);
    return {
      figures: figures.data ?? [],
      events: (links.data ?? [])
        .map((l) => ({ role: l.role, event: l.political_events }))
        .filter((l) => l.event)
        .sort((a, b) => (a.event!.event_date < b.event!.event_date ? 1 : -1)),
      statistics: stats.data ?? [],
      sources: (sources.data ?? []).map((s) => ({ note: s.note, source: s.sources })),
      organizations: (orgs.data ?? []).map((o) => o.organizations).filter(Boolean),
    };
  },
});
