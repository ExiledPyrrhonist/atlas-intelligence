import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Check, ExternalLink, Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  createQuickSource,
  fieldSourcesQuery,
  setFieldSource,
  sourceOptionsQuery,
  type SourceLite,
} from "@/lib/field-sources";

const SOURCE_TYPES = [
  "government_report",
  "academic_paper",
  "news_article",
  "ngo_report",
  "think_tank",
  "database",
  "book",
] as const;

const inputCls =
  "h-7 w-full rounded-md border border-input bg-background px-2 text-[12.5px] outline-none focus:border-ring";

/**
 * Compact floating source editor for a single factual field.
 *
 * Shows the current attribution inline ("User Input" when nothing is attached)
 * and opens a small popover where the analyst can search existing sources,
 * create one in place, clear back to User Input, or jump to the Sources page
 * with the citation highlighted. A source is never required to save a value.
 */
export function FieldSourceControl({
  entityType,
  entityId,
  fieldKey,
  fieldLabel,
  className,
}: {
  entityType: string;
  entityId: string;
  fieldKey: string;
  fieldLabel: string;
  className?: string;
}) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const wrap = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({
    title: "",
    publisher: "",
    url: "",
    source_type: "news_article",
    reliability: "medium",
  });

  const { data: attached = {} } = useQuery(fieldSourcesQuery(entityType, entityId));
  const { data: sources = [] } = useQuery({ ...sourceOptionsQuery, enabled: open });
  const current: SourceLite | undefined = attached[fieldKey];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = q
      ? sources.filter((s) =>
          `${s.title} ${s.publisher ?? ""} ${s.url ?? ""}`.toLowerCase().includes(q),
        )
      : sources;
    return rows.slice(0, 40);
  }, [sources, query]);

  const attach = useMutation({
    mutationFn: async (sourceId: string | null) =>
      setFieldSource(entityType, entityId, fieldKey, sourceId),
    onSuccess: async (_d, sourceId) => {
      setOpen(false);
      setCreating(false);
      setQuery("");
      toast.success(sourceId ? "Source attached" : "Set to User Input");
      await qc.invalidateQueries({ queryKey: ["field_sources"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!draft.title.trim()) throw new Error("Source needs a title");
      const id = await createQuickSource(draft);
      await setFieldSource(entityType, entityId, fieldKey, id);
    },
    onSuccess: async () => {
      setOpen(false);
      setCreating(false);
      setDraft({
        title: "",
        publisher: "",
        url: "",
        source_type: "news_article",
        reliability: "medium",
      });
      toast.success("Source created and attached");
      await qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <span ref={wrap} className={cn("relative inline-flex", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={current ? `Source: ${current.title}` : "User Input — no source attached"}
        className={cn(
          "inline-flex max-w-[190px] items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11.5px] font-medium",
          current
            ? "border-primary/40 bg-primary/10 text-primary"
            : "border-border/60 bg-secondary text-muted-foreground hover:text-foreground",
        )}
      >
        <BookOpen className="h-3 w-3 shrink-0" />
        <span className="truncate">{current ? current.title : "User Input"}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-[290px] rounded-lg border border-border bg-popover p-2 text-popover-foreground shadow-xl">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Source · {fieldLabel}
            </span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close">
              <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
            </button>
          </div>

          {creating ? (
            <div className="space-y-1.5">
              <input
                autoFocus
                className={inputCls}
                placeholder="Title"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
              <input
                className={inputCls}
                placeholder="Publisher"
                value={draft.publisher}
                onChange={(e) => setDraft({ ...draft, publisher: e.target.value })}
              />
              <input
                className={inputCls}
                placeholder="URL"
                value={draft.url}
                onChange={(e) => setDraft({ ...draft, url: e.target.value })}
              />
              <div className="flex gap-1.5">
                <select
                  className={inputCls}
                  value={draft.source_type}
                  onChange={(e) => setDraft({ ...draft, source_type: e.target.value })}
                >
                  {SOURCE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
                <select
                  className={inputCls}
                  value={draft.reliability}
                  onChange={(e) => setDraft({ ...draft, reliability: e.target.value })}
                >
                  {["high", "medium", "low"].map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-1.5 pt-0.5">
                <button
                  type="button"
                  disabled={create.isPending}
                  onClick={() => create.mutate()}
                  className="flex flex-1 items-center justify-center gap-1 rounded-md bg-primary px-2 py-1 text-[11.5px] font-semibold text-primary-foreground disabled:opacity-50"
                >
                  <Check className="h-3 w-3" /> Save & attach
                </button>
                <button
                  type="button"
                  onClick={() => setCreating(false)}
                  className="rounded-md border border-border/60 px-2 py-1 text-[11.5px] font-semibold hover:bg-accent"
                >
                  Back
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search sources…"
                  className={cn(inputCls, "pl-7")}
                />
              </div>

              <div className="mt-1.5 max-h-44 overflow-auto">
                {results.length === 0 && (
                  <p className="px-1 py-2 text-[12px] text-muted-foreground">No matching sources.</p>
                )}
                {results.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => attach.mutate(s.id)}
                    className={cn(
                      "flex w-full items-start gap-1.5 rounded-md px-1.5 py-1 text-left hover:bg-accent",
                      current?.id === s.id && "bg-accent",
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] font-medium">{s.title}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {s.publisher || "—"} · {(s.source_type ?? "").replace(/_/g, " ")}
                      </span>
                    </span>
                    {current?.id === s.id && <Check className="mt-0.5 h-3 w-3 text-primary" />}
                  </button>
                ))}
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 border-t border-border/60 pt-1.5">
                <button
                  type="button"
                  onClick={() => setCreating(true)}
                  className="flex items-center gap-1 rounded-md border border-border/60 px-1.5 py-0.5 text-[11.5px] font-semibold hover:bg-accent"
                >
                  <Plus className="h-3 w-3" /> New source
                </button>
                <button
                  type="button"
                  onClick={() => attach.mutate(null)}
                  className="rounded-md border border-border/60 px-1.5 py-0.5 text-[11.5px] font-semibold hover:bg-accent"
                >
                  User Input
                </button>
                {current && (
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      void navigate({
                        to: "/sources",
                        search: { source: current.id } as never,
                      });
                    }}
                    className="ml-auto flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-1.5 py-0.5 text-[11.5px] font-semibold text-primary"
                  >
                    <ExternalLink className="h-3 w-3" /> View source
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </span>
  );
}
