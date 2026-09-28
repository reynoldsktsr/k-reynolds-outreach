import Anthropic from "@anthropic-ai/sdk";
import type { Business } from "@/lib/db";

// With server-side tools like web_search, a response can carry several text
// blocks interleaved with tool use/results (e.g. "let me search for..." then
// later the real answer) - .find() on the first one silently grabs
// commentary instead of the final answer. Join every text block instead.
export function extractText(content: Anthropic.Messages.ContentBlock[]): string {
  return content
    .filter((b): b is Anthropic.Messages.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n\n");
}

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";

async function fetchSiteContent(url: string): Promise<{ ok: boolean; html: string; status: number }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const res = await fetch(url, { signal: controller.signal, headers: { "User-Agent": BROWSER_UA } });
    clearTimeout(timeout);
    const html = res.ok ? await res.text() : "";
    return { ok: res.ok, status: res.status, html };
  } catch {
    return { ok: false, html: "", status: 0 };
  }
}

function cleanHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 18000);
}

const NO_SITE_SYSTEM = `You are a technical consultant preparing a short written case for a freelance web DEVELOPER \
(not a designer) who is about to reach out to a local business. He builds and fixes the functional/technical \
side of websites - carts, checkouts, bookings, backends, automation, integrations - on whatever platform a \
business ends up using. He never pitches redesigns or visual/branding work, and this report should not \
recommend any either.

Write a short, concrete, business-facing report (250-400 words) explaining why this specific business would \
benefit from a functional website or online capability, grounded only in the facts given about them - never \
invent details you weren't given. Cover: what they're likely losing out on functionally (bookings, orders, \
being found at all), and 2-3 concrete, realistic next steps a developer could build for them. Plain language, \
no fluff, no bullet-point clichés, write like a person who has actually looked at their situation.`;

const STACK_ANALYSIS_SYSTEM = `You are a technical consultant preparing a short written stack analysis for a \
freelance web DEVELOPER (not a designer) who is about to pitch a local business. He builds and fixes the \
functional/technical side of websites - carts, checkouts, bookings, backends, automation, integrations - on \
whatever platform a business already uses. He never pitches redesigns or visual/branding work, so do not \
recommend any, even if the current site looks dated - only recommend functional/technical work.

You will be given the raw HTML of the business's live site. From it:
1. Identify the likely platform/stack (e.g. Shopify, WooCommerce/WordPress, Squarespace, Wix, custom-built) \
and name the concrete evidence for that guess (script sources, meta generator tags, class name conventions, \
etc). Say "can't tell from the markup" if there's genuinely no signal, rather than guessing.
2. Describe how any dynamic-looking features you can see (inventory listings, new-arrivals feeds, event \
calendars, etc) are most likely being populated/stored given the stack, and whether that looks manual or \
automated.
3. List 2-4 concrete, functional gaps or opportunities (e.g. no online checkout, manual inventory updates, no \
booking/scheduling, no integration between systems) - never aesthetic ones.
4. If the page includes a real contact email or phone number anywhere, end your report with a line exactly \
formatted "CONTACT_EMAIL: <email>" and/or "CONTACT_PHONE: <phone>" (each on its own line, omit whichever you \
didn't find). Do not fabricate one.

Write 250-400 words, plain language, grounded only in what's actually in the HTML.`;

export function extractContactMarkers(text: string): { content: string; email: string | null; phone: string | null } {
  const emailMatch = text.match(/^CONTACT_EMAIL:\s*(.+)$/m);
  const phoneMatch = text.match(/^CONTACT_PHONE:\s*(.+)$/m);
  const content = text
    .replace(/^CONTACT_EMAIL:.*$/m, "")
    .replace(/^CONTACT_PHONE:.*$/m, "")
    .trim();
  return {
    content,
    email: emailMatch ? emailMatch[1].trim() : null,
    phone: phoneMatch ? phoneMatch[1].trim() : null,
  };
}

export type AnalysisResult = {
  kind: "no-site-pitch" | "stack-analysis";
  content: string;
  extractedEmail: string | null;
  extractedPhone: string | null;
};

