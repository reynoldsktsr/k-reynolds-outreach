import Anthropic from "@anthropic-ai/sdk";
// Relative imports, not the "@/" alias - this module is bundled both by
// Next.js (which resolves the alias) and by Netlify's separate Functions
// bundler for find-leads-daily.mts (which doesn't), so relative paths are
// the only form that works in both.
import { extractText } from "./analysis";
import { listBusinesses, createBusiness } from "./db";

const SYSTEM_PROMPT_TEMPLATE = (city: string) => `You are researching real local businesses for a freelance web \
DEVELOPER (not a designer) based in ${city} who is looking for outreach leads. He builds and fixes the \
functional/technical side of websites - carts, checkouts, bookings, backends, automation, integrations - on \
whatever platform a business already uses. He never pitches redesigns or visual/branding work.

Find real, currently-operating local businesses that have a genuine FUNCTIONAL or TECHNICAL gap: no website at \
all, a website that is broken/empty/unreachable, no working e-commerce or booking/ordering system where the \
business clearly needs one, or obvious dead/placeholder integration code left live. Do not flag purely \
aesthetic or design issues - an ugly-but-working site is not a lead. Verify each claim by actually checking \
the business's site (or confirming none exists) before including it. Never fabricate a business or a finding.

Return ONLY a JSON array (no prose, no markdown fences), each item shaped exactly like:
{"name": string, "category": string, "city": string, "address": string | null, "website": string | null, "gap_summary": string, "source_note": string}
gap_summary must be one honest sentence naming the specific functional/technical gap. source_note should say \
how you verified it (e.g. "site returns empty response, checked twice" or "no dedicated site found, only a Yelp listing").`;

type Candidate = {
  name: string;
  category?: string;
  city?: string;
  address?: string | null;
  website?: string | null;
  gap_summary: string;
  source_note?: string;
};

// Loose match on top of exact-string comparison - strips punctuation/casing/
// whitespace so "Joe's Coffee Shop" and "Joes Coffee Shop" (a near-identical
// spelling from a fresh research pass) count as the same business instead of
// creating a duplicate row.
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export async function runLeadResearch({
  apiKey,
  city,
  maxNew,
}: {
  apiKey: string;
  city: string;
  maxNew: number;
}): Promise<{ inserted: number; candidatesFound: number }> {
  // e2e tests exercise the on-demand "Run lead research now" button without
  // spending real Anthropic API credits or depending on live web search -
  // only ever set in the test runner's env. The scheduled Netlify function
  // never sets this, so the real daily research is unaffected.
  if (process.env.E2E_TEST_MODE === "1") {
    return { inserted: 0, candidatesFound: 0 };
  }

  const existing = await listBusinesses();
  const knownNames = existing.map((b) => b.name);
  const knownNormalized = new Set(knownNames.map(normalizeName));

  const anthropic = new Anthropic({ apiKey });

  const response = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 4000,
    system: SYSTEM_PROMPT_TEMPLATE(city),
    tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 8 }],
    messages: [
      {
        role: "user",
        content: `Find up to ${maxNew} new businesses in ${city} that fit the brief. Skip any of these \
already-tracked businesses: ${knownNames.length ? knownNames.join(", ") : "(none yet)"}.`,
      },
    ],
  });

  const text = extractText(response.content);
  if (!text) {
    throw new Error("No text response from Anthropic.");
  }

  let candidates: Candidate[];
  try {
    const match = text.match(/\[[\s\S]*\]/);
    candidates = JSON.parse(match ? match[0] : text);
  } catch (err) {
    throw new Error(`Couldn't parse candidate JSON: ${err instanceof Error ? err.message : String(err)}`);
  }

  let inserted = 0;
  for (const c of candidates) {
    if (!c.name) continue;
    const normalized = normalizeName(c.name);
    if (knownNormalized.has(normalized)) continue;
    knownNormalized.add(normalized);

    await createBusiness({
      name: c.name,
      category: c.category ?? null,
      city: c.city ?? city,
      address: c.address ?? null,
      website: c.website ?? null,
      sourceNote: c.source_note ?? "auto-research",
      gapSummary: c.gap_summary,
      status: "new-lead",
    });
    inserted += 1;
  }

  return { inserted, candidatesFound: candidates.length };
}
