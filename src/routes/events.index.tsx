import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { eventsQuery, countriesQuery, formatDate } from "@/lib/atlas";
import { supabase } from "@/integrations/supabase/client";
import { ImportanceBadge } from "@/components/atlas/primitives";
import { CollectionPanel } from "@/components/atlas/collection-panel";
import { FilterBar, type SelectFilter } from "@/components/atlas/filter-bar";
import { EVENT_FIELDS } from "@/components/atlas/entity-fields";

export const Route = createFileRoute("/events/")({
  head: () => ({
    meta: [
      { title: "Events — Political Intelligence Atlas" },
      {
        name: "description",
        content:
          "Chronological archive of elections, coups, wars, treaties, protests and crises tracked in the atlas.",
      },
      { property: "og:title", content: "Events — Political Intelligence Atlas" },
      {
        property: "og:description",
        content: "Editable timeline of tracked political events worldwide.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EventsIndex,
});

const EVENT_TYPES = [
  "election",
  "protest",
  "revolution",
  "coup",
  "war",
  "treaty",
  "crisis",
  "sanction",
  "referendum",
] as const;

const eventCountriesQuery = {
  queryKey: ["event_countries", "all"],
  queryFn: async () => {
    const { data, error } = await supabase.from("event_countries").select("event_id, country_id");
    if (error) throw error;
    return data ?? [];
  },
};

function EventsIndex() {
  const { data: events = [] } = useQuery(eventsQuery);
  const { data: countries = [] } = useQuery(countriesQuery);
  const { data: links = [] } = useQuery(eventCountriesQuery);

  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("all");
  const [region, setRegion] = useState("all");
  const [type, setType] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [sort, setSort] = useState("newest");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const byId = useMemo(() => new Map(countries.map((c) => [c.id, c])), [countries]);
  const regions = useMemo(
    () => [...new Set(countries.map((c) => c.region).filter(Boolean))].sort(),
    [countries],
  );

  const countriesByEvent = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const l of links) {
      const list = map.get(l.event_id) ?? [];
      list.push(l.country_id);
      map.set(l.event_id, list);
    }
    return map;
  }, [links]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = events.filter((e) => {
      if (q) {
        const hay = [e.name, e.location, e.summary, e.event_type, ...(e.tags ?? [])]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      const linked = countriesByEvent.get(e.id) ?? [];
      if (country !== "all" && !linked.includes(country)) return false;
      if (region !== "all" && !linked.some((id) => byId.get(id)?.region === region)) return false;
      if (type !== "all" && e.event_type !== type) return false;
      if (severity !== "all" && e.importance !== severity) return false;
      if (from && String(e.event_date) < from) return false;
      if (to && String(e.event_date) > to) return false;
      return true;
    });
    return [...rows].sort((a, b) => {
      if (sort === "oldest") return String(a.event_date).localeCompare(String(b.event_date));
      if (sort === "updated") return String(b.last_updated).localeCompare(String(a.last_updated));
      return String(b.event_date).localeCompare(String(a.event_date));
    });
  }, [events, search, country, region, type, severity, from, to, sort, byId, countriesByEvent]);

  const opt = (allLabel: string, items: { value: string; label: string }[]) => [
    { value: "all", label: allLabel },
    ...items,
  ];

  const filters: SelectFilter[] = [
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
      key: "type",
      label: "Event type",
      value: type,
      onChange: setType,
      options: opt(
        "All types",
        EVENT_TYPES.map((t) => ({ value: t, label: t[0]!.toUpperCase() + t.slice(1) })),
      ),
    },
    {
      key: "severity",
      label: "Severity",
      value: severity,
      onChange: setSeverity,
      options: opt(
        "All severities",
        ["critical", "high", "medium", "low"].map((s) => ({
          value: s,
          label: s[0]!.toUpperCase() + s.slice(1),
        })),
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
        { value: "updated", label: "Recently updated" },
      ],
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-3 px-5 pb-8 pt-4 md:px-8 md:pt-5">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Events</h1>
        <p className="mt-0.5 max-w-3xl text-[13px] text-muted-foreground">
          Every tracked political event, newest first.
        </p>
      </header>

      <FilterBar
        search={search}
        onSearch={setSearch}
        placeholder="Search events…"
        filters={filters}
        resultCount={filtered.length}
        advanced={
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1">
              <span className="label-hud">Date from</span>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="h-9 rounded-lg border border-input bg-background px-2.5 text-[13px]"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="label-hud">Date to</span>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="h-9 rounded-lg border border-input bg-background px-2.5 text-[13px]"
              />
            </label>
          </div>
        }
        onReset={() => {
          setSearch("");
          setCountry("all");
          setRegion("all");
          setType("all");
          setSeverity("all");
          setSort("newest");
          setFrom("");
          setTo("");
        }}
      />

      <CollectionPanel
        table="political_events"
        title="Political events"
        addLabel="Add event"
        rows={filtered as never[]}
        fields={EVENT_FIELDS}
        renderRow={(e) => (
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/events/$id"
                params={{ id: String(e["id"]) }}
                className="text-sm font-medium hover:text-primary"
              >
                {String(e["name"] ?? "")}
              </Link>
              <ImportanceBadge level={String(e["importance"] ?? "low")} />
              {e["is_ongoing"] ? (
                <span className="rounded-sm border border-critical/50 bg-critical/12 px-1.5 py-0.5 text-xs font-semibold uppercase tracking-[0.08em] text-critical">
                  ongoing
                </span>
              ) : null}
            </div>
            <div className="text-[12.5px] text-muted-foreground">
              {formatDate(String(e["event_date"] ?? ""))} · {String(e["event_type"] ?? "")} ·{" "}
              {String(e["location"] ?? "—")}
            </div>
            {e["summary"] ? (
              <p className="mt-1 line-clamp-2 text-[13px] text-muted-foreground">
                {String(e["summary"])}
              </p>
            ) : null}
          </div>
        )}
      />
    </div>
  );
}