const CONTACT_DISCOVERY_SYSTEM = `You are researching public contact information for a specific local \
business, to support a freelance web developer's respectful, low-pressure outreach - never a mass-blast. \
Search for the business's Google Business Profile, Yelp listing, Facebook page, Instagram, or any local press/ \
directory mention. Only report what you can actually verify from search results - never invent an email, \
phone number, or owner/manager name, even a plausible-sounding one.

The lines below are the ONLY way anything you find reaches the system that uses it - a downstream program \
parses exactly these lines and nothing else. If you mention finding a phone number, name, or email in your \
summary but don't also put the literal value on its matching line, it is lost completely, as if you never \
found it. So: every time your search surfaces a phone number, email, or a person's name - even just a first \
name, even if you're not fully sure - write the actual value on its line. Never write a line that just says \
you found something without the value itself.

End your findings with these lines, in this exact format, each on its own line, omitting only ones you truly \
found nothing for:
CONTACT_EMAIL: <the literal email address>
CONTACT_PHONE: <the literal phone number>
CONTACT_NAME: <the literal name, even if it's only a first name>
CONFIDENCE: <one line: what you found, where, and how sure you are>

Before those lines, write 2-3 sentences summarizing what you searched and found (or didn't) - but repeat the \
actual values in the lines below regardless, since that's the part that gets used. Be honest if you came up \
empty - that's a valid, useful result too.`;

export type ContactDiscoveryResult = {
  summary: string;
  email: string | null;
  phone: string | null;
  name: string | null;
};

// e2e tests exercise the full generate -> review -> edit -> send UI flow
// without spending real Anthropic API credits or depending on live web
// search results - only ever set in the test runner's env.
const TEST_MODE = process.env.E2E_TEST_MODE === "1";

export async function discoverContact(business: Business): Promise<ContactDiscoveryResult> {
  if (TEST_MODE) {
    return {
      summary: `[test mode] Simulated contact search for ${business.name}.`,
      email: "test-contact@example.com",
      phone: "555-0100",
      name: "Test Contact",
    };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set.");
  const anthropic = new Anthropic({ apiKey });

  const response = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1000,
    system: CONTACT_DISCOVERY_SYSTEM,
    tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 6 }],
    messages: [
      {
        role: "user",
        content: `Business: ${business.name}
Category: ${business.category ?? "unknown"}
City: ${business.city ?? "unknown"}
Address: ${business.address ?? "unknown"}`,
      },
    ],
  });

  const rawText = extractText(response.content);

  const emailMatch = rawText.match(/^CONTACT_EMAIL:\s*(.+)$/m);
  const phoneMatch = rawText.match(/^CONTACT_PHONE:\s*(.+)$/m);
  const nameMatch = rawText.match(/^CONTACT_NAME:\s*(.+)$/m);
  const confidenceMatch = rawText.match(/^CONFIDENCE:\s*(.+)$/m);

  const summary = rawText
    .replace(/^CONTACT_EMAIL:.*$/m, "")
    .replace(/^CONTACT_PHONE:.*$/m, "")
    .replace(/^CONTACT_NAME:.*$/m, "")
    .replace(/^CONFIDENCE:.*$/m, "")
    .trim();

  return {
    summary: confidenceMatch ? `${summary}\n\n${confidenceMatch[0]}` : summary,
    email: emailMatch ? emailMatch[1].trim() : null,
    phone: phoneMatch ? phoneMatch[1].trim() : null,
    name: nameMatch ? nameMatch[1].trim() : null,
  };
}

