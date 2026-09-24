import type { Config } from "@netlify/functions";
import Anthropic from "@anthropic-ai/sdk";
import { listBusinesses, createBusiness } from "../../lib/db";

const CITY = Netlify.env.get("OUTREACH_CITY") ?? "Tustin, CA";
const MAX_NEW_PER_RUN = 5;

const SYSTEM_PROMPT = `You are researching real local businesses for a freelance web DEVELOPER (not a designer) \
based in ${CITY} who is looking for outreach leads. He builds and fixes the functional/technical side of \
websites - carts, checkouts, bookings, backends, automation, integrations - on whatever platform a business \
already uses. He never pitches redesigns or visual/branding work.

Find real, currently-operating local businesses that have a genuine FUNCTIONAL or TECHNICAL gap: no website at \
all, a website that is broken/empty/unreachable, no working e-commerce or booking/ordering system where the \
business clearly needs one, or obvious dead/placeholder integration code left live. Do not flag purely \
aesthetic or design issues - an ugly-but-working site is not a lead. Verify each claim by actually checking \
the business's site (or confirming none exists) before including it. Never fabricate a business or a finding.

Return ONLY a JSON array (no prose, no markdown fences), each item shaped exactly like:
{"name": string, "category": string, "city": string, "address": string | null, "website": string | null, "gap_summary": string, "source_note": string}
gap_summary must be one honest sentence naming the specific functional/technical gap. source_note should say \
how you verified it (e.g. "site returns empty response, checked twice" or "no dedicated site found, only a Yelp listing").`;

const findLeadsDaily = async () => {
  const apiKey = Netlify.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY is not set - skipping run.");
    return;
  }

  const existing = await listBusinesses();
  const knownNames = existing.map((b) => b.name);

  const anthropic = new Anthropic({ apiKey });

  // Server-side web search tool. If Anthropic ships a newer dated tool
  // version by the time this runs, bump the type string to match.
  const response = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 8 }],
    messages: [
      {
        role: "user",
        content: `Find up to ${MAX_NEW_PER_RUN} new businesses in ${CITY} that fit the brief. Skip any of \
these already-tracked businesses: ${knownNames.length ? knownNames.join(", ") : "(none yet)"}.`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    console.error("No text response from Anthropic.");
    return;
  }

  let candidates: Array<{
    name: string;
    category?: string;
    city?: string;
    address?: string | null;
    website?: string | null;
    gap_summary: string;
    source_note?: string;
  }>;

  try {
    const match = textBlock.text.match(/\[[\s\S]*\]/);
    candidates = JSON.parse(match ? match[0] : textBlock.text);
  } catch (err) {
    console.error("Couldn't parse candidate JSON:", err, textBlock.text.slice(0, 500));
    return;
  }

  let inserted = 0;
  for (const c of candidates) {
    if (!c.name || knownNames.includes(c.name)) continue;
    await createBusiness({
      name: c.name,
      category: c.category ?? null,
      city: c.city ?? CITY,
      address: c.address ?? null,
      website: c.website ?? null,
      sourceNote: c.source_note ?? "auto-research",
      gapSummary: c.gap_summary,
      status: "new-lead",
    });
    inserted += 1;
  }

  console.log(`Lead research run: ${inserted} new businesses added.`);
};

export default findLeadsDaily;

export const config: Config = {
  schedule: "0 15 * * *",
};
