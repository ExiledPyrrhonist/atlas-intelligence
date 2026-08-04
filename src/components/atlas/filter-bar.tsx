import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";

export type SelectFilter = {
  key: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
};

function FilterSelect({ filter }: { filter: SelectFilter }) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="label-hud">{filter.label}</span>
      <select
        value={filter.value}
        onChange={(e) => filter.onChange(e.target.value)}
        className="h-8 w-full rounded-lg border border-input bg-background px-2 text-xs"
      >
        {filter.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * Compact filter strip shared by the Notes and Statistics databases.
 * Primary filters stay visible; secondary filters live behind a toggle so the
 * list itself keeps most of the screen.
 */
export function FilterBar({
  search,
  onSearch,
  placeholder = "Search…",
  filters,
  advanced,
  resultCount,
  onReset,
}: {
  search: string;
  onSearch: (v: string) => void;
  placeholder?: string;
  filters: SelectFilter[];
  advanced?: React.ReactNode;
  resultCount: number;
  onReset?: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="panel-surface space-y-3 p-3">
      <div className="flex flex-wrap items-end gap-2">
        <label className="relative min-w-[200px] flex-1 flex-col gap-1">
          <span className="label-hud">Search</span>
          <span className="relative mt-1 block">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder={placeholder}
              className="h-8 w-full rounded-lg border border-input bg-background pl-7 pr-2 text-xs"
            />
          </span>
        </label>

        {filters.map((f) => (
          <div key={f.key} className="w-[150px] shrink-0">
            <FilterSelect filter={f} />
          </div>
        ))}

        {advanced ? (
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-border/60 bg-secondary px-2.5 text-xs hover:bg-accent"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {open ? "Hide filters" : "More filters"}
          </button>
        ) : null}
      </div>

      {open && advanced ? <div className="border-t border-border/50 pt-3">{advanced}</div> : null}

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{resultCount} matching records</span>
        {onReset ? (
          <button onClick={onReset} className="hover:text-foreground">
            Reset filters
          </button>
        ) : null}
      </div>
    </div>
  );
}
