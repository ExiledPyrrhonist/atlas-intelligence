import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { WorldMap } from "@/components/atlas/world-map";
import { countriesQuery, IMPORTANCE_ORDER } from "@/lib/atlas";
import { ImportanceBadge } from "@/components/atlas/primitives";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "World Map — Political Intelligence Atlas" },
      {
        name: "description",
        content:
          "Interactive GIS world map of tracked states. Zoom, pan and open a country to read its full political intelligence dossier.",
      },
      { property: "og:title", content: "World Map — Political Intelligence Atlas" },
      {
        property: "og:description",
        content: "Interactive geopolitical map with country dossiers, conflicts and ratings.",
      },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  const { data: countries = [] } = useQuery(countriesQuery);
  const [region, setRegion] = useState<string>("all");
  const [importance, setImportance] = useState<string>("all");

  const regions = useMemo(
    () => Array.from(new Set(countries.map((c) => c.region))).sort(),
    [countries],
  );

  const filtered = useMemo(
    () =>
      countries.filter(
        (c) =>
          (region === "all" || c.region === region) &&
          (importance === "all" || c.importance === importance),
      ),
    [countries, region, importance],
  );

  const sorted = useMemo(
    () =>
      [...filtered].sort(
        (a, b) =>
          IMPORTANCE_ORDER.indexOf(a.importance as never) -
            IMPORTANCE_ORDER.indexOf(b.importance as never) || a.name.localeCompare(b.name),
      ),
    [filtered],
  );

  const focusIso = useMemo(() => new Set(filtered.map((c) => c.iso_a3)), [filtered]);
  const filtersActive = region !== "all" || importance !== "all";

  return (
    <div className="flex h-[calc(100vh-3.25rem)] flex-col lg:flex-row">
      <div className="relative min-h-[55vh] flex-1">
        <div className="pointer-events-none absolute left-4 top-4 z-10 max-w-xs">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Global Situation Map
          </h1>
        </div>
        <WorldMap countries={countries} focusIso={filtersActive ? focusIso : undefined} />
      </div>


      <aside className="flex w-full shrink-0 flex-col border-t border-border bg-panel lg:w-80 lg:border-l lg:border-t-0">
        <div className="space-y-2 border-b border-border p-3">
          <div className="label-hud">Filter tracked states</div>
          <div className="flex gap-2">
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="h-8 flex-1 rounded border border-input bg-background px-2 text-xs"
            >
              <option value="all">All regions</option>
              {regions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <select
              value={importance}
              onChange={(e) => setImportance(e.target.value)}
              className="h-8 flex-1 rounded border border-input bg-background px-2 text-xs"
            >
              <option value="all">All priorities</option>
              {IMPORTANCE_ORDER.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </div>
          <div className="text-xs text-muted-foreground">
            {sorted.length} states in view
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {sorted.map((c) => (
            <Link
              key={c.id}
              to="/countries/$iso"
              params={{ iso: c.iso_a3 }}
              className="flex items-center gap-3 border-b border-border/60 px-3 py-2.5 hover:bg-accent"
            >
              <span className="text-lg leading-none">{c.flag_emoji}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">{c.name}</span>
                <span className="block truncate text-[11px] text-muted-foreground">
                  {c.capital} · {c.region}
                </span>
              </span>
              <ImportanceBadge level={c.importance} />
              <span
                className={cn(
                  "h-6 w-1 rounded-full",
                  c.current_conflicts.length ? "bg-critical" : "bg-border",
                )}
                title={c.current_conflicts.length ? "Active conflict" : "No active conflict"}
              />
            </Link>
          ))}
        </div>
      </aside>
    </div>
  );
}
