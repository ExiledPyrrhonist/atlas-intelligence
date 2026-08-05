import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AnyRow } from "@/lib/atlas-db";
import { CollectionPanel } from "./collection-panel";
import type { FieldSpec } from "./record-editor";

type StatRow = AnyRow & { id: string };

export function StatisticsPanel({ countryId }: { countryId: string }) {
  const { data: sources = [] } = useQuery({
    queryKey: ["sources"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sources").select("id, title").order("title");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: stats = [] } = useQuery({
    queryKey: ["country_statistics", countryId],
    queryFn: async (): Promise<StatRow[]> => {
      const { data, error } = await supabase
        .from("statistics")
        .select("*, sources(title)")
        .eq("country_id", countryId)
        .order("year", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as StatRow[];
    },
  });

  const fields: FieldSpec[] = [
    { key: "name", label: "Statistic name" },
    { key: "category", label: "Category" },
    { key: "value", label: "Value", type: "number" },
    { key: "unit", label: "Unit" },
    { key: "year", label: "Year", type: "number" },
    {
      key: "source_id",
      label: "Source",
      type: "select",
      optional: true,
      options: sources.map((s) => s.id),
      optionLabels: Object.fromEntries(sources.map((s) => [s.id, s.title])),
    },
    { key: "methodology", label: "Methodology / notes", type: "textarea" },
    { key: "why_this_matters", label: "Why this matters", type: "textarea" },
  ];

  const sourceTitle = (id: unknown) =>
    sources.find((s) => s.id === id)?.title ?? "—";

  return (
    <CollectionPanel
      table="statistics"
      title="Statistics"
      addLabel="Add statistic"
      rows={stats}
      fields={fields}
      searchKeys={["name", "category", "unit"]}
      defaults={{ country_id: countryId }}
      renderRow={(s) => (
        <div>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-sm font-medium">{String(s["name"] ?? "")}</span>
            <span className="font-mono text-sm text-primary">
              {Number(s["value"] ?? 0).toLocaleString()} {String(s["unit"] ?? "")}
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {String(s["category"] ?? "")} · {String(s["year"] ?? "")}
            </span>
          </div>
          <div className="mt-1 text-[13px] text-muted-foreground">
            source: {sourceTitle(s["source_id"])}
          </div>
          {s["methodology"] ? (
            <p className="mt-1 whitespace-pre-line text-[13px] text-muted-foreground">
              {String(s["methodology"])}
            </p>
          ) : null}
        </div>
      )}
    />
  );
}
