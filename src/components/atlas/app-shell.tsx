import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Globe2,
  LayoutDashboard,
  Flag,
  Users,
  CalendarClock,
  Building2,
  BarChart3,
  BookMarked,
  NotebookPen,
  Lightbulb,
  GraduationCap,

  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { countriesQuery, eventsQuery, figuresQuery, organizationsQuery } from "@/lib/atlas";

const NAV = [
  { to: "/", label: "World Map", icon: Globe2, exact: true },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/countries", label: "Countries", icon: Flag },
  { to: "/people", label: "People", icon: Users },
  { to: "/events", label: "Events", icon: CalendarClock },
  { to: "/organizations", label: "Organizations", icon: Building2 },
  { to: "/statistics", label: "Statistics", icon: BarChart3 },
  { to: "/facts", label: "Facts", icon: Lightbulb },
  { to: "/sources", label: "Sources", icon: BookMarked },
  { to: "/notes", label: "Notes", icon: NotebookPen },
  { to: "/study", label: "Study Mode", icon: GraduationCap },
] as const;


function GlobalSearch() {
  const [term, setTerm] = useState("");
  const { data: countries = [] } = useQuery(countriesQuery);
  const { data: figures = [] } = useQuery(figuresQuery);
  const { data: events = [] } = useQuery(eventsQuery);
  const { data: orgs = [] } = useQuery(organizationsQuery);

  const results = useMemo(() => {
    const q = term.trim().toLowerCase();
    if (q.length < 2) return [];
    const out: { label: string; kind: string; to: string; params?: Record<string, string> }[] = [];
    countries
      .filter((c) => c.name.toLowerCase().includes(q) || c.iso_a3.toLowerCase().includes(q))
      .forEach((c) =>
        out.push({
          label: `${c.flag_emoji} ${c.name}`,
          kind: "Country",
          to: "/countries/$iso",
          params: { iso: c.iso_a3 },
        }),
      );
    figures
      .filter((f) => f.name.toLowerCase().includes(q) || f.position.toLowerCase().includes(q))
      .forEach((f) =>
        out.push({ label: f.name, kind: "Figure", to: "/people/$id", params: { id: f.id } }),
      );
    events
      .filter((e) => e.name.toLowerCase().includes(q))
      .forEach((e) =>
        out.push({ label: e.name, kind: "Event", to: "/events/$id", params: { id: e.id } }),
      );
    orgs
      .filter((o) => o.name.toLowerCase().includes(q) || o.abbreviation.toLowerCase().includes(q))
      .forEach((o) =>
        out.push({
          label: o.name,
          kind: "Organization",
          to: "/organizations/$id",
          params: { id: o.id },
        }),
      );
    return out.slice(0, 10);
  }, [term, countries, figures, events, orgs]);

  return (
    <div className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Search countries, figures, events, organizations…"
        className="h-10 w-full rounded-xl border border-border/70 bg-panel pl-10 pr-8 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring/70 focus:bg-card"
      />

      {term && (
        <button
          onClick={() => setTerm("")}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      {results.length > 0 && (
        <div className="absolute left-0 right-0 top-12 z-50 max-h-80 overflow-auto rounded-xl border border-border/70 bg-popover p-1 shadow-2xl">
          {results.map((r) => (
            <Link
              key={`${r.kind}-${r.label}`}
              to={r.to}
              params={r.params as never}
              onClick={() => setTerm("")}
              className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm hover:bg-accent"
            >
              <span className="truncate">{r.label}</span>
              <span className="label-hud shrink-0">{r.kind}</span>
            </Link>
          ))}
        </div>
      )}

    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-sidebar-border/70 bg-sidebar lg:flex">
        <div className="px-5 py-5">
          <div className="flex items-center gap-2.5">
            <Globe2 className="h-5 w-5 text-primary" />
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                Atlas
              </div>
              <div className="text-sm font-semibold leading-tight">Political Intelligence</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 pb-3">
          {NAV.map(({ to, label, icon: Icon, ...rest }) => {
            const exact = "exact" in rest && rest.exact;
            const active = exact ? pathname === to : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-[0.9375rem] transition-colors",
                  active
                    ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground",
                )}
              >
                <Icon className={cn("h-4 w-4", active && "text-primary")} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="px-5 py-4">
          <div className="label-hud">Classification</div>
          <div className="mt-1 font-mono text-[11px] text-signal">OSINT / UNCLASSIFIED</div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex flex-wrap items-center gap-3 border-b border-border/60 bg-background/85 px-5 py-3 backdrop-blur-md">
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <Globe2 className="h-5 w-5 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-[0.16em]">Atlas</span>
          </Link>
          <GlobalSearch />
          <div className="ml-auto hidden font-mono text-[11px] text-muted-foreground md:block">
            {new Date().toISOString().slice(0, 10)} · analyst workspace
          </div>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-border/60 bg-panel px-3 py-2 lg:hidden">
          {NAV.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
              activeProps={{ className: "bg-accent text-foreground" }}
            >
              {label}
            </Link>
          ))}
        </nav>


        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
