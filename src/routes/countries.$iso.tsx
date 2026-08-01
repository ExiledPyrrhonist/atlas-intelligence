import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  countryQuery,
  countryDossierQuery,
  formatDate,
} from "@/lib/atlas";
import {
  SectionTitle,
  WhyThisMatters,
  ImportanceBadge,
  ConfidenceBadge,
  RatingBar,
  TagList,
} from "@/components/atlas/primitives";
import { RecordEditor, type FieldSpec } from "@/components/atlas/record-editor";
import { CollectionPanel } from "@/components/atlas/collection-panel";
import { NotesPanel } from "@/components/atlas/notes-panel";
import { SourcesPanel } from "@/components/atlas/sources-panel";
import { StatisticsPanel } from "@/components/atlas/statistics-panel";
import { FactsPanel } from "@/components/atlas/facts-panel";

import { riskFill } from "@/components/atlas/world-map";

export const Route = createFileRoute("/countries/$iso")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.iso} Dossier — Political Intelligence Atlas` },
      {
        name: "description",
        content: `Editable political dossier: government, leadership, economy, conflicts, alliances, statistics and analyst notes for ${params.iso}.`,
      },
      { property: "og:title", content: `${params.iso} Dossier — Political Intelligence Atlas` },
      {
        property: "og:description",
        content: "Country intelligence dossier with linked figures, events and sources.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CountryDossier,
});

const OVERVIEW: FieldSpec[] = [
  { key: "name", label: "Country name" },
  { key: "flag_emoji", label: "Flag" },
  { key: "region", label: "Region" },
  { key: "subregion", label: "Subregion" },
  { key: "capital", label: "Capital" },
  { key: "population", label: "Population", type: "number" },
  {
    key: "importance",
    label: "Importance",
    type: "select",
    options: ["critical", "high", "medium", "low"],
  },
  {
    key: "confidence",
    label: "Confidence",
    type: "select",
    options: ["confirmed", "likely", "disputed", "unknown"],
  },
  { key: "why_this_matters", label: "Why this matters", type: "textarea" },
  { key: "tags", label: "Tags (comma separated)", type: "tags" },
];

const GOVERNMENT: FieldSpec[] = [
  { key: "political_system", label: "Political system" },
  { key: "government_type", label: "Government type" },
  { key: "head_of_state", label: "Head of state" },
  { key: "head_of_government", label: "Head of government" },
  { key: "major_parties", label: "Major parties", type: "parties" },
  { key: "ideologies", label: "Dominant ideologies", type: "list" },
  { key: "political_issues", label: "Key political issues", type: "list" },
  { key: "democracy_rating", label: "Democracy index (0-10)", type: "number" },
  { key: "corruption_rating", label: "Corruption perception (0-100)", type: "number" },
];

const SECURITY: FieldSpec[] = [
  {
    key: "political_violence_risk",
    label: "Political violence risk",
    type: "select",
    options: ["low", "moderate", "high", "severe"],
  },
  { key: "stability_rating", label: "Stability (0-10)", type: "number" },
  {
    key: "terrorism_risk",
    label: "Terrorism risk",
    type: "select",
    options: ["low", "moderate", "high", "severe"],
  },
  { key: "military_info", label: "Military posture", type: "textarea" },
  { key: "current_conflicts", label: "Active conflicts", type: "list" },
  { key: "historical_conflicts", label: "Historical conflicts", type: "list" },
  { key: "insurgencies", label: "Insurgencies", type: "list" },
  { key: "border_disputes", label: "Border disputes", type: "list" },
];

const RELATIONS: FieldSpec[] = [
  { key: "key_allies", label: "Key allies", type: "list" },
  { key: "key_rivals", label: "Key rivals", type: "list" },
  { key: "intl_organizations", label: "International organizations", type: "list" },
];

const ECONOMY: FieldSpec[] = [
  { key: "gdp_usd", label: "GDP (USD)", type: "number" },
  { key: "population", label: "Population", type: "number" },
  { key: "research_notes", label: "Economic research notes", type: "textarea" },
];

const FIGURE_FIELDS: FieldSpec[] = [
  { key: "name", label: "Name" },
  { key: "position", label: "Position" },
  { key: "party", label: "Party" },
  { key: "ideology", label: "Ideology" },
  { key: "in_office_since", label: "In office since" },
  {
    key: "importance",
    label: "Importance",
    type: "select",
    options: ["critical", "high", "medium", "low"],
  },
  { key: "biography", label: "Biography", type: "textarea" },
  { key: "important_actions", label: "Important actions", type: "list" },
  { key: "tags", label: "Tags", type: "tags" },
];

function CountryDossier() {
  const { iso } = Route.useParams();
  const { data: country, isLoading } = useQuery(countryQuery(iso));
  const { data: dossier } = useQuery({
    ...countryDossierQuery(country?.id ?? ""),
    enabled: !!country?.id,
  });

  if (isLoading) return <p className="p-6 text-sm text-muted-foreground">Loading dossier…</p>;
  if (!country)
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">No dossier found for “{iso}”.</p>
        <Link to="/countries" className="text-sm text-primary hover:underline">
          Back to country index
        </Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <header className="panel-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="label-hud">
              {country.region} · {country.subregion}
            </div>
            <h1 className="mt-1 text-2xl font-semibold">
              {country.flag_emoji} {country.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {country.political_system || "No political system recorded"} · Capital{" "}
              {country.capital || "—"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <span className="inline-flex items-center gap-1.5 rounded border border-border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em]">
              <span
                className="inline-block h-2 w-2 rounded-sm"
                style={{ background: riskFill(country.political_violence_risk) }}
              />
              {country.political_violence_risk
                ? `violence: ${country.political_violence_risk}`
                : "violence: no data"}
            </span>
            <ImportanceBadge level={country.importance} />
            <ConfidenceBadge level={country.confidence} />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <TagList tags={country.tags} />
          <span className="font-mono text-[10px] text-muted-foreground">
            last updated {formatDate(country.last_updated.slice(0, 10))}
          </span>
        </div>
      </header>

      <WhyThisMatters text={country.why_this_matters} />

      <div className="grid gap-6 lg:grid-cols-2">
        <RecordEditor table="countries" record={country} fields={OVERVIEW} title="Overview" />
        <RecordEditor
          table="countries"
          record={country}
          fields={GOVERNMENT}
          title="Government & politics"
        />
        <RecordEditor
          table="countries"
          record={country}
          fields={SECURITY}
          title="Security & conflict"
        />
        <RecordEditor
          table="countries"
          record={country}
          fields={RELATIONS}
          title="International relations"
        />
        <RecordEditor table="countries" record={country} fields={ECONOMY} title="Economy" />

        <section className="panel-surface space-y-4 p-4">
          <SectionTitle title="Analytical ratings" />
          <RatingBar label="Democracy index" value={Number(country.democracy_rating)} />
          <RatingBar label="Stability" value={country.stability_rating} />
          <RatingBar
            label="Corruption perception"
            value={Number(country.corruption_rating)}
            max={100}
          />
        </section>
      </div>

      <CollectionPanel
        table="political_figures"
        title="Political figures"
        addLabel="Add figure"
        rows={(dossier?.figures ?? []) as never[]}
        fields={FIGURE_FIELDS}
        searchKeys={["name", "position", "party", "ideology"]}
        defaults={{ country_id: country.id }}
        renderRow={(f) => (
          <div>
            <Link
              to="/people/$id"
              params={{ id: String(f["id"]) }}
              className="text-sm font-medium hover:text-primary"
            >
              {String(f["name"] ?? "")}
            </Link>
            <div className="text-xs text-muted-foreground">
              {String(f["position"] ?? "—")}
              {f["party"] ? ` · ${String(f["party"])}` : ""}
            </div>
            <div className="mt-1 font-mono text-[11px] text-muted-foreground">
              {String(f["ideology"] ?? "")}
            </div>
          </div>
        )}
      />

      <section>
        <SectionTitle title="Event timeline" count={dossier?.events.length ?? 0} />
        <div className="space-y-2">
          {(dossier?.events.length ?? 0) === 0 && (
            <p className="text-sm text-muted-foreground">No linked events.</p>
          )}
          {dossier?.events.map(({ role, event }) => (
            <Link
              key={event!.id}
              to="/events/$id"
              params={{ id: event!.id }}
              className="panel-surface flex items-start justify-between gap-3 p-3 hover:border-primary/50"
            >
              <div>
                <div className="text-sm font-medium">{event!.name}</div>
                <div className="font-mono text-[11px] text-muted-foreground">
                  {formatDate(event!.event_date)} · role: {role}
                </div>
              </div>
              <ImportanceBadge level={event!.importance} />
            </Link>
          ))}
        </div>
      </section>

      <StatisticsPanel countryId={country.id} />

      <section>
        <SectionTitle title="Organizations" count={dossier?.organizations.length ?? 0} />
        <div className="flex flex-wrap gap-2">
          {(dossier?.organizations.length ?? 0) === 0 && (
            <p className="text-sm text-muted-foreground">No memberships recorded.</p>
          )}
          {dossier?.organizations.map((o) => (
            <Link
              key={o!.id}
              to="/organizations/$id"
              params={{ id: o!.id }}
              className="rounded border border-border bg-secondary px-2 py-1 text-xs hover:border-primary/50"
            >
              {o!.abbreviation || o!.name}
            </Link>
          ))}
        </div>
      </section>

      <FactsPanel column="country_id" entityId={country.id} />

      <div className="flex justify-end">
        <Link
          to="/study"
          className="rounded border border-border bg-secondary px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] hover:bg-accent"
        >
          Study these facts
        </Link>
      </div>

      <SourcesPanel entityType="country" entityId={country.id} />

      <NotesPanel entityType="country" entityId={country.id} />

    </div>
  );
}
