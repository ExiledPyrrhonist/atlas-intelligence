import { cn } from "@/lib/utils";
import { importanceClass, confidenceClass } from "@/lib/atlas";

function Chip({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.08em]",
        className,
      )}
    >
      {children}
    </span>
  );
}


export function ImportanceBadge({ level }: { level: string }) {
  return <Chip className={importanceClass(level)}>{level}</Chip>;
}

export function ConfidenceBadge({ level }: { level: string }) {
  return <Chip className={confidenceClass(level)}>{level}</Chip>;
}

export function MetaChip({ children }: { children: React.ReactNode }) {
  return <Chip className="border-transparent bg-secondary text-muted-foreground">{children}</Chip>;
}

export function TagList({ tags }: { tags: string[] }) {
  if (!tags?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((t) => (
        <span
          key={t}
          className="rounded-full bg-secondary px-2.5 py-0.5 text-[11.5px] text-muted-foreground"
        >
          #{t}
        </span>
      ))}
    </div>
  );
}

export function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border-b border-border/40 py-2.5 last:border-0">
      <div className="label-hud">{label}</div>
      <div className="mt-1.5 text-sm leading-relaxed text-foreground">{value || "—"}</div>
    </div>
  );
}

export function SectionTitle({
  title,
  count,
  action,
}: {
  title: string;
  count?: number;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-[0.8125rem] font-semibold uppercase tracking-[0.1em] text-foreground/80">
        {title}
        {typeof count === "number" && (
          <span className="ml-2 font-normal text-muted-foreground">{count}</span>
        )}
      </h2>
      {action}
    </div>
  );
}


export function ListBlock({ items }: { items: string[] }) {
  if (!items?.length) return <p className="text-sm text-muted-foreground">No records.</p>;
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-foreground/90">
          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function WhyThisMatters({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="rounded-xl border border-signal/25 bg-signal/8 p-5">
      <div className="label-hud text-signal">Why this matters</div>
      <p className="mt-2 text-sm leading-relaxed text-foreground/90">{text}</p>
    </div>
  );
}


export function RatingBar({
  label,
  value,
  max = 10,
  suffix,
}: {
  label: string;
  value: number;
  max?: number;
  suffix?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="label-hud">{label}</span>
        <span className="font-mono text-sm text-foreground">
          {value}
          {suffix ?? `/${max}`}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
