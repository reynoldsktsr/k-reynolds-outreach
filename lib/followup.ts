import type { Business } from "@/lib/db";

export const FOLLOW_UP_DAYS = 7;

/**
 * A lead that's been contacted but has gone quiet for a while - worth a
 * nudge to follow up, rather than letting it sit forever in "contacted"
 * with nothing surfacing that. Pure/deterministic so it's easy to unit test.
 */
export function needsFollowUp(business: Pick<Business, "status" | "communications">, now: Date = new Date()): boolean {
  if (business.status !== "contacted") return false;

  const outbound = business.communications.filter((c) => c.direction === "outbound");
  if (outbound.length === 0) return false;

  const lastOutbound = outbound.reduce((latest, c) => (c.occurredAt > latest ? c.occurredAt : latest), outbound[0].occurredAt);
  const daysSince = (now.getTime() - new Date(lastOutbound).getTime()) / (1000 * 60 * 60 * 24);
  return daysSince >= FOLLOW_UP_DAYS;
}
