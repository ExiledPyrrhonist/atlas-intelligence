import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { countriesQuery, figuresQuery } from "@/lib/atlas";
import { ImportanceBadge } from "@/components/atlas/primitives";
import { CollectionPanel } from "@/components/atlas/collection-panel";
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

function PeopleIndex() {
  const { data: figures = [] } = useQuery(figuresQuery);
  const { data: countries = [] } = useQuery(countriesQuery);
  const countryField = useCountryField();
  const byId = new Map(countries.map((c) => [c.id, c]));

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-4 p-5 md:p-8">
      <header>
        <h1 className="text-2xl font-semibold">People</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every political figure in the database, linked to their country dossier.
        </p>
      </header>

      <CollectionPanel
        table="political_figures"
        title="Political figures"
        addLabel="Add person"
        rows={figures as never[]}
        fields={[...FIGURE_FIELDS, countryField]}
        searchKeys={["name", "position", "party", "ideology", "tags"]}
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
