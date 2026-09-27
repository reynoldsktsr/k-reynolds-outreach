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
