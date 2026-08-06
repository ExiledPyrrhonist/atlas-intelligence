import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, X, Check, Search } from "lucide-react";
import { toast } from "sonner";
import { insertRecord, updateRecord, deleteRecord, type AnyRow } from "@/lib/atlas-db";
import { EditableInput, type FieldSpec } from "./record-editor";
import { SectionTitle } from "./primitives";
import { FieldSourceControl } from "./source-picker";

function toInput(spec: FieldSpec, value: unknown): string {
  if (spec.type === "tags" || spec.type === "list") {
    return Array.isArray(value) ? value.join(spec.type === "tags" ? ", " : "\n") : "";
  }
  return value === null || value === undefined ? "" : String(value);
}

function fromInput(spec: FieldSpec, raw: string): unknown {
  if (spec.type === "select" && raw.trim() === "") return null;
  if (spec.type === "tags") return raw.split(",").map((v) => v.trim()).filter(Boolean);
  if (spec.type === "list") return raw.split("\n").map((v) => v.trim()).filter(Boolean);
  if (spec.type === "number") return raw.trim() === "" ? 0 : Number(raw);
  if (spec.type === "date") return raw.trim() === "" ? null : raw;
  return raw;
}

function buildDraft(fields: FieldSpec[], row?: AnyRow): Record<string, string> {
  const draft: Record<string, string> = {};
  for (const f of fields) {
    if (row) {
      draft[f.key] = toInput(f, row[f.key]);
      continue;
    }
    // New records pre-select the first option so required enum columns are never empty.
    draft[f.key] =
      f.defaultValue ?? (f.type === "select" && !f.optional ? (f.options?.[0] ?? "") : "");
  }
  return draft;
}

function FieldForm({
  fields,
  draft,
  setDraft,
  onCancel,
  onSave,
  saving,
  entityType,
  entityId,
}: {
  fields: FieldSpec[];
  draft: Record<string, string>;
  setDraft: (d: Record<string, string>) => void;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
  entityType?: string;
  entityId?: string;
}) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        {fields.map((f) => (
          <div
            key={f.key}
            className={f.type === "textarea" || f.type === "list" ? "md:col-span-2" : undefined}
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <div className="label-hud">{f.label}</div>
              {entityType && entityId && !f.noSource ? (
                <FieldSourceControl
                  entityType={entityType}
                  entityId={entityId}
                  fieldKey={f.key}
                  fieldLabel={f.label}
                />
              ) : null}
            </div>
            <EditableInput
              spec={f}
              value={draft[f.key] ?? ""}
              onChange={(v) => setDraft({ ...draft, [f.key]: v })}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          disabled={saving}
          onClick={onSave}
          className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-primary-foreground disabled:opacity-50"
        >
          <Check className="h-3 w-3" /> {saving ? "Saving…" : "Save"}
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1 rounded-lg border border-border/60 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] hover:bg-accent"
        >
          <X className="h-3 w-3" /> Cancel
        </button>
      </div>
    </div>
  );
}

/**
 * Generic add / edit / delete panel for a collection of database rows.
 * Every mutation writes to the database and invalidates all queries so that
 * the same value stays in sync everywhere it is displayed.
 */
export function CollectionPanel<T extends AnyRow & { id: string }>({
  table,
  title,
  rows,
  fields,
  defaults,
  renderRow,
  searchKeys,
  addLabel = "Add",
  onInsert,
  onDelete,
  deleteLabel = "Delete",
  sourceEntityType,
  highlightId,
}: {
  table: string;
  title: string;
  rows: T[];
  fields: FieldSpec[];
  defaults?: AnyRow;
  renderRow: (row: T) => React.ReactNode;
  searchKeys?: string[];
  addLabel?: string;
  onInsert?: (values: AnyRow) => Promise<void>;
  onDelete?: (row: T) => Promise<void>;
  deleteLabel?: string;
  /** Enables field level source attribution for the rows in this panel. */
  sourceEntityType?: string;
  /** Row rendered with a highlight ring (used when arriving from "View source"). */
  highlightId?: string;
}) {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q || !searchKeys?.length) return rows;
    return rows.filter((r) =>
      searchKeys.some((k) => {
        const v = r[k];
        const text = Array.isArray(v) ? v.join(" ") : String(v ?? "");
        return text.toLowerCase().includes(q);
      }),
    );
  }, [rows, search, searchKeys]);

  const values = () => {
    const out: AnyRow = { ...defaults };
    for (const f of fields) out[f.key] = fromInput(f, draft[f.key] ?? "");
    return out;
  };

  const create = useMutation({
    mutationFn: async () => {
      const v = values();
      return onInsert ? onInsert(v) : insertRecord(table, v);
    },
    onSuccess: async () => {
      setAdding(false);
      setDraft({});
      toast.success("Record added");
      await qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async (id: string) => updateRecord(table, id, values()),
    onSuccess: async () => {
      setEditingId(null);
      toast.success("Record saved");
      await qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (row: T) => (onDelete ? onDelete(row) : deleteRecord(table, row.id)),
    onSuccess: async () => {
      toast.success("Record removed");
      await qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section data-panel={table}>
      <SectionTitle
        title={title}
        count={rows.length}
        action={
          <button
            onClick={() => {
              setEditingId(null);
              setDraft(buildDraft(fields));
              setAdding((v) => !v);
            }}
            className="flex items-center gap-1 rounded-lg border border-border/60 bg-secondary px-2 py-1 text-xs font-semibold uppercase tracking-[0.08em] hover:bg-accent"
          >
            <Plus className="h-3 w-3" /> {adding ? "Cancel" : addLabel}
          </button>
        }
      />

      {searchKeys?.length ? (
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${title.toLowerCase()}…`}
            className="h-9 w-full rounded-lg border border-input bg-background pl-8 pr-2.5 text-[13px]"
          />
        </div>
      ) : null}

      {adding && (
        <div className="panel-surface mb-3 p-3">
          <FieldForm
            fields={fields}
            draft={draft}
            setDraft={setDraft}
            saving={create.isPending}
            onCancel={() => setAdding(false)}
            onSave={() => create.mutate()}
          />
        </div>
      )}

      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground">No records yet.</p>
        )}
        {filtered.map((row) => (
          <article
            key={row.id}
            id={`record-${row.id}`}
            className={
              highlightId === row.id
                ? "panel-surface p-3 ring-2 ring-primary"
                : "panel-surface p-3"
            }
          >
            {editingId === row.id ? (
              <FieldForm
                fields={fields}
                draft={draft}
                setDraft={setDraft}
                saving={update.isPending}
                entityType={sourceEntityType}
                entityId={row.id}
                onCancel={() => setEditingId(null)}
                onSave={() => update.mutate(row.id)}
              />
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">{renderRow(row)}</div>
                <div className="flex shrink-0 items-center gap-2">
                  {sourceEntityType ? (
                    <FieldSourceControl
                      entityType={sourceEntityType}
                      entityId={row.id}
                      fieldKey="record"
                      fieldLabel="Record"
                    />
                  ) : null}
                  <button
                    aria-label="Edit record"
                    onClick={() => {
                      setAdding(false);
                      setDraft(buildDraft(fields, row));
                      setEditingId(row.id);
                    }}
                    className="text-muted-foreground hover:text-primary"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    aria-label={deleteLabel}
                    onClick={() => remove.mutate(row)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