const DEMO_SITES = [
  {
    label: "coffee shop",
    url: "https://k-reynolds-demo-coffee.netlify.app",
    // Deliberately no bare "shop"/"store" here - both are common enough as
    // the second word of an unrelated category ("barber shop", "repair
    // shop") that they'd win the match before a more specific keyword
    // further down the list ever gets checked. Specific retail nouns only.
    keywords: [
      "coffee", "cafe", "café", "bakery", "record", "music", "clothing", "jewelry", "jeweler", "florist",
      "flower", "retail", "furrier", "boutique", "gift", "toy", "toys", "books", "bookstore", "grocer",
      "grocery", "market", "pet", "hardware", "furniture", "vape", "smoke", "liquor", "wine", "deli",
    ],
  },
  {
    label: "restaurant",
    url: "https://k-reynolds-demo-restaurant.netlify.app",
    keywords: [
      "restaurant", "udon", "dining", "eatery", "bistro", "kitchen", "food", "pizza", "sushi", "taco",
      "grill", "diner", "bar", "pub", "brewery", "catering", "bbq", "noodle", "ramen",
    ],
  },
  {
    label: "salon/spa/booking",
    url: "https://k-reynolds-demo-booking.netlify.app",
    keywords: [
      "salon", "spa", "repair", "watch", "appointment", "massage", "barber", "fitness", "studio", "gym",
      "yoga", "nail", "nails", "tattoo", "cleaning", "landscaping", "landscaper", "lawn", "plumbing",
      "plumber", "electrician", "electrical", "hvac", "contractor",
      // Professional services genuinely need booking/scheduling more than a
      // storefront or a menu, so they fit this demo best of the three even
      // though it wasn't originally built with them in mind.
      "law", "legal", "attorney", "dental", "dentist", "doctor", "clinic", "medical", "therapy",
      "therapist", "counseling", "counselor", "accountant", "accounting", "tax", "consulting",
      "consultant", "realtor", "real estate", "insurance", "financial", "chiropractic", "chiropractor",
      "veterinary", "veterinarian", "photography", "photographer",
    ],
  },
] as const;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Word-boundary matching, not a plain substring check - "bar" as a
// standalone word should match "wine bar" but not "barber shop", and a
// plain .includes() can't tell those apart.
function matchesKeyword(haystack: string, keyword: string): boolean {
  return new RegExp(`\\b${escapeRegExp(keyword)}\\b`, "i").test(haystack);
}

export function pickDemoSite(category: string | null): { label: string; url: string; matched: boolean } {
  const haystack = category ?? "";
  for (const site of DEMO_SITES) {
    if (site.keywords.some((k) => matchesKeyword(haystack, k))) {
      return { label: site.label, url: site.url, matched: true };
    }
  }
  // No confident match - still show a demo (better than none), but callers
  // should treat this as a guess rather than a genuine fit. Defaults to the
  // commerce-flavored demo since most unclassified local businesses are
  // closer to "sell something" than the other two categories.
  return { label: DEMO_SITES[0].label, url: DEMO_SITES[0].url, matched: false };
}

const PITCH_EMAIL_SYSTEM = `You are a freelance web DEVELOPER (not a designer) writing a first-contact email \
to a local business you have not talked to before. You build and fix the functional/technical side of \
websites - carts, checkouts, bookings, backends, automation, integrations - on whatever platform fits, \
including standing up a whole web presence from scratch (Squarespace for something fast, or a custom site you \
host and manage long-term) for a business that has nothing yet. You never pitch a redesign of a site that \
already works.

This is not a mass-blast template. Write like you actually looked at their business and are talking to them \
directly, in a warm, low-pressure, first-person voice - never agency copy, never "Dear Business Owner." \
Address them by name only if a real name was given; otherwise use the business name naturally. Follow this \
shape, in your own words, not as literal headers:
1. Something specific you noticed about their business (grounded only in the facts you're given - never invent \
detail).
2. What you'd suggest, concretely.
3. How you'd help - mention it could be a fast, low-cost Squarespace-style setup or a custom build you'd host \
and manage for them long-term, whichever fits what you noticed. Frame this as a small, low-cost start to an \
ongoing relationship, not a big project.
4. A closing line inviting a real conversation to hear their side of it - not a hard close, not "let's hop on \
a call to discuss next steps."

{{DEMO_INSTRUCTION}}

Write it so it does NOT read as AI-written. Specifically:
- No em dashes, anywhere. Use a period, "and," or "but" instead.
- No "isn't X, it's Y" or "not just X, but Y" contrast constructions - that rhetorical balance is a dead \
giveaway. Just say the thing plainly.
- No stock hedges or closers: "I hope this finds you well," "I wanted to reach out," "just wanted to flag," \
"no pressure at all," "happy to hear," "circle back," "touch base," "don't hesitate to," "best regards." If \
you're about to write one of these, cut it or say it the way you'd actually say it out loud.
- Vary sentence length on purpose - a short sentence next to a longer one. Don't give every point the same \
tidy shape; real emails are a little uneven.
- Skip the perfectly parallel three-part lists. Say what you noticed, then move on - don't explain it three \
different ways.
- Contractions throughout (it's, don't, you're, that'll). Write like you're typing this quickly, not drafting \
a pitch deck.

Output as HTML, using only <p>, <strong>, <em>, <a href="...">, <ul>, <li> - short paragraphs, no headers, no \
inline styles, no markdown syntax like ** or _.

Output exactly two parts, in this order, nothing else:
SUBJECT: <subject line, plain text>
BODY:
<the email body, as HTML>`;

