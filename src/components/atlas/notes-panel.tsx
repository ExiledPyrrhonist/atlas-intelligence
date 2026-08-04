import { useQuery } from "@tanstack/react-query";
import { notesQuery, formatDate } from "@/lib/atlas";
import { ImportanceBadge, ConfidenceBadge, TagList } from "./primitives";
import { CollectionPanel } from "./collection-panel";
import { NOTE_CATEGORIES } from "@/lib/atlas";
import type { FieldSpec } from "./record-editor";

const NOTE_FIELDS: FieldSpec[] = [
  { key: "title", label: "Title" },
  {
    key: "category",
    label: "Category",
    type: "select",
    options: NOTE_CATEGORIES,
    defaultValue: "Politics",
  },
  {
    key: "importance",
    label: "Importance",
    type: "select",
    options: ["critical", "high", "medium", "low"],
    defaultValue: "medium",
  },
  {
    key: "confidence",
    label: "Confidence",
    type: "select",
    options: ["confirmed", "likely", "disputed", "unknown"],
    defaultValue: "likely",
  },
  { key: "tags", label: "Tags (comma separated)", type: "tags" },
  { key: "summary", label: "Summary", type: "textarea" },
  { key: "body", label: "Full note", type: "textarea" },
];

export function NotesPanel({
  entityType,
  entityId,
  title = "Research notes",
}: {
  entityType: string;
  entityId?: string;
  title?: string;
}) {
  const { data: notes = [] } = useQuery(notesQuery(entityType, entityId));

  return (
    <CollectionPanel
      table="research_notes"
      title={title}
      addLabel="New note"
      rows={notes}
      fields={NOTE_FIELDS}
      searchKeys={["title", "body", "category", "tags"]}
      defaults={{ entity_type: entityType, entity_id: entityId ?? null }}
      renderRow={(n) => (
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-medium">{n.title}</h3>
            <ImportanceBadge level={String(n.importance)} />
            <ConfidenceBadge level={String(n.confidence)} />
            <span className="rounded-sm border border-border/60 bg-secondary px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              {String(n.category ?? "general")}
            </span>
          </div>
          {n.summary ? (
            <p className="mt-1.5 text-sm text-foreground/85">{String(n.summary)}</p>
          ) : null}
          {n.body ? (
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground/85">
              {String(n.body)}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <TagList tags={(n.tags as string[]) ?? []} />
            <span className="font-mono text-[10px] text-muted-foreground">
              created {formatDate(String(n.created_at).slice(0, 10))} · edited{" "}
              {formatDate(String(n.updated_at).slice(0, 10))}
            </span>
          </div>
        </div>
      )}
    />
  );
}
