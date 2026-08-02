import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { notesQuery, formatDate } from "@/lib/atlas";
import { CollectionPanel } from "@/components/atlas/collection-panel";
import { ImportanceBadge, ConfidenceBadge, TagList } from "@/components/atlas/primitives";
import { CONFIDENCE_FIELD, IMPORTANCE_FIELD } from "@/components/atlas/entity-fields";
import type { FieldSpec } from "@/components/atlas/record-editor";

const NOTE_FIELDS: FieldSpec[] = [
  { key: "title", label: "Title" },
  { key: "category", label: "Category" },
  IMPORTANCE_FIELD,
  CONFIDENCE_FIELD,
  { key: "tags", label: "Tags (comma separated)", type: "tags" },
  { key: "body", label: "Main text", type: "textarea" },
];

export const Route = createFileRoute("/notes")({
  head: () => ({
    meta: [
      { title: "Research Notes — Political Intelligence Atlas" },
      {
        name: "description",
        content:
          "Personal research notebook across the whole atlas: searchable, categorised and tagged analyst notes.",
      },
      { property: "og:title", content: "Research Notes — Political Intelligence Atlas" },
      { property: "og:description", content: "Searchable analyst notebook for the whole atlas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NotesPage,
});

function NotesPage() {
  const { data: notes = [] } = useQuery(notesQuery());

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4 md:p-6">
      <header>
        <h1 className="text-2xl font-semibold">Research notes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every note in the workspace, including notes written on country, figure and event
          dossiers.
        </p>
      </header>

      <CollectionPanel
        table="research_notes"
        title="All notes"
        addLabel="New note"
        rows={notes as never[]}
        fields={NOTE_FIELDS}
        searchKeys={["title", "body", "category", "tags"]}
        defaults={{ entity_type: "workspace", entity_id: null }}
        renderRow={(n) => (
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-medium">{String(n["title"] ?? "")}</h2>
              <ImportanceBadge level={String(n["importance"] ?? "low")} />
              <ConfidenceBadge level={String(n["confidence"] ?? "unknown")} />
              <span className="rounded-sm border border-border/60 bg-secondary px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                {String(n["category"] ?? "general")}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                {String(n["entity_type"] ?? "workspace")}
              </span>
            </div>
            {n["body"] ? (
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground/85">
                {String(n["body"])}
              </p>
            ) : null}
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <TagList tags={(n["tags"] as string[]) ?? []} />
              <span className="font-mono text-[10px] text-muted-foreground">
                created {formatDate(String(n["created_at"] ?? "").slice(0, 10))} · edited{" "}
                {formatDate(String(n["updated_at"] ?? "").slice(0, 10))}
              </span>
            </div>
          </div>
        )}
      />
    </div>
  );
}
