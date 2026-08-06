import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  notesQuery,
  formatDate,
  countriesQuery,
  figuresQuery,
  organizationsQuery,
  eventsQuery,
  sourcesQuery,
  NOTE_CATEGORIES,
  type NoteRow,
} from "@/lib/atlas";
import { CollectionPanel } from "@/components/atlas/collection-panel";
import { FilterBar, type SelectFilter } from "@/components/atlas/filter-bar";
import { ImportanceBadge, ConfidenceBadge, TagList } from "@/components/atlas/primitives";
import type { FieldSpec } from "@/components/atlas/record-editor";

export const Route = createFileRoute("/notes")({
  head: () => ({
    meta: [
      { title: "Research Notes — Political Intelligence Atlas" },
      {
        name: "description",
        content:
          "Structured research notebook: notes linked to countries, people, organizations, events and sources, with category, priority and tag filtering.",
      },
      { property: "og:title", content: "Research Notes — Political Intelligence Atlas" },
      {
        property: "og:description",
        content: "Structured, filterable analyst notebook for the whole atlas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NotesPage,
});

const PRIORITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

function NotesPage() {
  const { data: notes = [] } = useQuery(notesQuery());
  const { data: countries = [] } = useQuery(countriesQuery);
  const { data: figures = [] } = useQuery(figuresQuery);
  const { data: orgs = [] } = useQuery(organizationsQuery);
  const { data: events = [] } = useQuery(eventsQuery);
  const { data: sources = [] } = useQuery(sourcesQuery);

  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("all");
  const [region, setRegion] = useState("all");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("updated");
  const [tag, setTag] = useState("all");
  const [priority, setPriority] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const regions = useMemo(
    () => [...new Set(countries.map((c) => c.region).filter(Boolean))].sort(),
    [countries],
  );
  const allTags = useMemo(
    () => [...new Set(notes.flatMap((n) => (n.tags as string[]) ?? []))].sort(),
    [notes],
  );

  const noteRegion = (n: NoteRow) => n.countries?.region ?? n.region ?? "";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = notes.filter((n) => {
      if (country !== "all" && n.country_id !== country) return false;
      if (region !== "all" && noteRegion(n) !== region) return false;
      if (category !== "all" && n.category !== category) return false;
      if (priority !== "all" && n.importance !== priority) return false;
      if (tag !== "all" && !((n.tags as string[]) ?? []).includes(tag)) return false;
      const updated = String(n.updated_at ?? "").slice(0, 10);
      if (from && updated < from) return false;
      if (to && updated > to) return false;
      if (!q) return true;
      const hay = [
        n.title,
        n.summary,
        n.body,
        n.category,
        n.countries?.name,
        ((n.tags as string[]) ?? []).join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });

    return [...rows].sort((a, b) => {
      switch (sort) {
        case "created":
          return String(b.created_at).localeCompare(String(a.created_at));
        case "alpha":
          return String(a.title).localeCompare(String(b.title));
        case "priority":
          return (
            (PRIORITY_ORDER[String(a.importance)] ?? 9) - (PRIORITY_ORDER[String(b.importance)] ?? 9)
          );
        default:
          return String(b.updated_at).localeCompare(String(a.updated_at));
      }
    });
  }, [notes, search, country, region, category, priority, tag, from, to, sort]);

  const opt = (label: string, values: { value: string; label: string }[]) => [
    { value: "all", label },
    ...values,
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
      key: "category",
      label: "Category",
      value: category,
      onChange: setCategory,
      options: opt(
        "All categories",
        NOTE_CATEGORIES.map((c) => ({ value: c, label: c })),
      ),
    },
    {
      key: "sort",
      label: "Sort",
      value: sort,
      onChange: setSort,
      options: [
        { value: "updated", label: "Recently updated" },
        { value: "created", label: "Recently created" },
        { value: "alpha", label: "Alphabetical" },
        { value: "priority", label: "Priority" },
      ],
    },
  ];

  const noteFields: FieldSpec[] = [
    { key: "title", label: "Title" },
    {
      key: "category",
      label: "Category",
      type: "select",
      options: NOTE_CATEGORIES,
      defaultValue: "Politics",
    },
    {
      key: "importance",
      label: "Priority",
      type: "select",
      options: ["critical", "high", "medium", "low"],
      defaultValue: "medium",
    },
    {
      key: "confidence",
      label: "Confidence",
      type: "select",
      options: ["confirmed", "likely", "disputed", "unknown"],
      defaultValue: "likely",
    },
    {
      key: "country_id",
      label: "Country",
      type: "select",
      optional: true,
      options: countries.map((c) => c.id),
      optionLabels: Object.fromEntries(countries.map((c) => [c.id, `${c.flag_emoji} ${c.name}`])),
    },
    {
      key: "region",
      label: "Region (if no country)",
      type: "select",
      optional: true,
      options: regions,
    },
    {
      key: "figure_id",
      label: "Related person",
      type: "select",
      optional: true,
      options: figures.map((f) => f.id),
      optionLabels: Object.fromEntries(figures.map((f) => [f.id, f.name])),
    },
    {
      key: "organization_id",
      label: "Related organization",
      type: "select",
      optional: true,
      options: orgs.map((o) => o.id),
      optionLabels: Object.fromEntries(orgs.map((o) => [o.id, o.name])),
    },
    {
      key: "event_id",
      label: "Related event",
      type: "select",
      optional: true,
      options: events.map((e) => e.id),
      optionLabels: Object.fromEntries(events.map((e) => [e.id, e.name])),
    },
    {
      key: "source_id",
      label: "Source",
      type: "select",
      optional: true,
      options: sources.map((s) => s.id),
      optionLabels: Object.fromEntries(sources.map((s) => [s.id, s.title])),
    },
    { key: "tags", label: "Tags (comma separated)", type: "tags" },
    { key: "summary", label: "Summary", type: "textarea" },
    { key: "body", label: "Full note", type: "textarea" },
  ];

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-3 px-5 pb-8 pt-4 md:px-8 md:pt-5">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Research notes</h1>
        <p className="mt-0.5 max-w-3xl text-[13px] text-muted-foreground">
          Structured notes across the atlas, linked to countries, people, organizations, events and
          sources.
        </p>
      </header>

      <FilterBar
        search={search}
        onSearch={setSearch}
        placeholder="Search titles, summaries and note text…"
        filters={filters}
        resultCount={filtered.length}
        onReset={() => {
          setSearch("");
          setCountry("all");
          setRegion("all");
          setCategory("all");
          setSort("updated");
          setTag("all");
          setPriority("all");
          setFrom("");
          setTo("");
        }}
        advanced={
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="flex flex-col gap-1">
              <span className="label-hud">Tag</span>
              <select
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="h-8 rounded-lg border border-input bg-background px-2 text-xs"
              >
                <option value="all">All tags</option>
                {allTags.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="label-hud">Priority</span>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="h-8 rounded-lg border border-input bg-background px-2 text-xs"
              >
                <option value="all">Any priority</option>
                {["critical", "high", "medium", "low"].map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="label-hud">Updated from</span>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="h-8 rounded-lg border border-input bg-background px-2 text-xs"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="label-hud">Updated to</span>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="h-8 rounded-lg border border-input bg-background px-2 text-xs"
              />
            </label>
          </div>
        }
      />

      <CollectionPanel
        table="research_notes"
        title="Notes"
        addLabel="New note"
        rows={filtered as never[]}
        fields={noteFields}
        defaults={{ entity_type: "workspace", entity_id: null }}
        renderRow={(n) => {
          const row = n as unknown as NoteRow;
          return (
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-medium">{row.title}</h2>
                <ImportanceBadge level={String(row.importance)} />
                <ConfidenceBadge level={String(row.confidence)} />
                <span className="rounded-full border border-border/60 bg-secondary px-2 py-0.5 text-[12.5px] text-muted-foreground">
                  {row.category || "General"}
                </span>
                {row.countries ? (
                  <Link
                    to="/countries/$iso"
                    params={{ iso: row.countries.iso_a3 }}
                    className="text-[12.5px] text-primary hover:underline"
                  >
                    {row.countries.flag_emoji} {row.countries.name}
                  </Link>
                ) : row.region ? (
                  <span className="text-[12.5px] text-muted-foreground">{row.region}</span>
                ) : null}
              </div>

              {row.summary ? (
                <p className="mt-1.5 text-sm text-foreground/85">{row.summary}</p>
              ) : null}
              {row.body ? (
                <p className="mt-1.5 line-clamp-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {row.body}
                </p>
              ) : null}

              {row.political_figures || row.organizations || row.political_events || row.sources ? (
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[12.5px] text-muted-foreground">
                  {row.political_figures ? <span>person: {row.political_figures.name}</span> : null}
                  {row.organizations ? <span>org: {row.organizations.name}</span> : null}
                  {row.political_events ? <span>event: {row.political_events.name}</span> : null}
                  {row.sources ? <span>source: {row.sources.title}</span> : null}
                </div>
              ) : null}

              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <TagList tags={(row.tags as string[]) ?? []} />
                <span className="text-[12.5px] text-muted-foreground">
                  updated {formatDate(String(row.updated_at).slice(0, 10))}
                </span>
              </div>
            </div>
          );
        }}
      />
    </div>
  );
}
