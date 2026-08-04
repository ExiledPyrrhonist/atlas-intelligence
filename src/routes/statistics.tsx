import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  sourcesQuery,
  statisticsQuery,
  countriesQuery,
  formatNumber,
  formatDate,
} from "@/lib/atlas";
import { CollectionPanel } from "@/components/atlas/collection-panel";
import { FilterBar, type SelectFilter } from "@/components/atlas/filter-bar";
import type { FieldSpec } from "@/components/atlas/record-editor";

export const STAT_CATEGORIES = [
  "GDP",
  "Population",
  "Inflation",
  "Military Spending",
  "Refugees",
  "Political Violence Index",
  "Democracy Score",
  "Press Freedom Score",
  "Corruption Index",
  "Unemployment",
  "Other",
] as const;

export const Route = createFileRoute("/statistics")({
  head: () => ({
    meta: [
      { title: "Statistics — Political Intelligence Atlas" },
      {
        name: "description",
        content:
          "Structured political and economic statistics for every tracked state, filterable by country, region, category, year and source.",
      },
      { property: "og:title", content: "Statistics — Political Intelligence Atlas" },
      {
        property: "og:description",
        content: "Filterable statistics database across all tracked countries.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StatisticsPage,
});

type StatRow = Record<string, unknown> & {
  id: string;
  countries?: { name: string; iso_a3: string; flag_emoji: string; region: string } | null;
  sources?: { title: string } | null;
};

function StatisticsPage() {
  const { data: stats = [] } = useQuery(statisticsQuery);
  const { data: sources = [] } = useQuery(sourcesQuery);
  const { data: countries = [] } = useQuery(countriesQuery);

  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("all");
  const [region, setRegion] = useState("all");
  const [category, setCategory] = useState("all");
  const [year, setYear] = useState("all");
  const [source, setSource] = useState("all");
  const [sort, setSort] = useState("updated");

  const rows = stats as unknown as StatRow[];

  const regions = useMemo(
    () => [...new Set(countries.map((c) => c.region).filter(Boolean))].sort(),
    [countries],
  );
  const years = useMemo(
    () =>
      [...new Set(rows.map((r) => String(r["year"] ?? "")).filter(Boolean))].sort(
        (a, b) => Number(b) - Number(a),
      ),
    [rows],
  );
  const categories = useMemo(
    () =>
      [
        ...new Set([
          ...STAT_CATEGORIES,
          ...rows.map((r) => String(r["category"] ?? "")).filter(Boolean),
        ]),
      ].sort(),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const out = rows.filter((r) => {
      if (country !== "all" && r["country_id"] !== country) return false;
      if (region !== "all" && (r.countries?.region ?? "") !== region) return false;
      if (category !== "all" && String(r["category"] ?? "") !== category) return false;
      if (year !== "all" && String(r["year"] ?? "") !== year) return false;
      if (source !== "all" && r["source_id"] !== source) return false;
      if (!q) return true;
      return [r["name"], r["category"], r["unit"], r.countries?.name, r.sources?.title]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });

    return [...out].sort((a, b) => {
      switch (sort) {
        case "alpha":
          return String(a["name"]).localeCompare(String(b["name"]));
        case "high":
          return Number(b["value"] ?? 0) - Number(a["value"] ?? 0);
        case "low":
          return Number(a["value"] ?? 0) - Number(b["value"] ?? 0);
        default:
          return String(b["updated_at"] ?? b["created_at"] ?? "").localeCompare(
            String(a["updated_at"] ?? a["created_at"] ?? ""),
          );
      }
    });
  }, [rows, search, country, region, category, year, source, sort]);

  const withAll = (label: string, values: { value: string; label: string }[]) => [
    { value: "all", label },
    ...values,
  ];

  const filters: SelectFilter[] = [
    {
      key: "country",
      label: "Country",
      value: country,
      onChange: setCountry,
      options: withAll(
        "All countries",
        countries.map((c) => ({ value: c.id, label: `${c.flag_emoji} ${c.name}` })),
      ),
    },
    {
      key: "region",
      label: "Region",
      value: region,
      onChange: setRegion,
      options: withAll(
        "All regions",
        regions.map((r) => ({ value: r, label: r })),
      ),
    },
    {
      key: "category",
      label: "Category",
      value: category,
      onChange: setCategory,
      options: withAll(
        "All categories",
        categories.map((c) => ({ value: c, label: c })),
      ),
    },
    {
      key: "year",
      label: "Year",
      value: year,
      onChange: setYear,
      options: withAll(
        "All years",
        years.map((y) => ({ value: y, label: y })),
      ),
    },
    {
      key: "source",
      label: "Source",
      value: source,
      onChange: setSource,
      options: withAll(
        "All sources",
        sources.map((s) => ({ value: s.id, label: s.title })),
      ),
    },
    {
      key: "sort",
      label: "Sort",
      value: sort,
      onChange: setSort,
      options: [
        { value: "updated", label: "Recently updated" },
        { value: "alpha", label: "Alphabetical" },
        { value: "high", label: "Highest value" },
        { value: "low", label: "Lowest value" },
      ],
    },
  ];

  const fields: FieldSpec[] = [
    { key: "name", label: "Statistic name" },
    {
      key: "category",
      label: "Category",
      type: "select",
      options: STAT_CATEGORIES,
      defaultValue: "GDP",
    },
    { key: "value", label: "Value", type: "number" },
    { key: "unit", label: "Unit" },
    { key: "year", label: "Year", type: "number" },
    {
      key: "country_id",
      label: "Country",
      type: "select",
      optional: true,
      options: countries.map((c) => c.id),
      optionLabels: Object.fromEntries(countries.map((c) => [c.id, `${c.flag_emoji} ${c.name}`])),
    },
    {
      key: "source_id",
      label: "Source",
      type: "select",
      optional: true,
      options: sources.map((s) => s.id),
      optionLabels: Object.fromEntries(sources.map((s) => [s.id, s.title])),
    },
    { key: "methodology", label: "Notes / methodology", type: "textarea" },
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

      <FilterBar
        search={search}
        onSearch={setSearch}
        placeholder="Search statistic names, units, countries…"
        filters={filters}
        resultCount={filtered.length}
        onReset={() => {
          setSearch("");
          setCountry("all");
          setRegion("all");
          setCategory("all");
          setYear("all");
          setSource("all");
          setSort("updated");
        }}
      />

      <CollectionPanel
        table="statistics"
        title="All statistics"
        addLabel="Add statistic"
        rows={filtered as never[]}
        fields={fields}
        renderRow={(s) => {
          const row = s as unknown as StatRow;
          return (
            <div>
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-sm font-medium">{String(row["name"] ?? "")}</span>
                <span className="font-mono text-sm text-primary">
                  {formatNumber(Number(row["value"] ?? 0))} {String(row["unit"] ?? "")}
                </span>
                <span className="rounded-full border border-border/60 bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
                  {String(row["category"] ?? "")}
                </span>
                <span className="text-[11px] text-muted-foreground">{String(row["year"] ?? "")}</span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                {row.countries ? (
                  <Link
                    to="/countries/$iso"
                    params={{ iso: row.countries.iso_a3 }}
                    className="text-primary hover:underline"
                  >
                    {row.countries.flag_emoji} {row.countries.name}
                  </Link>
                ) : (
                  <span>No country linked</span>
                )}
                {row.countries?.region ? <span>{row.countries.region}</span> : null}
                <span>source: {row.sources?.title ?? "—"}</span>
                <span>
                  updated {formatDate(String(row["updated_at"] ?? row["created_at"] ?? "").slice(0, 10))}
                </span>
              </div>
              {row["methodology"] ? (
                <p className="mt-1 line-clamp-2 whitespace-pre-line text-xs text-muted-foreground">
                  {String(row["methodology"])}
                </p>
              ) : null}
            </div>
          );
        }}
      />
    </div>
  );
}
