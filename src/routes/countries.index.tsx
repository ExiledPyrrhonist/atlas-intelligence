import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  countriesQuery,
  formatCompact,
  formatMoney,
  IMPORTANCE_ORDER,
} from "@/lib/atlas";
import { ImportanceBadge, ConfidenceBadge } from "@/components/atlas/primitives";

export const Route = createFileRoute("/countries/")({
  head: () => ({
    meta: [
      { title: "Country Index — Political Intelligence Atlas" },
      {
        name: "description",
        content:
          "Searchable index of tracked states with population, GDP, government type, stability and democracy ratings.",
      },
      { property: "og:title", content: "Country Index — Political Intelligence Atlas" },
      {
        property: "og:description",
        content: "Filter and sort every tracked state in the intelligence database.",
      },
    ],
  }),
  component: CountriesIndex,
});

type SortKey = "name" | "population" | "gdp" | "stability" | "democracy" | "importance";

function CountriesIndex() {
  const { data: countries = [], isLoading } = useQuery(countriesQuery);
  const [term, setTerm] = useState("");
  const [region, setRegion] = useState("all");
  const [sort, setSort] = useState<SortKey>("importance");

  const regions = useMemo(
    () => Array.from(new Set(countries.map((c) => c.region))).sort(),
    [countries],
  );

  const rows = useMemo(() => {
    const q = term.trim().toLowerCase();
    const filtered = countries.filter(
      (c) =>
        (region === "all" || c.region === region) &&
        (!q ||
          c.name.toLowerCase().includes(q) ||
          c.capital.toLowerCase().includes(q) ||
          c.tags.join(" ").toLowerCase().includes(q) ||
          c.political_issues.join(" ").toLowerCase().includes(q)),
    );
    return filtered.sort((a, b) => {
      switch (sort) {
        case "population":
          return b.population - a.population;
        case "gdp":
          return Number(b.gdp_usd) - Number(a.gdp_usd);
        case "stability":
          return a.stability_rating - b.stability_rating;
        case "democracy":
          return Number(b.democracy_rating) - Number(a.democracy_rating);
        case "importance":
          return (
            IMPORTANCE_ORDER.indexOf(a.importance as never) -
              IMPORTANCE_ORDER.indexOf(b.importance as never) || a.name.localeCompare(b.name)
          );
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [countries, term, region, sort]);

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4 md:p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Countries</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {rows.length} of {countries.length} tracked states
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search name, capital, issue, tag…"
            className="h-9 w-64 rounded-xl border border-input bg-panel px-3 text-sm outline-none focus:border-ring"
          />
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="h-9 rounded-xl border border-input bg-panel px-2 text-sm"
          >
            <option value="all">All regions</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="h-9 rounded-xl border border-input bg-panel px-2 text-sm"
          >
            <option value="importance">Sort: priority</option>
            <option value="name">Sort: name</option>
            <option value="population">Sort: population</option>
            <option value="gdp">Sort: GDP</option>
            <option value="stability">Sort: least stable</option>
            <option value="democracy">Sort: democracy score</option>
          </select>
        </div>
      </header>

      {isLoading && <p className="text-sm text-muted-foreground">Loading dossiers…</p>}

      <div className="overflow-x-auto rounded-xl border border-border/60">
        <table className="w-full min-w-[880px] text-sm">
          <thead className="bg-panel">
            <tr className="label-hud">
              <th className="px-3 py-2 text-left">State</th>
              <th className="px-3 py-2 text-left">Region</th>
              <th className="px-3 py-2 text-left">Government</th>
              <th className="px-3 py-2 text-right">Population</th>
              <th className="px-3 py-2 text-right">GDP</th>
              <th className="px-3 py-2 text-right">Dem.</th>
              <th className="px-3 py-2 text-right">Stab.</th>
              <th className="px-3 py-2 text-left">Priority</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-border/60 hover:bg-accent/50">
                <td className="px-3 py-2">
                  <Link
                    to="/countries/$iso"
                    params={{ iso: c.iso_a3 }}
                    className="flex items-center gap-2 font-medium hover:text-primary"
                  >
                    <span>{c.flag_emoji}</span>
                    {c.name}
                    {c.current_conflicts.length > 0 && (
                      <span className="rounded-sm border border-critical/50 bg-critical/12 px-1 font-mono text-[10px] uppercase text-critical">
                        conflict
                      </span>
                    )}
                  </Link>
                  <div className="text-[11px] text-muted-foreground">{c.capital}</div>
                </td>
                <td className="px-3 py-2 text-muted-foreground">{c.region}</td>
                <td className="max-w-[220px] truncate px-3 py-2 text-muted-foreground">
                  {c.government_type}
                </td>
                <td className="px-3 py-2 text-right font-mono">{formatCompact(c.population)}</td>
                <td className="px-3 py-2 text-right font-mono">{formatMoney(Number(c.gdp_usd))}</td>
                <td className="px-3 py-2 text-right font-mono">{Number(c.democracy_rating).toFixed(1)}</td>
                <td className="px-3 py-2 text-right font-mono">{c.stability_rating}/10</td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    <ImportanceBadge level={c.importance} />
                    <ConfidenceBadge level={c.confidence} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
