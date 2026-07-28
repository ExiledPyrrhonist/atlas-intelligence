import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  countryQuery,
  countryDossierQuery,
  formatCompact,
  formatMoney,
  formatDate,
  parseParties,
} from "@/lib/atlas";
import {
  Field,
  ListBlock,
  SectionTitle,
  TagList,
  WhyThisMatters,
  ImportanceBadge,
  ConfidenceBadge,
  RatingBar,
} from "@/components/atlas/primitives";
import { NotesPanel } from "@/components/atlas/notes-panel";

export const Route = createFileRoute("/countries/$iso")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.iso} Dossier — Political Intelligence Atlas` },
      {
        name: "description",
        content: `Full political dossier: government, leadership, economy, conflicts, alliances, statistics and analyst notes for ${params.iso}.`,
      },
      { property: "og:title", content: `${params.iso} Dossier — Political Intelligence Atlas` },
      {
        property: "og:description",
        content: "Country intelligence dossier with linked figures, events and sources.",
      },
    ],
  }),
  component: CountryDossier,
});

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

  const parties = parseParties(country.major_parties);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <header className="panel-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="label-hud">{country.region} · {country.subregion}</div>
            <h1 className="mt-1 text-2xl font-semibold">
              {country.flag_emoji} {country.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {country.political_system} · Capital {country.capital}
            </p>
          </div>
          <div className="flex gap-1">
            <ImportanceBadge level={country.importance} />
            <ConfidenceBadge level={country.confidence} />
          </div>
        </div>
        <div className="mt-4">
          <TagList tags={country.tags} />
        </div>
      </header>

      <WhyThisMatters text={country.why_this_matters} />

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="panel-surface p-4">
          <SectionTitle title="Core profile" />
          <Field label="Government type" value={country.government_type} />
          <Field label="Head of state" value={country.head_of_state} />
          <Field label="Head of government" value={country.head_of_government} />
          <Field label="Population" value={formatCompact(country.population)} />
          <Field label="GDP" value={formatMoney(Number(country.gdp_usd))} />
          <Field label="Political system" value={country.political_system} />
          <Field label="Military posture" value={country.military_info} />
        </section>

        <section className="panel-surface space-y-4 p-4">
          <SectionTitle title="Analytical ratings" />
          <RatingBar label="Democracy index" value={Number(country.democracy_rating)} />
          <RatingBar label="Stability" value={country.stability_rating} />
          <RatingBar label="Corruption perception" value={country.corruption_rating} />
          
        </section>

        <section className="panel-surface p-4">
          <SectionTitle title="Major parties" count={parties.length} />
          <ul className="space-y-2">
            {parties.map((p) => (
              <li key={p.name} className="border-b border-border/60 pb-2 text-sm last:border-0">
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.ideology}</div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="panel-surface p-4">
          <SectionTitle title="Key political issues" />
          <ListBlock items={country.political_issues} />
        </section>
        <section className="panel-surface p-4">
          <SectionTitle title="Active conflicts" />
          <ListBlock items={country.current_conflicts} />
        </section>
        <section className="panel-surface p-4">
          <SectionTitle title="Key allies" />
          <ListBlock items={country.key_allies} />
        </section>
        <section className="panel-surface p-4">
          <SectionTitle title="Key rivals" />
          <ListBlock items={country.key_rivals} />
        </section>
      </div>

      <section>
        <SectionTitle title="Linked figures" count={dossier?.figures.length ?? 0} />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {dossier?.figures.map((f) => (
            <Link
              key={f.id}
              to="/people/$id"
              params={{ id: f.id }}
              className="panel-surface p-3 hover:border-primary/50"
            >
              <div className="text-sm font-medium">{f.name}</div>
              <div className="text-xs text-muted-foreground">{f.position}</div>
              <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                {f.ideology}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle title="Event timeline" count={dossier?.events.length ?? 0} />
        <div className="space-y-2">
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

      <section>
        <SectionTitle title="Statistics" count={dossier?.statistics.length ?? 0} />
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="bg-panel">
              <tr className="label-hud">
                <th className="px-3 py-2 text-left">Indicator</th>
                <th className="px-3 py-2 text-left">Category</th>
                <th className="px-3 py-2 text-right">Value</th>
                <th className="px-3 py-2 text-right">Year</th>
                <th className="px-3 py-2 text-left">Source</th>
              </tr>
            </thead>
            <tbody>
              {dossier?.statistics.map((s) => (
                <tr key={s.id} className="border-t border-border/60">
                  <td className="px-3 py-2">{s.name}</td>
                  <td className="px-3 py-2 text-muted-foreground">{s.category}</td>
                  <td className="px-3 py-2 text-right font-mono">
                    {Number(s.value).toLocaleString()} {s.unit}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">{s.year}</td>
                  <td className="px-3 py-2 text-muted-foreground">{s.sources?.title ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <SectionTitle title="Organizations" count={dossier?.organizations.length ?? 0} />
        <div className="flex flex-wrap gap-2">
          {dossier?.organizations.map((o) => (
            <Link
              key={o!.id}
              to="/organizations/$id"
              params={{ id: o!.id }}
              className="rounded border border-border bg-secondary px-2 py-1 text-xs hover:border-primary/50"
            >
              {o!.abbreviation ?? o!.name}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle title="Sources" count={dossier?.sources.length ?? 0} />
        <ul className="space-y-2">
          {dossier?.sources.map(({ source, note }, i) => (
            <li key={i} className="panel-surface p-3 text-sm">
              <div className="font-medium">{source?.title}</div>
              <div className="text-xs text-muted-foreground">
                {source?.publisher} · reliability {source?.reliability}
              </div>
              {note && <div className="mt-1 text-xs text-muted-foreground">{note}</div>}
            </li>
          ))}
        </ul>
      </section>

      <NotesPanel entityType="country" entityId={country.id} />
    </div>
  );
}
