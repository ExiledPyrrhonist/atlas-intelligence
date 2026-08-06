import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { updateRecord, parseCsv, parseLines, type AnyRow } from "@/lib/atlas-db";
import { parseParties } from "@/lib/atlas";
import { Field, SectionTitle, TagList, ListBlock } from "./primitives";

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "list"
  | "tags"
  | "parties"
  | "date";

export type FieldSpec = {
  key: string;
  label: string;
  /** Set for workflow-only fields that should not carry a citation. */
  noSource?: boolean;
  type?: FieldType;
  options?: readonly string[];
  optionLabels?: Record<string, string>;
  /** Select fields marked optional may be left empty (stored as null). */
  optional?: boolean;
  /** Value pre-filled when creating a new record. */
  defaultValue?: string;
  suffix?: string;
};

function toInput(spec: FieldSpec, value: unknown): string {
  switch (spec.type) {
    case "list":
      return Array.isArray(value) ? value.join("\n") : "";
    case "tags":
      return Array.isArray(value) ? value.join(", ") : "";
    case "parties":
      return parseParties(value)
        .map((p) => `${p.name} | ${p.ideology}`)
        .join("\n");
    default:
      return value === null || value === undefined ? "" : String(value);
  }
}

function fromInput(spec: FieldSpec, raw: string): unknown {
  if (spec.type === "select" && raw.trim() === "") return null;
  switch (spec.type) {
    case "list":
      return parseLines(raw);
    case "tags":
      return parseCsv(raw);
    case "number":
      return raw.trim() === "" ? 0 : Number(raw);
    case "date":
      return raw.trim() === "" ? null : raw;
    case "parties":
      return parseLines(raw).map((line) => {
        const [name, ideology = ""] = line.split("|");
        return { name: name.trim(), ideology: ideology.trim() };
      });
    default:
      return raw;
  }
}

function ViewValue({ spec, value }: { spec: FieldSpec; value: unknown }) {
  if (spec.type === "list") return <ListBlock items={(value as string[]) ?? []} />;
  if (spec.type === "tags") {
    const tags = (value as string[]) ?? [];
    return tags.length ? <TagList tags={tags} /> : <span>—</span>;
  }
  if (spec.type === "parties") {
    const parties = parseParties(value);
    if (!parties.length) return <span>—</span>;
    return (
      <ul className="space-y-1.5">
        {parties.map((p) => (
          <li key={p.name} className="text-sm">
            <span className="font-medium">{p.name}</span>
            {p.ideology && <span className="text-muted-foreground"> · {p.ideology}</span>}
          </li>
        ))}
      </ul>
    );
  }
  if (value === null || value === undefined || value === "") return <span>—</span>;
  return (
    <span className="whitespace-pre-line">
      {String(value)}
      {spec.suffix ? ` ${spec.suffix}` : ""}
    </span>
  );
}

export function EditableInput({
  spec,
  value,
  onChange,
}: {
  spec: FieldSpec;
  value: string;
  onChange: (v: string) => void;
}) {
  const base = "w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm";
  if (spec.type === "select") {
    return (
      <select className={base} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">— none —</option>
        {spec.options?.map((o) => (
          <option key={o} value={o}>
            {spec.optionLabels?.[o] ?? o}
          </option>
        ))}
      </select>
    );
  }
  if (spec.type === "textarea" || spec.type === "list" || spec.type === "parties") {
    return (
      <textarea
        className={base}
        rows={spec.type === "textarea" ? 4 : 3}
        value={value}
        placeholder={
          spec.type === "list"
            ? "One entry per line"
            : spec.type === "parties"
              ? "Party name | ideology (one per line)"
              : undefined
        }
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  return (
    <input
      className={base}
      type={spec.type === "number" ? "number" : spec.type === "date" ? "date" : "text"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

/**
 * Renders a section of a single database record in read mode, and turns every
 * field into an input when the user clicks Edit. Saving writes straight to the
 * database and invalidates every query so all pages reflect the new value.
 */
export function RecordEditor({
  table,
  record,
  fields,
  title,
  className,
}: {
  table: string;
  record: AnyRow & { id: string };
  fields: FieldSpec[];
  title: string;
  className?: string;
}) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});

  const start = () => {
    const next: Record<string, string> = {};
    for (const f of fields) next[f.key] = toInput(f, record[f.key]);
    setDraft(next);
    setEditing(true);
  };

  const save = useMutation({
    mutationFn: async () => {
      const values: AnyRow = {};
      for (const f of fields) values[f.key] = fromInput(f, draft[f.key] ?? "");
      await updateRecord(table, record.id, values);
    },
    onSuccess: async () => {
      setEditing(false);
      toast.success(`${title} saved`);
      await qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className={className ?? "panel-surface p-4"}>
      <SectionTitle
        title={title}
        action={
          editing ? (
            <div className="flex gap-1">
              <button
                onClick={() => setEditing(false)}
                className="flex items-center gap-1 rounded-lg border border-border/60 px-2 py-1 text-xs font-semibold uppercase tracking-[0.08em] hover:bg-accent"
              >
                <X className="h-3 w-3" /> Cancel
              </button>
              <button
                disabled={save.isPending}
                onClick={() => save.mutate()}
                className="flex items-center gap-1 rounded-lg bg-primary px-2 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-primary-foreground disabled:opacity-50"
              >
                <Check className="h-3 w-3" /> {save.isPending ? "Saving…" : "Save"}
              </button>
            </div>
          ) : (
            <button
              onClick={start}
              className="flex items-center gap-1 rounded-lg border border-border/60 bg-secondary px-2 py-1 text-xs font-semibold uppercase tracking-[0.08em] hover:bg-accent"
            >
              <Pencil className="h-3 w-3" /> Edit
            </button>
          )
        }
      />

      {editing ? (
        <div className="space-y-3">
          {fields.map((f) => (
            <div key={f.key}>
              <div className="label-hud mb-1">{f.label}</div>
              <EditableInput
                spec={f}
                value={draft[f.key] ?? ""}
                onChange={(v) => setDraft((d) => ({ ...d, [f.key]: v }))}
              />
            </div>
          ))}
        </div>
      ) : (
        <div>
          {fields.map((f) => (
            <Field key={f.key} label={f.label} value={<ViewValue spec={f} value={record[f.key]} />} />
          ))}
        </div>
      )}
    </section>
  );
}
