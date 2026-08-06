import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { sourcesQuery, countriesQuery, formatDate } from "@/lib/atlas";
import { supabase } from "@/integrations/supabase/client";
import { CollectionPanel } from "@/components/atlas/collection-panel";
import { FilterBar, type SelectFilter } from "@/components/atlas/filter-bar";
import type { FieldSpec } from "@/components/atlas/record-editor";

const SOURCE_TYPES = [
  "government_report",
  "academic_paper",
  "news_article",
  "ngo_report",
  "think_tank",
  "database",
  "book",
] as const;

const SOURCE_FIELDS: FieldSpec[] = [
  { key: "title", label: "Title" },
  { key: "publisher", label: "Publisher" },
  { key: "url", label: "URL" },
  { key: "published_date", label: "Publication date", type: "date" },
  { key: "accessed_date", label: "Date accessed", type: "date" },
  {
    key: "source_type",
    label: "Source type",
    type: "select",
    options: [...SOURCE_TYPES],
    defaultValue: "news_article",
  },
  {
    key: "reliability",
    label: "Reliability",
    type: "select",
    options: ["high", "medium", "low"],
    defaultValue: "medium",
  },
  { key: "summary", label: "Summary", type: "textarea" },
  { key: "information_used", label: "Information used", type: "textarea" },
  { key: "notes", label: "Notes", type: "textarea" },
];

export const Route = createFileRoute("/sources")({
  validateSearch: (search: Record<string, unknown>) => ({
    source: typeof search["source"] === "string" ? (search["source"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sources — Political Intelligence Atlas" },
      {
        name: "description",
        content:
          "Source library for the atlas: publishers, URLs, publication dates, reliability ratings and how each source was used.",
      },
      { property: "og:title", content: "Sources — Political Intelligence Atlas" },
      { property: "og:description", content: "Editable source library with reliability ratings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SourcesPage,
});

const sourceCountriesQuery = {
  queryKey: ["record_sources", "country"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("record_sources")
      .select("source_id, entity_id")
      .eq("entity_type", "country");
    if (error) throw error;
    return data ?? [];
  },
};

function label(value: string): string {
  return value.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

function SourcesPage() {
  const { source: highlightId } = Route.useSearch();
  const { data: sources = [] } = useQuery(sourcesQuery);
  const { data: countries = [] } = useQuery(countriesQuery);
  const { data: links = [] } = useQuery(sourceCountriesQuery);

  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [country, setCountry] = useState("all");
  const [region, setRegion] = useState("all");
  const [reliability, setReliability] = useState("all");
  const [addedYear, setAddedYear] = useState("all");
  const [sort, setSort] = useState("newest");

  const byId = useMemo(() => new Map(countries.map((c) => [c.id, c])), [countries]);
  const regions = useMemo(
    () => [...new Set(countries.map((c) => c.region).filter(Boolean))].sort(),
    [countries],
  );
  const countriesBySource = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const l of links) {
      const list = map.get(l.source_id) ?? [];
      list.push(String(l.entity_id));
      map.set(l.source_id, list);
    }
    return map;
  }, [links]);
  const years = useMemo(
    () =>
      [...new Set(sources.map((s) => String(s.created_at).slice(0, 4)))].sort((a, b) =>
        b.localeCompare(a),
      ),
    [sources],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = sources.filter((s) => {
      if (q) {
        const hay = [s.title, s.publisher, s.summary, s.notes, s.url].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (type !== "all" && s.source_type !== type) return false;
      if (reliability !== "all" && s.reliability !== reliability) return false;
      const linked = countriesBySource.get(s.id) ?? [];
      if (country !== "all" && !linked.includes(country)) return false;
      if (region !== "all" && !linked.some((id) => byId.get(id)?.region === region)) return false;
      if (addedYear !== "all" && String(s.created_at).slice(0, 4) !== addedYear) return false;
      return true;
    });
    return [...rows].sort((a, b) => {
      if (sort === "alpha") return a.title.localeCompare(b.title);
      if (sort === "oldest") return String(a.created_at).localeCompare(String(b.created_at));
      return String(b.created_at).localeCompare(String(a.created_at));
    });
  }, [sources, search, type, reliability, country, region, addedYear, sort, byId, countriesBySource]);

  useEffect(() => {
    if (!highlightId) return;
    const el = document.getElementById(`record-${highlightId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightId, filtered]);

  const opt = (allLabel: string, items: { value: string; label: string }[]) => [
    { value: "all", label: allLabel },
    ...items,
  ];

  const filters: SelectFilter[] = [
    {
      key: "type",
      label: "Source type",
      value: type,
      onChange: setType,
      options: opt(
        "All types",
        SOURCE_TYPES.map((t) => ({ value: t, label: label(t) })),
      ),
    },
    {
      key: "country",
      label: "Country",
      value: country,
      onChange: setCountry,
      options: opt(
        "All countries",
        countries.map((c) => ({ value: c.id, label: `${c.flag_emoji} ${c.name}` })),
      ),
    },
    {
      key: "region",
      label: "Region",
      value: region,
      onChange: setRegion,
      options: opt(
        "All regions",
        regions.map((r) => ({ value: r, label: r })),
      ),
    },
    {
      key: "reliability",
      label: "Reliability",
      value: reliability,
      onChange: setReliability,
      options: opt(
        "Any reliability",
        ["high", "medium", "low"].map((r) => ({ value: r, label: label(r) })),
      ),
    },
    {
      key: "addedYear",
      label: "Date added",
      value: addedYear,
      onChange: setAddedYear,
      options: opt(
        "Any date",
        years.map((y) => ({ value: y, label: y })),
      ),
    },
    {
      key: "sort",
      label: "Sort",
      value: sort,
      onChange: setSort,
      options: [
        { value: "newest", label: "Newest first" },
        { value: "oldest", label: "Oldest first" },
        { value: "alpha", label: "Alphabetical" },
      ],
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-3 px-5 pb-8 pt-4 md:px-8 md:pt-5">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Sources</h1>
        <p className="mt-0.5 max-w-3xl text-[13px] text-muted-foreground">
          Central source library. Sources can be attached to any country, event or statistic.
        </p>
      </header>

      <FilterBar
        search={search}
        onSearch={setSearch}
        placeholder="Search sources…"
        filters={filters}
        resultCount={filtered.length}
        onReset={() => {
          setSearch("");
          setType("all");
          setCountry("all");
          setRegion("all");
          setReliability("all");
          setAddedYear("all");
          setSort("newest");
        }}
      />

      <CollectionPanel
        table="sources"
        title="Source library"
        addLabel="Add source"
        rows={filtered as never[]}
        highlightId={highlightId}
        fields={SOURCE_FIELDS}
        renderRow={(s) => (
          <div>
            <div className="text-sm font-medium">{String(s["title"] ?? "")}</div>
            <div className="text-[13px] text-muted-foreground">
              {String(s["publisher"] ?? "—")} · {label(String(s["source_type"] ?? ""))} ·
              reliability {String(s["reliability"] ?? "")}
            </div>
            {s["url"] ? (
              <a
                href={String(s["url"])}
                target="_blank"
                rel="noreferrer"
                className="mt-1 block truncate text-xs text-primary hover:underline"
              >
                {String(s["url"])}
              </a>
            ) : null}
            <div className="mt-1 text-[12px] font-medium text-muted-foreground">
              published {formatDate((s["published_date"] as string) ?? null)} · accessed{" "}
              {formatDate((s["accessed_date"] as string) ?? null)}
            </div>
          </div>
        )}
      />
    </div>
  );
}
