import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { eventsQuery, formatDate } from "@/lib/atlas";
import { ImportanceBadge } from "@/components/atlas/primitives";
import { CollectionPanel } from "@/components/atlas/collection-panel";
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

function EventsIndex() {
  const { data: events = [] } = useQuery(eventsQuery);

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 md:p-6">
      <header>
        <h1 className="text-2xl font-semibold">Events</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every tracked political event, newest first.
        </p>
      </header>

      <CollectionPanel
        table="political_events"
        title="Political events"
        addLabel="Add event"
        rows={events as never[]}
        fields={EVENT_FIELDS}
        searchKeys={["name", "location", "summary", "event_type", "tags"]}
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
                <span className="rounded-sm border border-critical/50 bg-critical/12 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-critical">
                  ongoing
                </span>
              ) : null}
            </div>
            <div className="font-mono text-[11px] text-muted-foreground">
              {formatDate(String(e["event_date"] ?? ""))} · {String(e["event_type"] ?? "")} ·{" "}
              {String(e["location"] ?? "—")}
            </div>
            {e["summary"] ? (
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {String(e["summary"])}
              </p>
            ) : null}
          </div>
        )}
      />
    </div>
  );
}
