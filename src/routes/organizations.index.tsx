import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { organizationsQuery } from "@/lib/atlas";
import { ImportanceBadge } from "@/components/atlas/primitives";
import { CollectionPanel } from "@/components/atlas/collection-panel";
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

function OrganizationsIndex() {
  const { data: orgs = [] } = useQuery(organizationsQuery);

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 md:p-6">
      <header>
        <h1 className="text-2xl font-semibold">Organizations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Alliances, unions and multilateral bodies tracked in the atlas.
        </p>
      </header>

      <CollectionPanel
        table="organizations"
        title="Organizations"
        addLabel="Add organization"
        rows={orgs as never[]}
        fields={ORG_FIELDS}
        searchKeys={["name", "abbreviation", "org_type", "purpose", "tags"]}
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
                <span className="font-mono text-[11px] text-primary">
                  {String(o["abbreviation"])}
                </span>
              ) : null}
              <ImportanceBadge level={String(o["importance"] ?? "low")} />
            </div>
            <div className="font-mono text-[11px] text-muted-foreground">
              {String(o["org_type"] ?? "—")} · HQ {String(o["headquarters"] ?? "—")} ·{" "}
              {String(o["member_count"] ?? 0)} members
            </div>
          </div>
        )}
      />
    </div>
  );
}
