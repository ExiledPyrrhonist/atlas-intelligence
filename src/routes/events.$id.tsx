import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/atlas";
import { RecordEditor } from "@/components/atlas/record-editor";
import { NotesPanel } from "@/components/atlas/notes-panel";
import { SourcesPanel } from "@/components/atlas/sources-panel";
import { FactsPanel } from "@/components/atlas/facts-panel";
import { EVENT_FIELDS } from "@/components/atlas/entity-fields";
import {
  ImportanceBadge,
  ConfidenceBadge,
  SectionTitle,
  WhyThisMatters,
} from "@/components/atlas/primitives";

export const Route = createFileRoute("/events/$id")({
  head: () => ({
    meta: [
      { title: "Event Dossier — Political Intelligence Atlas" },
      {
        name: "description",
        content:
          "Event dossier: causes, consequences, key actors, involved states, notes and sources.",
      },
      { property: "og:title", content: "Event Dossier — Political Intelligence Atlas" },
      { property: "og:description", content: "Editable dossier for a tracked political event." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EventDossier,
  errorComponent: ({ error }) => (
    <p role="alert" className="p-6 text-sm text-destructive">
      {error.message}
    </p>
  ),
  notFoundComponent: () => <p className="p-6 text-sm text-muted-foreground">Event not found.</p>,
});

function EventDossier() {
  const { id } = Route.useParams();

  const { data: event, isLoading } = useQuery({
    queryKey: ["event", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("political_events")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: countries = [] } = useQuery({
    queryKey: ["event_countries", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_countries")
        .select("role, countries(id, name, iso_a3, flag_emoji)")
        .eq("event_id", id);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: figures = [] } = useQuery({
    queryKey: ["event_figures", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("figure_events")
        .select("role, political_figures(id, name, position)")
        .eq("event_id", id);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) return <p className="p-6 text-sm text-muted-foreground">Loading event…</p>;
  if (!event)
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">No event found.</p>
        <Link to="/events" className="text-sm text-primary hover:underline">
          Back to events
        </Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      <header className="panel-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="label-hud">
              {event.event_type} · {formatDate(event.event_date)}
            </div>
            <h1 className="mt-1 text-2xl font-semibold">{event.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{event.location || "—"}</p>
          </div>
          <div className="flex gap-1">
            <ImportanceBadge level={event.importance} />
            <ConfidenceBadge level={event.confidence} />
          </div>
        </div>
      </header>

      <WhyThisMatters text={event.why_this_matters} />

      <RecordEditor
        table="political_events"
        record={event as never}
        fields={EVENT_FIELDS}
        title="Event record"
      />

      <section>
        <SectionTitle title="Involved states" count={countries.length} />
        <div className="flex flex-wrap gap-2">
          {countries.length === 0 && (
            <p className="text-sm text-muted-foreground">No states linked.</p>
          )}
          {countries.map((c) =>
            c.countries ? (
              <Link
                key={c.countries.id}
                to="/countries/$iso"
                params={{ iso: c.countries.iso_a3 }}
                className="rounded border border-border bg-secondary px-2 py-1 text-xs hover:border-primary/50"
              >
                {c.countries.flag_emoji} {c.countries.name} · {c.role}
              </Link>
            ) : null,
          )}
        </div>
      </section>

      <section>
        <SectionTitle title="Key figures" count={figures.length} />
        <div className="flex flex-wrap gap-2">
          {figures.length === 0 && (
            <p className="text-sm text-muted-foreground">No figures linked.</p>
          )}
          {figures.map((f) =>
            f.political_figures ? (
              <Link
                key={f.political_figures.id}
                to="/people/$id"
                params={{ id: f.political_figures.id }}
                className="rounded border border-border bg-secondary px-2 py-1 text-xs hover:border-primary/50"
              >
                {f.political_figures.name} · {f.role}
              </Link>
            ) : null,
          )}
        </div>
      </section>

      <FactsPanel column="event_id" entityId={event.id} />
      <SourcesPanel entityType="event" entityId={event.id} />
      <NotesPanel entityType="event" entityId={event.id} />
    </div>
  );
}
