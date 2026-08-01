import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { flashcardsQuery } from "@/lib/atlas";
import { CollectionPanel } from "@/components/atlas/collection-panel";
import { FLASHCARD_FIELDS, useCountryField } from "@/components/atlas/entity-fields";

export const Route = createFileRoute("/facts")({
  head: () => ({
    meta: [
      { title: "Facts — Political Intelligence Atlas" },
      {
        name: "description",
        content:
          "Fact library of the atlas: question-and-answer knowledge units linked to countries, figures, events and organizations.",
      },
      { property: "og:title", content: "Facts — Political Intelligence Atlas" },
      { property: "og:description", content: "Editable fact library that powers Study Mode." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FactsPage,
});

function FactsPage() {
  const { data: cards = [] } = useQuery(flashcardsQuery);
  const countryField = useCountryField();

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4 md:p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Facts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            The single fact library behind Study Mode. Facts added on a country dossier appear here
            too.
          </p>
        </div>
        <Link
          to="/study"
          className="rounded border border-border bg-secondary px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] hover:bg-accent"
        >
          Start study session
        </Link>
      </header>

      <CollectionPanel
        table="flashcards"
        title="Fact library"
        addLabel="Add fact"
        rows={cards as never[]}
        fields={[...FLASHCARD_FIELDS, countryField]}
        searchKeys={["question", "answer", "category", "tags"]}
        renderRow={(c) => {
          const country = (c as Record<string, unknown>)["countries"] as
            | { name: string; iso_a3: string; flag_emoji: string }
            | null;
          return (
            <div>
              <div className="text-sm font-medium">{String(c["question"] ?? "")}</div>
              <p className="mt-1 whitespace-pre-line text-sm text-foreground/80">
                {String(c["answer"] ?? "")}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                <span>
                  {String(c["category"] ?? "general")} · {String(c["difficulty"] ?? "medium")}
                </span>
                {country ? (
                  <Link
                    to="/countries/$iso"
                    params={{ iso: country.iso_a3 }}
                    className="text-primary hover:underline"
                  >
                    {country.flag_emoji} {country.name}
                  </Link>
                ) : null}
              </div>
            </div>
          );
        }}
      />
    </div>
  );
}
