// Shared Supabase access for the website. Without the two environment
// variables the site still works; forms fall back to email or WhatsApp.
import type { SupabaseClient } from "@supabase/supabase-js";

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
export const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const backendEnabled = Boolean(supabaseUrl && supabaseKey);

let clientPromise: Promise<SupabaseClient> | undefined;

/** The Supabase library is only downloaded when a page needs it. */
export function client(): Promise<SupabaseClient> {
  clientPromise ??= import("@supabase/supabase-js").then((m) => m.createClient(supabaseUrl!, supabaseKey!));
  return clientPromise;
}

/** Visitors get a silent anonymous account the first time they submit
 *  something, so there is one rating per person and no sign-up form. */
export async function withSession(): Promise<SupabaseClient> {
  const db = await client();
  const { data } = await db.auth.getSession();
  if (!data.session) {
    const { error } = await db.auth.signInAnonymously();
    if (error) throw error;
  }
  return db;
}
