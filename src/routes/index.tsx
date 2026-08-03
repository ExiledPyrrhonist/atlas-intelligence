import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { WorldMap } from "@/components/atlas/world-map";
import { countriesQuery } from "@/lib/atlas";

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

  return (
    <div className="relative h-[calc(100vh-3.25rem)]">
      <div className="pointer-events-none absolute left-4 top-4 z-10 max-w-xs">
        <h1 className="text-lg font-semibold tracking-tight text-foreground">
          Global Situation Map
        </h1>
      </div>
      <WorldMap countries={countries} />
    </div>
  );
}
