import { supabase } from "@/integrations/supabase/client";

/**
 * Loosely typed access layer used by the generic record editors.
 * The generated Supabase types are table-literal driven, which does not work
 * with the atlas' table-agnostic edit components.
 */
export type AnyRow = Record<string, unknown>;

type Result = Promise<{ error: { message: string } | null }>;

type LooseClient = {
  from(table: string): {
    insert(values: AnyRow): Result;
    update(values: AnyRow): { eq(column: string, value: string): Result };
    delete(): { eq(column: string, value: string): Result };
  };
};

const db = supabase as unknown as LooseClient;

export async function updateRecord(table: string, id: string, values: AnyRow) {
  const { error } = await db.from(table).update(values).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function insertRecord(table: string, values: AnyRow) {
  const { error } = await db.from(table).insert(values);
  if (error) throw new Error(error.message);
}

export async function deleteRecord(table: string, id: string) {
  const { error } = await db.from(table).delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Splits a comma separated input into a clean string array. */
export function parseCsv(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

/** Splits a multiline input into a clean string array. */
export function parseLines(value: string): string[] {
  return value
    .split("\n")
    .map((v) => v.trim())
    .filter(Boolean);
}
