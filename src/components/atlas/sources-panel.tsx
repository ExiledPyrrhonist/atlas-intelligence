import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/atlas";
import { insertRecord, type AnyRow } from "@/lib/atlas-db";
import { CollectionPanel } from "./collection-panel";
import type { FieldSpec } from "./record-editor";

const SOURCE_FIELDS: FieldSpec[] = [
  { key: "title", label: "Title" },
  { key: "publisher", label: "Publisher" },
  { key: "url", label: "URL" },
  { key: "published_date", label: "Publication date", type: "date" },
  { key: "accessed_date", label: "Date accessed", type: "date" },
  {
    key: "source_type",
    label: "Source type",
    type: "select",
    options: [
      "government_report",
      "academic_paper",
      "news_article",
      "ngo_report",
      "think_tank",
      "database",
      "book",
    ],
  },
  {
    key: "reliability",
    label: "Reliability",
    type: "select",
    options: ["high", "medium", "low"],
  },
  { key: "notes", label: "Notes", type: "textarea" },
];

type SourceRow = AnyRow & { id: string };

export function SourcesPanel({
  entityType,
  entityId,
  title = "Sources",
}: {
  entityType: string;
  entityId: string;
  title?: string;
}) {
  const { data: sources = [] } = useQuery({
    queryKey: ["entity_sources", entityType, entityId],
    queryFn: async (): Promise<SourceRow[]> => {
      const { data, error } = await supabase
        .from("record_sources")
        .select("note, sources(*)")
        .eq("entity_id", entityId);
      if (error) throw error;
      return (data ?? [])
        .map((r) => r.sources)
        .filter(Boolean) as unknown as SourceRow[];
    },
  });

  return (
    <CollectionPanel
      table="sources"
      title={title}
      addLabel="Add source"
      rows={sources}
      fields={SOURCE_FIELDS}
      searchKeys={["title", "publisher", "notes"]}
      onInsert={async (values) => {
        const clean: AnyRow = { ...values };
        if (!clean["accessed_date"]) delete clean["accessed_date"];
        if (!clean["source_type"]) clean["source_type"] = "database";
        if (!clean["reliability"]) clean["reliability"] = "medium";
        const { data, error } = await supabase
          .from("sources")
          .insert(clean as never)
          .select("id")
          .single();
        if (error) throw new Error(error.message);
        await insertRecord("record_sources", {
          entity_type: entityType,
          entity_id: entityId,
          source_id: data.id,
        });
      }}
      onDelete={async (row) => {
        const { error } = await supabase
          .from("record_sources")
          .delete()
          .eq("entity_id", entityId)
          .eq("source_id", row.id);
        if (error) throw new Error(error.message);
      }}
      deleteLabel="Detach source"
      renderRow={(s) => (
        <div>
          <div className="text-sm font-medium">{String(s["title"] ?? "")}</div>
          <div className="text-xs text-muted-foreground">
            {String(s["publisher"] ?? "—")} · {String(s["source_type"] ?? "")} · reliability{" "}
            {String(s["reliability"] ?? "")}
          </div>
          {s["url"] ? (
            <a
              href={String(s["url"])}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block truncate text-xs text-primary hover:underline"
            >
              {String(s["url"])}
            </a>
          ) : null}
          <div className="mt-1 font-mono text-[10px] text-muted-foreground">
            published {formatDate((s["published_date"] as string) ?? null)} · accessed{" "}
            {formatDate((s["accessed_date"] as string) ?? null)}
          </div>
          {s["notes"] ? (
            <p className="mt-1 whitespace-pre-line text-xs text-muted-foreground">
              {String(s["notes"])}
            </p>
          ) : null}
        </div>
      )}
    />
  );
}
