import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { countriesQuery, formatDate } from "@/lib/atlas";
import { RecordEditor } from "@/components/atlas/record-editor";
import { NotesPanel } from "@/components/atlas/notes-panel";
import { SourcesPanel } from "@/components/atlas/sources-panel";
import { FactsPanel } from "@/components/atlas/facts-panel";
import { FIGURE_FIELDS, useCountryField } from "@/components/atlas/entity-fields";
import { ImportanceBadge, ConfidenceBadge, SectionTitle } from "@/components/atlas/primitives";

export const Route = createFileRoute("/people/$id")({
  head: () => ({
    meta: [
      { title: "Figure Profile — Political Intelligence Atlas" },
      {
        name: "description",
        content:
          "Political figure profile: position, party, ideology, biography, key actions, notes and sources.",
      },
      { property: "og:title", content: "Figure Profile — Political Intelligence Atlas" },
      {
        property: "og:description",
        content: "Editable dossier for a tracked political figure.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FigureProfile,
  errorComponent: ({ error }) => (
    <p role="alert" className="p-6 text-sm text-destructive">
      {error.message}
    </p>
  ),
  notFoundComponent: () => <p className="p-6 text-sm text-muted-foreground">Figure not found.</p>,
});

function FigureProfile() {
  const { id } = Route.useParams();
  const countryField = useCountryField();
  const { data: countries = [] } = useQuery(countriesQuery);

  const { data: figure, isLoading } = useQuery({
    queryKey: ["figure", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("political_figures")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: events = [] } = useQuery({
    queryKey: ["figure_events", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("figure_events")
        .select("role, political_events(*)")
        .eq("figure_id", id);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) return <p className="p-6 text-sm text-muted-foreground">Loading profile…</p>;
  if (!figure)
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">No figure found.</p>
        <Link to="/people" className="text-sm text-primary hover:underline">
          Back to people
        </Link>
      </div>
    );

  const country = countries.find((c) => c.id === figure.country_id);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      <header className="panel-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="label-hud">{figure.position || "Position unrecorded"}</div>
            <h1 className="mt-1 text-2xl font-semibold">{figure.name}</h1>
            {country && (
              <Link
                to="/countries/$iso"
                params={{ iso: country.iso_a3 }}
                className="mt-1 inline-block text-sm text-primary hover:underline"
              >
                {country.flag_emoji} {country.name}
              </Link>
            )}
          </div>
          <div className="flex gap-1">
            <ImportanceBadge level={figure.importance} />
            <ConfidenceBadge level={figure.confidence} />
          </div>
        </div>
      </header>

      <RecordEditor
        table="political_figures"
        record={figure as never}
        fields={[...FIGURE_FIELDS, countryField]}
        title="Profile"
      />

      <section>
        <SectionTitle title="Linked events" count={events.length} />
        <div className="space-y-2">
          {events.length === 0 && (
            <p className="text-sm text-muted-foreground">No linked events.</p>
          )}
          {events.map((e) =>
            e.political_events ? (
              <Link
                key={e.political_events.id}
                to="/events/$id"
                params={{ id: e.political_events.id }}
                className="panel-surface block p-3 hover:border-primary/50"
              >
                <div className="text-sm font-medium">{e.political_events.name}</div>
                <div className="font-mono text-[11px] text-muted-foreground">
                  {formatDate(e.political_events.event_date)} · role: {e.role}
                </div>
              </Link>
            ) : null,
          )}
        </div>
      </section>

      <FactsPanel column="figure_id" entityId={figure.id} />
      <SourcesPanel entityType="figure" entityId={figure.id} />
      <NotesPanel entityType="figure" entityId={figure.id} />
    </div>
  );
}
