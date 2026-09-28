import type { Config } from "@netlify/functions";
import { runLeadResearch } from "../../lib/lead-research";

const CITY = Netlify.env.get("OUTREACH_CITY") ?? "Tustin, CA";
const MAX_NEW_PER_RUN = 5;

const findLeadsDaily = async () => {
  const apiKey = Netlify.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY is not set - skipping run.");
    return;
  }

  try {
    const { inserted, candidatesFound } = await runLeadResearch({ apiKey, city: CITY, maxNew: MAX_NEW_PER_RUN });
    console.log(`Lead research run: ${inserted} new businesses added (${candidatesFound} candidates returned).`);
  } catch (err) {
    console.error("Lead research run failed:", err instanceof Error ? err.message : err);
  }
};

export default findLeadsDaily;

export const config: Config = {
  schedule: "0 15 * * *",
};