export async function generatePitchEmail(
  business: Business,
  analysisContent: string | null,
  contactName: string | null,
): Promise<{ subject: string; body: string }> {
  if (TEST_MODE) {
    const demoSite = pickDemoSite(business.category);
    return {
      subject: `[test mode] Quick note about ${business.name}`,
      body: `<p>[test mode] Simulated pitch email for ${business.name}. See <a href="${demoSite.url}">${demoSite.label} demo</a>.</p>`,
    };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set.");
  const anthropic = new Anthropic({ apiKey });

  const demoSite = pickDemoSite(business.category);
  const demoInstruction = demoSite.matched
    ? `Naturally include this example link once, where it fits: ${demoSite.url} - framed as "here's a quick \
example of what that could look like," not a hard sell.`
    : `You have one example site to show, ${demoSite.url}, but it's not a close match for this business's \
industry - it's just the kind of thing you build. Only mention it if it fits naturally, framed generally as \
"here's an example of the kind of site I build" rather than implying it looks like their business. It's fine \
to leave it out entirely if it would feel like a stretch.`;
  const system = PITCH_EMAIL_SYSTEM.replace("{{DEMO_INSTRUCTION}}", demoInstruction);

  const response = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 900,
    system,
    messages: [
      {
        role: "user",
        content: `Business: ${business.name}
Category: ${business.category ?? "unknown"}
City: ${business.city ?? "unknown"}
Contact name (use only if given): ${contactName ?? "not known - address the business itself"}
Website: ${business.website ?? "none - they don't have one yet"}

What was actually found about them:
${analysisContent ?? business.gapSummary ?? "No detailed analysis on file yet - keep this general but honest."}`,
      },
    ],
  });

  const rawText = extractText(response.content);

  const subjectMatch = rawText.match(/^SUBJECT:\s*(.+)$/m);
  const bodyMatch = rawText.match(/^BODY:\s*\n?([\s\S]*)$/m);

  return {
    subject: subjectMatch ? subjectMatch[1].trim() : `Quick note about ${business.name}`,
    body: bodyMatch ? bodyMatch[1].trim() : rawText.trim(),
  };
}

export async function analyzeBusiness(business: Business): Promise<AnalysisResult> {
  if (TEST_MODE) {
    return business.website
      ? {
          kind: "stack-analysis",
          content: `[test mode] Simulated stack analysis for ${business.name}.`,
          extractedEmail: null,
          extractedPhone: null,
        }
      : {
          kind: "no-site-pitch",
          content: `[test mode] Simulated no-site pitch report for ${business.name}.`,
          extractedEmail: null,
          extractedPhone: null,
        };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set.");
  const anthropic = new Anthropic({ apiKey });

  if (!business.website) {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1200,
      system: NO_SITE_SYSTEM,
      messages: [
        {
          role: "user",
          content: `Business: ${business.name}
Category: ${business.category ?? "unknown"}
City: ${business.city ?? "unknown"}
Known gap: ${business.gapSummary ?? "none on file"}
Source note: ${business.sourceNote ?? "none on file"}`,
        },
      ],
    });
    const text = extractText(response.content);
    return { kind: "no-site-pitch", content: text.trim(), extractedEmail: null, extractedPhone: null };
  }

  const fetched = await fetchSiteContent(business.website);
  const htmlForModel = fetched.ok
    ? cleanHtml(fetched.html)
    : `(Could not fetch the site - request failed or returned status ${fetched.status}.)`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1200,
    system: STACK_ANALYSIS_SYSTEM,
    messages: [
      {
        role: "user",
        content: `Business: ${business.name}
Category: ${business.category ?? "unknown"}
Website: ${business.website}

Raw HTML (may be truncated):
${htmlForModel}`,
      },
    ],
  });
  const rawText = extractText(response.content);
  const { content, email, phone } = extractContactMarkers(rawText);

  return { kind: "stack-analysis", content, extractedEmail: email, extractedPhone: phone };
}
