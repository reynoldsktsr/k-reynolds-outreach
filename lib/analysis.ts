import Anthropic from "@anthropic-ai/sdk";
import type { Business } from "@/lib/db";

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

function extractContactMarkers(text: string): { content: string; email: string | null; phone: string | null } {
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

End your findings with these lines, using this exact format, omitting any you didn't find:
CONTACT_EMAIL: <email>
CONTACT_PHONE: <phone>
CONTACT_NAME: <owner or manager name, if a specific person is named anywhere>
CONFIDENCE: <one line: what you found, where, and how sure you are>

Before those lines, write 2-3 sentences summarizing what you searched and found (or didn't). Be honest if you \
came up empty - that's a valid, useful result.`;

export type ContactDiscoveryResult = {
  summary: string;
  email: string | null;
  phone: string | null;
  name: string | null;
};

export async function discoverContact(business: Business): Promise<ContactDiscoveryResult> {
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

  const textBlock = response.content.find((b) => b.type === "text");
  const rawText = textBlock?.type === "text" ? textBlock.text : "";

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
    keywords: ["coffee", "cafe", "café", "bakery", "record", "music", "clothing", "jewel", "florist", "flower", "retail", "furrier", "shop", "store"],
  },
  {
    label: "restaurant",
    url: "https://k-reynolds-demo-restaurant.netlify.app",
    keywords: ["restaurant", "udon", "dining", "eatery", "bistro", "kitchen", "food"],
  },
  {
    label: "salon/spa/booking",
    url: "https://k-reynolds-demo-booking.netlify.app",
    keywords: ["salon", "spa", "repair", "watch", "appointment", "massage", "barber", "fitness", "studio"],
  },
] as const;

export function pickDemoSite(category: string | null): { label: string; url: string } {
  const haystack = (category ?? "").toLowerCase();
  for (const site of DEMO_SITES) {
    if (site.keywords.some((k) => haystack.includes(k))) {
      return { label: site.label, url: site.url };
    }
  }
  // Default to the commerce-flavored demo - most local businesses are
  // closer to "sell something" than the other two categories.
  return { label: DEMO_SITES[0].label, url: DEMO_SITES[0].url };
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

Naturally include this example link once, where it fits: {{DEMO_URL}} - framed as "here's a quick example of \
what that could look like," not a hard sell.

Output exactly two parts, in this order, nothing else:
SUBJECT: <subject line>
BODY:
<the email body>`;

export async function generatePitchEmail(
  business: Business,
  analysisContent: string | null,
  contactName: string | null,
): Promise<{ subject: string; body: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set.");
  const anthropic = new Anthropic({ apiKey });

  const demoSite = pickDemoSite(business.category);
  const system = PITCH_EMAIL_SYSTEM.replace("{{DEMO_URL}}", demoSite.url);

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

  const textBlock = response.content.find((b) => b.type === "text");
  const rawText = textBlock?.type === "text" ? textBlock.text : "";

  const subjectMatch = rawText.match(/^SUBJECT:\s*(.+)$/m);
  const bodyMatch = rawText.match(/^BODY:\s*\n?([\s\S]*)$/m);

  return {
    subject: subjectMatch ? subjectMatch[1].trim() : `Quick note about ${business.name}`,
    body: bodyMatch ? bodyMatch[1].trim() : rawText.trim(),
  };
}

export async function analyzeBusiness(business: Business): Promise<AnalysisResult> {
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
    const textBlock = response.content.find((b) => b.type === "text");
    const text = textBlock?.type === "text" ? textBlock.text : "";
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
  const textBlock = response.content.find((b) => b.type === "text");
  const rawText = textBlock?.type === "text" ? textBlock.text : "";
  const { content, email, phone } = extractContactMarkers(rawText);

  return { kind: "stack-analysis", content, extractedEmail: email, extractedPhone: phone };
}
