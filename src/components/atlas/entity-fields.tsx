import { useQuery } from "@tanstack/react-query";
import { countriesQuery } from "@/lib/atlas";
import type { FieldSpec } from "./record-editor";

/** Shared country picker options so country links are never duplicated data. */
export function useCountryField(
  key = "country_id",
  label = "Country",
  optional = true,
): FieldSpec {
  const { data: countries = [] } = useQuery(countriesQuery);
  return {
    key,
    label,
    type: "select",
    optional,
    options: countries.map((c) => c.id),
    optionLabels: Object.fromEntries(countries.map((c) => [c.id, `${c.flag_emoji} ${c.name}`])),
  };
}

export const IMPORTANCE_FIELD: FieldSpec = {
  key: "importance",
  label: "Importance",
  type: "select",
  options: ["critical", "high", "medium", "low"],
  defaultValue: "medium",
};

export const CONFIDENCE_FIELD: FieldSpec = {
  key: "confidence",
  label: "Confidence",
  type: "select",
  options: ["confirmed", "likely", "disputed", "unknown"],
  defaultValue: "likely",
};

export const FIGURE_FIELDS: FieldSpec[] = [
  { key: "name", label: "Name" },
  { key: "position", label: "Position" },
  { key: "party", label: "Party" },
  { key: "ideology", label: "Ideology" },
  { key: "in_office_since", label: "In office since" },
  IMPORTANCE_FIELD,
  CONFIDENCE_FIELD,
  { key: "biography", label: "Biography", type: "textarea" },
  { key: "important_actions", label: "Important actions (one per line)", type: "list" },
  { key: "why_this_matters", label: "Why this matters", type: "textarea" },
  { key: "tags", label: "Tags (comma separated)", type: "tags" },
];

export const EVENT_FIELDS: FieldSpec[] = [
  { key: "name", label: "Event name" },
  { key: "event_date", label: "Date", type: "date" },
  { key: "end_date", label: "End date", type: "date" },
  { key: "location", label: "Location" },
  {
    key: "event_type",
    label: "Event type",
    type: "select",
    options: [
      "election",
      "protest",
      "revolution",
      "coup",
      "war",
      "treaty",
      "crisis",
      "sanction",
      "referendum",
    ],
    defaultValue: "crisis",
  },
  IMPORTANCE_FIELD,
  CONFIDENCE_FIELD,
  { key: "summary", label: "Summary", type: "textarea" },
  { key: "causes", label: "Causes", type: "textarea" },
  { key: "consequences", label: "Consequences", type: "textarea" },
  { key: "key_actors", label: "Key actors (one per line)", type: "list" },
  { key: "why_this_matters", label: "Why this matters", type: "textarea" },
  { key: "tags", label: "Tags (comma separated)", type: "tags" },
];

export const ORG_FIELDS: FieldSpec[] = [
  { key: "name", label: "Name" },
  { key: "abbreviation", label: "Abbreviation" },
  { key: "org_type", label: "Type" },
  { key: "founded", label: "Founded", type: "date" },
  { key: "headquarters", label: "Headquarters" },
  { key: "member_count", label: "Members", type: "number" },
  { key: "website", label: "Website" },
  IMPORTANCE_FIELD,
  { key: "purpose", label: "Purpose", type: "textarea" },
  { key: "leaders", label: "Leaders (one per line)", type: "list" },
  { key: "why_this_matters", label: "Why this matters", type: "textarea" },
  { key: "tags", label: "Tags (comma separated)", type: "tags" },
];

export const FLASHCARD_FIELDS: FieldSpec[] = [
  { key: "question", label: "Fact / question", type: "textarea" },
  { key: "answer", label: "Answer", type: "textarea" },
  { key: "category", label: "Category" },
  {
    key: "difficulty",
    label: "Difficulty",
    type: "select",
    options: ["easy", "medium", "hard"],
    defaultValue: "medium",
  },
  { key: "tags", label: "Tags (comma separated)", type: "tags" },
];
