import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { sourcesQuery, statisticsQuery, formatNumber } from "@/lib/atlas";
import { CollectionPanel } from "@/components/atlas/collection-panel";
import { useCountryField } from "@/components/atlas/entity-fields";
import type { FieldSpec } from "@/components/atlas/record-editor";

export const Route = createFileRoute("/statistics")({
  head: () => ({
    meta: [
      { title: "Statistics — Political Intelligence Atlas" },
      {
        name: "description",
        content:
          "Time-series political and economic statistics for every tracked state, with units, years, methodology and sources.",
      },
      { property: "og:title", content: "Statistics — Political Intelligence Atlas" },
      {
        property: "og:description",
        content: "Editable statistics database across all tracked countries.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StatisticsPage,
});

function StatisticsPage() {
  const { data: stats = [] } = useQuery(statisticsQuery);
  const { data: sources = [] } = useQuery(sourcesQuery);
  const countryField = useCountryField("country_id", "Country");

  const sourceField: FieldSpec = {
    key: "source_id",
    label: "Source",
    type: "select",
    optional: true,
    options: sources.map((s) => s.id),
    optionLabels: Object.fromEntries(sources.map((s) => [s.id, s.title])),
  };

  const fields: FieldSpec[] = [
    { key: "name", label: "Statistic name" },
    { key: "category", label: "Category" },
    { key: "value", label: "Value", type: "number" },
    { key: "unit", label: "Unit" },
    { key: "year", label: "Year", type: "number" },
    countryField,
    sourceField,
    { key: "methodology", label: "Methodology / notes", type: "textarea" },
    { key: "why_this_matters", label: "Why this matters", type: "textarea" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 md:p-6">
      <header>
        <h1 className="text-2xl font-semibold">Statistics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every recorded measurement across the atlas. Add new years instead of overwriting old
          values.
        </p>
      </header>

      <CollectionPanel
        table="statistics"
        title="All statistics"
        addLabel="Add statistic"
        rows={stats as never[]}
        fields={fields}
        searchKeys={["name", "category", "unit"]}
        renderRow={(s) => {
          const country = (s as Record<string, unknown>)["countries"] as
            | { name: string; iso_a3: string; flag_emoji: string }
            | null;
          const source = (s as Record<string, unknown>)["sources"] as { title: string } | null;
          return (
            <div>
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-sm font-medium">{String(s["name"] ?? "")}</span>
                <span className="font-mono text-sm text-primary">
                  {formatNumber(Number(s["value"] ?? 0))} {String(s["unit"] ?? "")}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  {String(s["category"] ?? "")} · {String(s["year"] ?? "")}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                {country ? (
                  <Link
                    to="/countries/$iso"
                    params={{ iso: country.iso_a3 }}
                    className="text-primary hover:underline"
                  >
                    {country.flag_emoji} {country.name}
                  </Link>
                ) : (
                  <span>No country linked</span>
                )}
                <span>· source: {source?.title ?? "—"}</span>
              </div>
            </div>
          );
        }}
      />
    </div>
  );
}
