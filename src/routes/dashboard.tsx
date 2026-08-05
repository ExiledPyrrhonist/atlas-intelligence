import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  Flag,
  Users,
  Swords,
  CalendarClock,
  Building2,
  BookMarked,
  StickyNote,
  AlertTriangle,
} from "lucide-react";
import {
  countriesQuery,
  eventsQuery,
  figuresQuery,
  organizationsQuery,
  sourcesQuery,
  notesQuery,
  formatDate,
  IMPORTANCE_ORDER,
} from "@/lib/atlas";
import { ImportanceBadge, SectionTitle } from "@/components/atlas/primitives";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Research Dashboard — Political Intelligence Atlas" },
      {
        name: "description",
        content:
          "Coverage metrics, active conflicts, upcoming elections, high-priority topics and recent updates across the intelligence database.",
      },
      { property: "og:title", content: "Research Dashboard — Political Intelligence Atlas" },
      {
        property: "og:description",
        content: "Live coverage metrics for a personal geopolitical intelligence database.",
      },
    ],
  }),
  component: Dashboard,
});

function Stat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Flag;
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <div className="panel-surface p-4">
      <div className="flex items-center justify-between">
        <span className="label-hud">{label}</span>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="mt-2 font-mono text-3xl">{value}</div>
      {hint && <div className="mt-1 text-[12.5px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

function Dashboard() {
  const { data: countries = [] } = useQuery(countriesQuery);
  const { data: figures = [] } = useQuery(figuresQuery);
  const { data: events = [] } = useQuery(eventsQuery);
  const { data: orgs = [] } = useQuery(organizationsQuery);
  const { data: sources = [] } = useQuery(sourcesQuery);
  const { data: notes = [] } = useQuery(notesQuery());

  const activeConflicts = useMemo(
    () => events.filter((e) => e.is_ongoing && ["war", "crisis", "revolution", "coup"].includes(e.event_type)),
    [events],
  );
  const upcomingElections = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return events
      .filter((e) => e.event_type === "election" && e.event_date >= today)
      .sort((a, b) => a.event_date.localeCompare(b.event_date));
  }, [events]);
  const recentUpdates = useMemo(
    () =>
      [...countries]
        .sort((a, b) => b.last_updated.localeCompare(a.last_updated))
        .slice(0, 8),
    [countries],
  );
  const highPriority = useMemo(
    () =>
      [...countries]
        .filter((c) => c.importance === "critical" || c.importance === "high")
        .sort(
          (a, b) =>
            IMPORTANCE_ORDER.indexOf(a.importance as never) -
            IMPORTANCE_ORDER.indexOf(b.importance as never),
        ),
    [countries],
  );

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6 p-5 md:p-8">
      <header>
        <h1 className="text-xl font-semibold">Research Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Coverage and priority overview across the connected intelligence database.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Flag} label="Countries tracked" value={countries.length} hint="Full dossiers" />
        <Stat icon={Users} label="Figures tracked" value={figures.length} hint="Leaders and actors" />
        <Stat
          icon={Swords}
          label="Active conflicts"
          value={activeConflicts.length}
          hint="Ongoing wars and crises"
        />
        <Stat
          icon={CalendarClock}
          label="Events logged"
          value={events.length}
          hint={`${upcomingElections.length} upcoming elections`}
        />
        <Stat icon={Building2} label="Organizations" value={orgs.length} />
        <Stat icon={BookMarked} label="Sources" value={sources.length} hint="Cited references" />
        <Stat icon={StickyNote} label="Research notes" value={notes.length} />
        <Stat
          icon={AlertTriangle}
          label="High priority states"
          value={highPriority.length}
          hint="Critical or high importance"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <SectionTitle title="Active conflicts" count={activeConflicts.length} />
          <div className="space-y-2">
            {activeConflicts.map((e) => (
              <Link
                key={e.id}
                to="/events/$id"
                params={{ id: e.id }}
                className="panel-surface block p-3 hover:border-primary/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-sm font-medium">{e.name}</span>
                  <ImportanceBadge level={e.importance} />
                </div>
                <div className="mt-1 text-[12.5px] text-muted-foreground">
                  {e.location} · since {formatDate(e.event_date)}
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <SectionTitle title="Upcoming elections" count={upcomingElections.length} />
          <div className="space-y-2">
            {upcomingElections.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No future elections currently logged. Add election events to populate this watch
                list.
              </p>
            )}
            {upcomingElections.map((e) => (
              <Link
                key={e.id}
                to="/events/$id"
                params={{ id: e.id }}
                className="panel-surface block p-3 hover:border-primary/50"
              >
                <div className="text-sm font-medium">{e.name}</div>
                <div className="mt-1 text-[12.5px] text-signal">
                  {formatDate(e.event_date)} · {e.location}
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-6">
            <SectionTitle title="Recently updated dossiers" />
            <div className="space-y-1">
              {recentUpdates.map((c) => (
                <Link
                  key={c.id}
                  to="/countries/$iso"
                  params={{ iso: c.iso_a3 }}
                  className="flex items-center justify-between gap-3 border-b border-border/60 py-2 text-sm hover:text-primary"
                >
                  <span>
                    {c.flag_emoji} {c.name}
                  </span>
                  <span className="text-[12.5px] text-muted-foreground">
                    {formatDate(c.last_updated.slice(0, 10))}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section>
        <SectionTitle title="High priority topics" count={highPriority.length} />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {highPriority.map((c) => (
            <Link
              key={c.id}
              to="/countries/$iso"
              params={{ iso: c.iso_a3 }}
              className="panel-surface p-4 hover:border-primary/50"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">
                  {c.flag_emoji} {c.name}
                </span>
                <ImportanceBadge level={c.importance} />
              </div>
              <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                {c.why_this_matters}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
