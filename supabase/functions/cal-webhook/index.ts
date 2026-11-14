// Receives Cal.com booking webhooks and records them in public.bookings.
// Cal.com signs each request with the shared secret CAL_WEBHOOK_SECRET
// (header X-Cal-Signature-256 = hex HMAC-SHA256 of the raw body).
import { createClient } from "jsr:@supabase/supabase-js@2";

const secret = Deno.env.get("CAL_WEBHOOK_SECRET") ?? "";
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});

async function sign(body: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(mac), (b) => b.toString(16).padStart(2, "0")).join("");
}

function same(a: string, b: string) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method !== "POST") return json(405, { error: "POST only" });
  if (!secret) return json(500, { error: "CAL_WEBHOOK_SECRET is not set" });

  const body = await req.text();
  const given = (req.headers.get("x-cal-signature-256") ?? "").toLowerCase();
  if (!same(given, await sign(body))) return json(401, { error: "bad signature" });

  let event: { triggerEvent?: string; payload?: Record<string, unknown> };
  try {
    event = JSON.parse(body);
  } catch {
    return json(400, { error: "invalid JSON" });
  }
  if (event.triggerEvent === "PING" || !event.payload?.uid) return json(200, { ok: true, ignored: true });

  const { data, error } = await db.rpc("ingest_cal_booking", { p_event: event.triggerEvent, p: event.payload });
  if (error) {
    console.error("ingest_cal_booking failed", error.message);
    return json(500, { error: "could not record booking" });
  }
  return json(200, { ok: true, id: data });
});
