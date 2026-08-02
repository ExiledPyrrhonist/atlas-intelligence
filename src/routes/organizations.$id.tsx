import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RecordEditor } from "@/components/atlas/record-editor";
import { NotesPanel } from "@/components/atlas/notes-panel";
import { SourcesPanel } from "@/components/atlas/sources-panel";
import { FactsPanel } from "@/components/atlas/facts-panel";
import { ORG_FIELDS } from "@/components/atlas/entity-fields";
import {
  ImportanceBadge,
  SectionTitle,
  WhyThisMatters,
} from "@/components/atlas/primitives";

export const Route = createFileRoute("/organizations/$id")({
  head: () => ({
    meta: [
      { title: "Organization Profile — Political Intelligence Atlas" },
      {
        name: "description",
        content:
          "Organization profile: purpose, leadership, headquarters, member states, notes and sources.",
      },
      { property: "og:title", content: "Organization Profile — Political Intelligence Atlas" },
      { property: "og:description", content: "Editable dossier for an international organization." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OrgProfile,
  errorComponent: ({ error }) => (
    <p role="alert" className="p-6 text-sm text-destructive">
      {error.message}
    </p>
  ),
  notFoundComponent: () => (
    <p className="p-6 text-sm text-muted-foreground">Organization not found.</p>
  ),
});

function OrgProfile() {
  const { id } = Route.useParams();

  const { data: org, isLoading } = useQuery({
    queryKey: ["organization", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: members = [] } = useQuery({
    queryKey: ["organization_members", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organization_members")
        .select("membership_status, countries(id, name, iso_a3, flag_emoji)")
        .eq("organization_id", id);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) return <p className="p-6 text-sm text-muted-foreground">Loading organization…</p>;
  if (!org)
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">No organization found.</p>
        <Link to="/organizations" className="text-sm text-primary hover:underline">
          Back to organizations
        </Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      <header className="panel-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="label-hud">{org.org_type}</div>
            <h1 className="mt-1 text-2xl font-semibold">
              {org.name} {org.abbreviation ? <span className="text-primary">({org.abbreviation})</span> : null}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              HQ {org.headquarters || "—"} · {org.member_count} members
            </p>
          </div>
          <ImportanceBadge level={org.importance} />
        </div>
      </header>

      <WhyThisMatters text={org.why_this_matters} />

      <RecordEditor
        table="organizations"
        record={org as never}
        fields={ORG_FIELDS}
        title="Organization record"
      />

      <section>
        <SectionTitle title="Member states" count={members.length} />
        <div className="flex flex-wrap gap-2">
          {members.length === 0 && (
            <p className="text-sm text-muted-foreground">No member states recorded.</p>
          )}
          {members.map((m) =>
            m.countries ? (
              <Link
                key={m.countries.id}
                to="/countries/$iso"
                params={{ iso: m.countries.iso_a3 }}
                className="rounded border border-border/60 bg-secondary px-2 py-1 text-xs hover:border-primary/50"
              >
                {m.countries.flag_emoji} {m.countries.name} · {m.membership_status}
              </Link>
            ) : null,
          )}
        </div>
      </section>

      <FactsPanel column="organization_id" entityId={org.id} />
      <SourcesPanel entityType="organization" entityId={org.id} />
      <NotesPanel entityType="organization" entityId={org.id} />
    </div>
  );
}
