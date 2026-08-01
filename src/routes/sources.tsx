import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { sourcesQuery, formatDate } from "@/lib/atlas";
import { CollectionPanel } from "@/components/atlas/collection-panel";
import type { FieldSpec } from "@/components/atlas/record-editor";

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
    defaultValue: "news_article",
  },
  {
    key: "reliability",
    label: "Reliability",
    type: "select",
    options: ["high", "medium", "low"],
    defaultValue: "medium",
  },
  { key: "summary", label: "Summary", type: "textarea" },
  { key: "information_used", label: "Information used", type: "textarea" },
  { key: "notes", label: "Notes", type: "textarea" },
];

export const Route = createFileRoute("/sources")({
  head: () => ({
    meta: [
      { title: "Sources — Political Intelligence Atlas" },
      {
        name: "description",
        content:
          "Source library for the atlas: publishers, URLs, publication dates, reliability ratings and how each source was used.",
      },
      { property: "og:title", content: "Sources — Political Intelligence Atlas" },
      { property: "og:description", content: "Editable source library with reliability ratings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SourcesPage,
});

function SourcesPage() {
  const { data: sources = [] } = useQuery(sourcesQuery);

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4 md:p-6">
      <header>
        <h1 className="text-2xl font-semibold">Sources</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Central source library. Sources can be attached to any country, event or statistic.
        </p>
      </header>

      <CollectionPanel
        table="sources"
        title="Source library"
        addLabel="Add source"
        rows={sources as never[]}
        fields={SOURCE_FIELDS}
        searchKeys={["title", "publisher", "summary", "notes"]}
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
          </div>
        )}
      />
    </div>
  );
}
