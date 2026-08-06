import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { organizationsQuery, countriesQuery } from "@/lib/atlas";
import { supabase } from "@/integrations/supabase/client";
import { ImportanceBadge } from "@/components/atlas/primitives";
import { CollectionPanel } from "@/components/atlas/collection-panel";
import { FilterBar, type SelectFilter } from "@/components/atlas/filter-bar";
import { ORG_FIELDS } from "@/components/atlas/entity-fields";

export const Route = createFileRoute("/organizations/")({
  head: () => ({
    meta: [
      { title: "Organizations — Political Intelligence Atlas" },
      {
        name: "description",
        content:
          "Alliances, blocs and international organizations with purpose, leadership, headquarters and membership.",
      },
      { property: "og:title", content: "Organizations — Political Intelligence Atlas" },
      {
        property: "og:description",
        content: "Editable registry of international organizations and alliances.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OrganizationsIndex,
});

/** Status is derived from tags so no schema change is needed. */
function orgStatus(tags: string[]): "Active" | "Inactive" | "Dissolved" {
  const t = tags.map((x) => x.toLowerCase());
  if (t.includes("dissolved")) return "Dissolved";
  if (t.includes("inactive") || t.includes("suspended")) return "Inactive";
  return "Active";
}

const orgMembersQuery = {
  queryKey: ["organization_members", "all"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("organization_members")
      .select("organization_id, country_id");
    if (error) throw error;
    return data ?? [];
  },
};

function OrganizationsIndex() {
  const { data: orgs = [] } = useQuery(organizationsQuery);
  const { data: countries = [] } = useQuery(countriesQuery);
  const { data: members = [] } = useQuery(orgMembersQuery);

  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [country, setCountry] = useState("all");
  const [region, setRegion] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("updated");

  const byId = useMemo(() => new Map(countries.map((c) => [c.id, c])), [countries]);
  const regions = useMemo(
    () => [...new Set(countries.map((c) => c.region).filter(Boolean))].sort(),
    [countries],
  );
  const types = useMemo(
    () => [...new Set(orgs.map((o) => o.org_type).filter(Boolean))].sort(),
    [orgs],
  );

  const countriesByOrg = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const m of members) {
      const list = map.get(m.organization_id) ?? [];
      list.push(m.country_id);
      map.set(m.organization_id, list);
    }
    return map;
  }, [members]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = orgs.filter((o) => {
      if (q) {
        const hay = [o.name, o.abbreviation, o.org_type, o.purpose, ...(o.tags ?? [])]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (type !== "all" && o.org_type !== type) return false;
      const linked = countriesByOrg.get(o.id) ?? [];
      if (country !== "all" && !linked.includes(country)) return false;
      if (region !== "all" && !linked.some((id) => byId.get(id)?.region === region)) return false;
      if (status !== "all" && orgStatus(o.tags ?? []) !== status) return false;
      return true;
    });
    return [...rows].sort((a, b) => {
      if (sort === "alpha") return a.name.localeCompare(b.name);
      if (sort === "created") return String(b.created_at).localeCompare(String(a.created_at));
      return String(b.last_updated).localeCompare(String(a.last_updated));
    });
  }, [orgs, search, type, country, region, status, sort, byId, countriesByOrg]);

  const opt = (allLabel: string, items: { value: string; label: string }[]) => [
    { value: "all", label: allLabel },
    ...items,
  ];

  const filters: SelectFilter[] = [
    {
      key: "type",
      label: "Type",
      value: type,
      onChange: setType,
      options: opt(
        "All types",
        types.map((t) => ({ value: t, label: t })),
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
      key: "status",
      label: "Status",
      value: status,
      onChange: setStatus,
      options: opt(
        "All statuses",
        ["Active", "Inactive", "Dissolved"].map((s) => ({ value: s, label: s })),
      ),
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
        <h1 className="text-xl font-semibold tracking-tight">Organizations</h1>
        <p className="mt-0.5 max-w-3xl text-[13px] text-muted-foreground">
          Alliances, unions and multilateral bodies tracked in the atlas.
        </p>
      </header>

      <FilterBar
        search={search}
        onSearch={setSearch}
        placeholder="Search organizations…"
        filters={filters}
        resultCount={filtered.length}
        onReset={() => {
          setSearch("");
          setType("all");
          setCountry("all");
          setRegion("all");
          setStatus("all");
          setSort("updated");
        }}
      />

      <CollectionPanel
        table="organizations"
      sourceEntityType="organizations"
        title="Organizations"
        addLabel="Add organization"
        rows={filtered as never[]}
        fields={ORG_FIELDS}
        renderRow={(o) => (
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/organizations/$id"
                params={{ id: String(o["id"]) }}
                className="text-sm font-medium hover:text-primary"
              >
                {String(o["name"] ?? "")}
              </Link>
              {o["abbreviation"] ? (
                <span className="text-[12.5px] text-primary">
                  {String(o["abbreviation"])}
                </span>
              ) : null}
              <ImportanceBadge level={String(o["importance"] ?? "low")} />
              <span className="rounded-sm border border-border/60 bg-secondary px-1.5 py-0.5 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {orgStatus((o["tags"] as string[]) ?? [])}
              </span>
            </div>
            <div className="text-[12.5px] text-muted-foreground">
              {String(o["org_type"] ?? "—")} · HQ {String(o["headquarters"] ?? "—")} ·{" "}
              {String(o["member_count"] ?? 0)} members
            </div>
          </div>
        )}
      />
    </div>
  );
}
