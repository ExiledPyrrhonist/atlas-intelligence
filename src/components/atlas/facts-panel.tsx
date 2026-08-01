import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AnyRow } from "@/lib/atlas-db";
import { CollectionPanel } from "./collection-panel";
import { FLASHCARD_FIELDS } from "./entity-fields";
import type { FieldSpec } from "./record-editor";

type CardRow = AnyRow & { id: string };

/**
 * Facts / flashcards attached to a single entity. The same rows power Study Mode,
 * so a fact only ever exists once in the database.
 */
export function FactsPanel({
  column,
  entityId,
  title = "Facts & study material",
  extraFields = [],
}: {
  column: "country_id" | "figure_id" | "event_id" | "organization_id";
  entityId: string;
  title?: string;
  extraFields?: FieldSpec[];
}) {
  const { data: cards = [] } = useQuery({
    queryKey: ["flashcards", column, entityId],
    queryFn: async (): Promise<CardRow[]> => {
      const { data, error } = await supabase
        .from("flashcards")
        .select("*")
        .eq(column, entityId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as CardRow[];
    },
  });

  return (
    <CollectionPanel
      table="flashcards"
      title={title}
      addLabel="Add fact"
      rows={cards}
      fields={[...FLASHCARD_FIELDS, ...extraFields]}
      searchKeys={["question", "answer", "category", "tags"]}
      defaults={{ [column]: entityId }}
      renderRow={(c) => (
        <div>
          <div className="text-sm font-medium">{String(c["question"] ?? "")}</div>
          <p className="mt-1 whitespace-pre-line text-sm text-foreground/80">
            {String(c["answer"] ?? "")}
          </p>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            {String(c["category"] ?? "general")} · {String(c["difficulty"] ?? "medium")}
          </div>
        </div>
      )}
    />
  );
}
