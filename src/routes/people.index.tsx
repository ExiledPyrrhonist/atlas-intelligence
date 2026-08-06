import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { countriesQuery, figuresQuery } from "@/lib/atlas";
import { supabase } from "@/integrations/supabase/client";
import { ImportanceBadge } from "@/components/atlas/primitives";
import { CollectionPanel } from "@/components/atlas/collection-panel";
import { FilterBar, type SelectFilter } from "@/components/atlas/filter-bar";
import { FIGURE_FIELDS, useCountryField } from "@/components/atlas/entity-fields";

export const Route = createFileRoute("/people/")({
  head: () => ({
    meta: [
      { title: "People — Political Intelligence Atlas" },
      {
        name: "description",
        content:
          "Directory of tracked political figures: leaders, ministers and power brokers with party, ideology and importance ratings.",
      },
      { property: "og:title", content: "People — Political Intelligence Atlas" },
      {
        property: "og:description",
        content: "Editable directory of political figures linked to their countries.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PeopleIndex,
});

const POSITION_GROUPS = [
  "Head of State",
  "Head of Government",
  "Minister",
  "Legislator",
  "Party Leader",
  "Diplomat",
  "Military Leader",
  "Other",
] as const;

/** Maps a free-text position/title onto one of the structured role groups. */
function positionGroup(position: string, tags: string[]): string {
  const p = position.toLowerCase();
  const t = tags.map((x) => x.toLowerCase());
  if (t.includes("head-of-state") || /president|monarch|king|queen|emir|sultan|supreme leader/.test(p))
    return "Head of State";
  if (t.includes("head-of-government") || /prime minister|chancellor|premier|taoiseach/.test(p))
    return "Head of Government";
  if (/minister|secretary of/.test(p)) return "Minister";
  if (/senator|deputy|mp\b|parliament|congress|legislat/.test(p)) return "Legislator";
  if (/party (leader|chair)|chairman of the|leader of the/.test(p)) return "Party Leader";
  if (/ambassador|envoy|diplomat|foreign affairs/.test(p)) return "Diplomat";
  if (/general|admiral|commander|chief of staff|military|army/.test(p)) return "Military Leader";
  return "Other";
}

const figureOrgsQuery = {
  queryKey: ["figure_organizations", "all"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("figure_organizations")
      .select("figure_id, organization_id, organizations(name)");
    if (error) throw error;
    return data ?? [];
  },
};

function PeopleIndex() {
  const { data: figures = [] } = useQuery(figuresQuery);
  const { data: countries = [] } = useQuery(countriesQuery);
  const { data: figureOrgs = [] } = useQuery(figureOrgsQuery);
  const countryField = useCountryField();
  const byId = useMemo(() => new Map(countries.map((c) => [c.id, c])), [countries]);

  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("all");
  const [region, setRegion] = useState("all");
  const [position, setPosition] = useState("all");
  const [org, setOrg] = useState("all");
  const [sort, setSort] = useState("updated");

  const regions = useMemo(
    () => [...new Set(countries.map((c) => c.region).filter(Boolean))].sort(),
    [countries],
  );

  const orgOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const link of figureOrgs) {
      const name = (link as { organizations?: { name: string } | null }).organizations?.name;
      if (link.organization_id && name) map.set(link.organization_id, name);
    }
    return [...map.entries()].map(([value, label]) => ({ value, label })).sort((a, b) =>
      a.label.localeCompare(b.label),
    );
  }, [figureOrgs]);

  const orgsByFigure = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const link of figureOrgs) {
      const list = map.get(link.figure_id) ?? [];
      list.push(link.organization_id);
      map.set(link.figure_id, list);
    }
    return map;
  }, [figureOrgs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = figures.filter((f) => {
      if (q) {
        const hay = [f.name, f.position, f.party, f.ideology, ...(f.tags ?? [])]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (country !== "all" && f.country_id !== country) return false;
      if (region !== "all" && byId.get(String(f.country_id))?.region !== region) return false;
      if (position !== "all" && positionGroup(f.position ?? "", f.tags ?? []) !== position)
        return false;
      if (org !== "all" && !(orgsByFigure.get(f.id) ?? []).includes(org)) return false;
      return true;
    });
    return [...rows].sort((a, b) => {
      if (sort === "alpha") return a.name.localeCompare(b.name);
      if (sort === "created") return String(b.created_at).localeCompare(String(a.created_at));
      return String(b.last_updated).localeCompare(String(a.last_updated));
    });
  }, [figures, search, country, region, position, org, sort, byId, orgsByFigure]);

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
      key: "position",
      label: "Position",
      value: position,
      onChange: setPosition,
      options: opt(
        "All positions",
        POSITION_GROUPS.map((p) => ({ value: p, label: p })),
      ),
    },
    {
      key: "org",
      label: "Organization",
      value: org,
      onChange: setOrg,
      options: opt("All organizations", orgOptions),
    },
    {
      key: "sort",
      label: "Sort",
      value: sort,
      onChange: setSort,
      options: [
        { value: "updated", label: "Recently updated" },
        { value: "created", label: "Recently added" },
        { value: "alpha", label: "Alphabetical" },
      ],
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-3 px-5 pb-8 pt-4 md:px-8 md:pt-5">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">People</h1>
        <p className="mt-0.5 max-w-3xl text-[13px] text-muted-foreground">
          Every political figure in the database, linked to their country dossier.
        </p>
      </header>

      <FilterBar
        search={search}
        onSearch={setSearch}
        placeholder="Search political figures…"
        filters={filters}
        resultCount={filtered.length}
        onReset={() => {
          setSearch("");
          setCountry("all");
          setRegion("all");
          setPosition("all");
          setOrg("all");
          setSort("updated");
        }}
      />

      <CollectionPanel
        table="political_figures"
      sourceEntityType="political_figures"
        title="Political figures"
        addLabel="Add person"
        rows={filtered as never[]}
        fields={[...FIGURE_FIELDS, countryField]}
        renderRow={(f) => {
          const country = byId.get(String(f["country_id"]));
          return (
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to="/people/$id"
                  params={{ id: String(f["id"]) }}
                  className="text-sm font-medium hover:text-primary"
                >
                  {String(f["name"] ?? "")}
                </Link>
                <ImportanceBadge level={String(f["importance"] ?? "low")} />
              </div>
              <div className="text-[13px] text-muted-foreground">
                {String(f["position"] ?? "—")}
                {f["party"] ? ` · ${String(f["party"])}` : ""}
              </div>
              {country ? (
                <Link
                  to="/countries/$iso"
                  params={{ iso: country.iso_a3 }}
                  className="mt-1 inline-block text-[12.5px] text-primary hover:underline"
                >
                  {country.flag_emoji} {country.name}
                </Link>
              ) : (
                <div className="mt-1 text-[12.5px] text-muted-foreground">
                  No country linked
                </div>
              )}
            </div>
          );
        }}
      />
    </div>
  );
}
