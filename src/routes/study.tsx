import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Check, X, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { flashcardsQuery, reviewsQuery } from "@/lib/atlas";
import { insertRecord } from "@/lib/atlas-db";
import { SectionTitle } from "@/components/atlas/primitives";

export const Route = createFileRoute("/study")({
  head: () => ({
    meta: [
      { title: "Study Mode — Political Intelligence Atlas" },
      {
        name: "description",
        content:
          "Memorise the atlas: review political facts as flashcards, track accuracy and focus on weak categories.",
      },
      { property: "og:title", content: "Study Mode — Political Intelligence Atlas" },
      { property: "og:description", content: "Flashcard review over your own research database." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StudyPage,
});

type Card = {
  id: string;
  question: string;
  answer: string;
  category: string;
  difficulty: string;
  countries?: { name: string; flag_emoji: string } | null;
};

function StudyPage() {
  const qc = useQueryClient();
  const { data: cards = [] } = useQuery(flashcardsQuery);
  const { data: reviews = [] } = useQuery(reviewsQuery);

  const [category, setCategory] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [session, setSession] = useState({ correct: 0, total: 0 });

  const categories = useMemo(
    () => Array.from(new Set((cards as Card[]).map((c) => c.category))).filter(Boolean).sort(),
    [cards],
  );

  const deck = useMemo(
    () =>
      (cards as Card[]).filter(
        (c) =>
          (category === "all" || c.category === category) &&
          (difficulty === "all" || c.difficulty === difficulty),
      ),
    [cards, category, difficulty],
  );

  const card = deck[index % Math.max(deck.length, 1)];

  const record = useMutation({
    mutationFn: async (correct: boolean) => {
      if (!card) return;
      await insertRecord("flashcard_reviews", { flashcard_id: card.id, correct });
    },
    onSuccess: async (_d, correct) => {
      setSession((s) => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
      setRevealed(false);
      setIndex((i) => i + 1);
      await qc.invalidateQueries({ queryKey: ["flashcard_reviews"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const lifetime = useMemo(() => {
    const total = reviews.length;
    const correct = reviews.filter((r) => r.correct).length;
    return { total, correct, rate: total ? Math.round((correct / total) * 100) : 0 };
  }, [reviews]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-3 px-5 pb-8 pt-4 md:px-8 md:pt-5">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Study mode</h1>
        <p className="mt-0.5 max-w-3xl text-[13px] text-muted-foreground">
          Review the facts you have recorded in the atlas. Every answer is logged so accuracy is
          tracked over time.
        </p>
      </header>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Facts in deck", value: deck.length },
          { label: "Session accuracy", value: session.total ? `${Math.round((session.correct / session.total) * 100)}%` : "—" },
          { label: "Lifetime accuracy", value: lifetime.total ? `${lifetime.rate}%` : "—" },
        ].map((s) => (
          <div key={s.label} className="panel-surface p-3">
            <div className="label-hud">{s.label}</div>
            <div className="mt-1 font-mono text-xl text-primary">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setIndex(0);
            setRevealed(false);
          }}
          className="h-8 rounded-lg border border-input bg-background px-2 text-xs"
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={difficulty}
          onChange={(e) => {
            setDifficulty(e.target.value);
            setIndex(0);
            setRevealed(false);
          }}
          className="h-8 rounded-lg border border-input bg-background px-2 text-xs"
        >
          <option value="all">All difficulties</option>
          {["easy", "medium", "hard"].map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <button
          onClick={() => {
            setIndex(0);
            setRevealed(false);
            setSession({ correct: 0, total: 0 });
          }}
          className="flex h-8 items-center gap-1 rounded-lg border border-border/60 px-2 text-xs font-semibold uppercase tracking-[0.08em] hover:bg-accent"
        >
          <RotateCcw className="h-3 w-3" /> Restart session
        </button>
      </div>

      {!card ? (
        <div className="panel-surface p-6 text-center">
          <p className="text-sm text-muted-foreground">
            No facts match this filter yet.
          </p>
          <Link to="/facts" className="mt-2 inline-block text-sm text-primary hover:underline">
            Add facts to the library
          </Link>
        </div>
      ) : (
        <div className="panel-surface space-y-4 p-6">
          <div className="label-hud">
            {card.category || "general"} · {card.difficulty}
            {card.countries ? ` · ${card.countries.flag_emoji} ${card.countries.name}` : ""}
          </div>
          <p className="text-lg font-medium leading-snug">{card.question}</p>

          {revealed ? (
            <>
              <p className="whitespace-pre-line border-t border-border pt-4 text-sm leading-relaxed text-foreground/85">
                {card.answer}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={record.isPending}
                  onClick={() => record.mutate(true)}
                  className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-primary-foreground disabled:opacity-50"
                >
                  <Check className="h-3 w-3" /> I knew it
                </button>
                <button
                  disabled={record.isPending}
                  onClick={() => record.mutate(false)}
                  className="flex items-center gap-1 rounded-lg border border-border/60 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] hover:bg-accent disabled:opacity-50"
                >
                  <X className="h-3 w-3" /> Missed it
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => setRevealed(true)}
              className="rounded-lg border border-border/60 bg-secondary px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] hover:bg-accent"
            >
              Reveal answer
            </button>
          )}
        </div>
      )}

      <section>
        <SectionTitle title="Recent reviews" count={reviews.length} />
        <div className="space-y-1">
          {reviews.slice(0, 8).map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-1.5 text-[12.5px] text-muted-foreground"
            >
              <span>{new Date(r.reviewed_at).toLocaleString()}</span>
              <span className={r.correct ? "text-primary" : "text-destructive"}>
                {r.correct ? "correct" : "missed"}
              </span>
            </div>
          ))}
          {reviews.length === 0 && (
            <p className="text-sm text-muted-foreground">No reviews recorded yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
