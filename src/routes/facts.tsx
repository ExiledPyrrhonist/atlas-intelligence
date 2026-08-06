import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { flashcardsQuery, countriesQuery } from "@/lib/atlas";
import { supabase } from "@/integrations/supabase/client";
import { CollectionPanel } from "@/components/atlas/collection-panel";
import { FilterBar, type SelectFilter } from "@/components/atlas/filter-bar";
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

const FACT_CATEGORIES = [
  "Government",
  "Economy",
  "Demographics",
  "Military",
  "Geography",
  "History",
  "Society",
  "International Relations",
] as const;

const factSourcesQuery = {
  queryKey: ["record_sources", "flashcard"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("record_sources")
      .select("entity_id")
      .eq("entity_type", "flashcard");
    if (error) throw error;
    return data ?? [];
  },
};

function FactsPage() {
  const { data: cards = [] } = useQuery(flashcardsQuery);
  const { data: countries = [] } = useQuery(countriesQuery);
  const { data: sourced = [] } = useQuery(factSourcesQuery);
  const countryField = useCountryField();

  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("all");
  const [category, setCategory] = useState("all");
  const [sourceStatus, setSourceStatus] = useState("all");
  const [sort, setSort] = useState("created");

  const sourcedIds = useMemo(
    () => new Set(sourced.map((s) => String(s.entity_id))),
    [sourced],
  );

  const categories = useMemo(() => {
    const set = new Set<string>(FACT_CATEGORIES);
    for (const c of cards) if (c.category) set.add(String(c.category));
    return [...set].sort();
  }, [cards]);

  /** Source status is derived: linked source → verified, otherwise user input. */
  const statusOf = (id: string, answer: string) => {
    if (sourcedIds.has(id)) return "Verified Source";
    return answer?.trim() ? "User Input" : "Missing Source";
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = cards.filter((c) => {
      if (q) {
        const hay = [c.question, c.answer, c.category, ...(c.tags ?? [])].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (country !== "all" && c.country_id !== country) return false;
      if (category !== "all" && c.category !== category) return false;
      if (sourceStatus !== "all" && statusOf(c.id, String(c.answer ?? "")) !== sourceStatus)
        return false;
      return true;
    });
    return [...rows].sort((a, b) => {
      if (sort === "alpha") return String(a.question).localeCompare(String(b.question));
      return String(b.created_at).localeCompare(String(a.created_at));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards, search, country, category, sourceStatus, sort, sourcedIds]);

  const opt = (allLabel: string, items: { value: string; label: string }[]) => [
    { value: "all", label: allLabel },
    ...items,
  ];

  const filters: SelectFilter[] = [
    {
      key: "country",
      label: "Country",
      value: country,
      onChange: setCountry,
      options: opt(
        "All countries",
        countries.map((c) => ({ value: c.id, label: `${c.flag_emoji} ${c.name}` })),
      ),
    },
    {
      key: "category",
      label: "Category",
      value: category,
      onChange: setCategory,
      options: opt(
        "All categories",
        categories.map((c) => ({ value: c, label: c })),
      ),
    },
    {
      key: "sourceStatus",
      label: "Source status",
      value: sourceStatus,
      onChange: setSourceStatus,
      options: opt(
        "Any source status",
        ["Verified Source", "User Input", "Missing Source"].map((s) => ({ value: s, label: s })),
      ),
    },
    {
      key: "sort",
      label: "Sort",
      value: sort,
      onChange: setSort,
      options: [
        { value: "created", label: "Recently added" },
        { value: "updated", label: "Recently updated" },
        { value: "alpha", label: "Alphabetical" },
      ],
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-3 px-5 pb-8 pt-4 md:px-8 md:pt-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Facts</h1>
          <p className="mt-0.5 max-w-3xl text-[13px] text-muted-foreground">
            The single fact library behind Study Mode. Facts added on a country dossier appear here
            too.
          </p>
        </div>
        <Link
          to="/study"
          className="rounded-lg border border-border/60 bg-secondary px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] hover:bg-accent"
        >
          Start study session
        </Link>
      </header>

      <FilterBar
        search={search}
        onSearch={setSearch}
        placeholder="Search facts…"
        filters={filters}
        resultCount={filtered.length}
        onReset={() => {
          setSearch("");
          setCountry("all");
          setCategory("all");
          setSourceStatus("all");
          setSort("created");
        }}
      />

      <CollectionPanel
        table="flashcards"
      sourceEntityType="flashcards"
        title="Fact library"
        addLabel="Add fact"
        rows={filtered as never[]}
        fields={[...FLASHCARD_FIELDS, countryField]}
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
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                <span>
                  {String(c["category"] ?? "general")} · {String(c["difficulty"] ?? "medium")}
                </span>
                <span>{statusOf(String(c["id"]), String(c["answer"] ?? ""))}</span>
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
