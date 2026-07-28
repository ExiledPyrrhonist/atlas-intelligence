import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { notesQuery, formatDate } from "@/lib/atlas";
import { ImportanceBadge, ConfidenceBadge, SectionTitle, TagList } from "./primitives";

export function NotesPanel({
  entityType,
  entityId,
  title = "Research notes",
}: {
  entityType: string;
  entityId?: string;
  title?: string;
}) {
  const qc = useQueryClient();
  const query = notesQuery(entityType, entityId);
  const { data: notes = [] } = useQuery(query);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    body: "",
    importance: "medium",
    confidence: "likely",
    tags: "",
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("research_notes").insert({
        entity_type: entityType,
        entity_id: entityId ?? null,
        title: form.title.trim(),
        body: form.body.trim(),
        importance: form.importance as "critical" | "high" | "medium" | "low",
        confidence: form.confidence as "confirmed" | "likely" | "disputed" | "unknown",
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setForm({ title: "", body: "", importance: "medium", confidence: "likely", tags: "" });
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["research_notes"] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("research_notes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["research_notes"] }),
  });

  return (
    <section>
      <SectionTitle
        title={title}
        count={notes.length}
        action={
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1 rounded border border-border bg-secondary px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] hover:bg-accent"
          >
            <Plus className="h-3 w-3" /> {open ? "Cancel" : "New note"}
          </button>
        }
      />

      {open && (
        <div className="panel-surface mb-3 space-y-2 p-3">
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Note title"
            className="h-9 w-full rounded border border-input bg-background px-2 text-sm"
          />
          <textarea
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            placeholder="Assessment, indicators, collection gaps…"
            rows={4}
            className="w-full rounded border border-input bg-background p-2 text-sm"
          />
          <div className="flex flex-wrap gap-2">
            <select
              value={form.importance}
              onChange={(e) => setForm({ ...form, importance: e.target.value })}
              className="h-8 rounded border border-input bg-background px-2 text-xs"
            >
              {["critical", "high", "medium", "low"].map((i) => (
                <option key={i} value={i}>
                  Importance: {i}
                </option>
              ))}
            </select>
            <select
              value={form.confidence}
              onChange={(e) => setForm({ ...form, confidence: e.target.value })}
              className="h-8 rounded border border-input bg-background px-2 text-xs"
            >
              {["confirmed", "likely", "disputed", "unknown"].map((i) => (
                <option key={i} value={i}>
                  Confidence: {i}
                </option>
              ))}
            </select>
            <input
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="tags, comma separated"
              className="h-8 flex-1 rounded border border-input bg-background px-2 text-xs"
            />
            <button
              disabled={!form.title.trim() || create.isPending}
              onClick={() => create.mutate()}
              className="h-8 rounded bg-primary px-3 text-xs font-medium text-primary-foreground disabled:opacity-50"
            >
              {create.isPending ? "Saving…" : "Save note"}
            </button>
          </div>
          {create.isError && (
            <p className="text-xs text-destructive">Could not save the note. Try again.</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        {notes.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No analyst notes recorded yet for this record.
          </p>
        )}
        {notes.map((n) => (
          <article key={n.id} className="panel-surface p-3">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-medium">{n.title}</h3>
              <div className="flex shrink-0 items-center gap-1">
                <ImportanceBadge level={n.importance} />
                <ConfidenceBadge level={n.confidence} />
                <button
                  onClick={() => remove.mutate(n.id)}
                  aria-label="Delete note"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            {n.body && (
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground/85">
                {n.body}
              </p>
            )}
            <div className="mt-2 flex items-center justify-between gap-2">
              <TagList tags={n.tags} />
              <span className="font-mono text-[10px] text-muted-foreground">
                {formatDate(n.updated_at.slice(0, 10))}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
