import { NextRequest, NextResponse } from "next/server";
import { listBusinesses, createBusiness } from "@/lib/db";

// One-time seed of real, verified research (Old Town Tustin, checked
// directly - see the Local Outreach Playbook for the full method/caveats).
// Protected by the same interim shared secret as the rest of the app.
const SEED_BUSINESSES = [
  {
    name: "Rasta-Cowboy Records",
    category: "Record shop",
    address: "155 E. Main St",
    website: null,
    gapSummary: "No working website - the domain resolves to a dead placeholder page linking to an unrelated 'CyndirAI' page.",
    sourceNote: "4.8 stars / 69 reviews confirm an active, well-regarded business with no real site.",
  },
  {
    name: "Grace Music & Violin Shop",
    category: "Music shop",
    address: "130 W. Main St",
    website: null,
    gapSummary: "No dedicated website found anywhere, despite being established since 1990.",
    sourceNote: "Checked directory listings and general search - no dedicated site found.",
  },
  {
    name: "Tsurukawa Udon",
    category: "Restaurant",
    address: "The District at Tustin Legacy",
    website: null,
    gapSummary: "No dedicated website - only an Instagram account and aggregator listings (Yelp, etc.).",
    sourceNote: "Checked directory listings and general search - no dedicated site found.",
  },
  {
    name: "Blondies Style",
    category: "Clothing store",
    address: "155 El Camino Real",
    website: "https://blondiesstyle.com",
    gapSummary: "Site returns completely empty content on repeated automated fetch attempts, despite being established since 1983.",
    sourceNote: "Confirmed empty response on two separate automated fetch attempts.",
  },
  {
    name: "Johnny Jeans",
    category: "Clothing store",
    website: "https://clothingstoretustinca.com",
    gapSummary: "No e-commerce; a visible, unrendered {{placeholder_retargeting_pixel}} template tag is left live on the site.",
    sourceNote: "Confirmed via direct page fetch - template placeholder text renders on the live page.",
  },
  {
    name: "Time Palace Jewelers",
    category: "Jewelry / watch repair",
    website: "https://1stwatchrepair.com",
    gapSummary: "No booking or e-commerce functionality on the site.",
    sourceNote: "Confirmed via direct page fetch.",
  },
  {
    name: "Saddleback Flower Shop",
    category: "Florist",
    website: "https://saddlebackflowershop.net",
    gapSummary: "Site returns HTTP 403 to automated checks - couldn't verify further remotely, needs an in-person look.",
    sourceNote: "Confirmed 403 response on automated fetch. Verify in person before pitching.",
    status: "new-lead",
  },
  {
    name: "Surfas Ltd. Furriers",
    category: "Furrier",
    website: "https://surfasltdfurriers.com",
    gapSummary: "Domain permanently redirects to a different business (calfurandleather.com) - possible closure or rebrand, needs verification.",
    sourceNote: "Confirmed redirect via direct fetch. Verify the business still operates under this name before pitching.",
  },
  {
    name: "Main Street Men's Clothing",
    category: "Clothing store",
    address: "148 W. Main St",
    website: null,
    gapSummary: "No dedicated website, and an August 2025 Facebook post said 'Saturday will be the last day' - possible closure, needs verification.",
    sourceNote: "No site found in search; closure risk flagged from a public Facebook post. Verify the business is still open before pitching.",
  },
];

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-seed-secret");
  if (!process.env.OUTREACH_PASSWORD || secret !== process.env.OUTREACH_PASSWORD) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const existing = await listBusinesses();
  const existingNames = new Set(existing.map((b) => b.name));

  let created = 0;
  const skipped: string[] = [];

  for (const b of SEED_BUSINESSES) {
    if (existingNames.has(b.name)) {
      skipped.push(b.name);
      continue;
    }
    await createBusiness({
      name: b.name,
      category: b.category,
      city: "Tustin, CA",
      address: b.address ?? null,
      website: b.website,
      gapSummary: b.gapSummary,
      sourceNote: b.sourceNote,
      status: "new-lead",
    });
    created += 1;
  }

  return NextResponse.json({ created, skipped });
}
