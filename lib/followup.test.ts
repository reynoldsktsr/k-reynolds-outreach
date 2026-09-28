import { describe, it, expect } from "vitest";
import { needsFollowUp, FOLLOW_UP_DAYS } from "./followup";
import type { Business, Communication } from "./db";

const NOW = new Date("2026-01-15T12:00:00Z");

function communication(overrides: Partial<Communication>): Communication {
  return {
    id: "c1",
    contactId: null,
    draftId: null,
    direction: "outbound",
    channel: "email",
    subject: "Hi",
    body: null,
    occurredAt: NOW.toISOString(),
    ...overrides,
  };
}

function business(status: string, communications: Communication[]): Pick<Business, "status" | "communications"> {
  return { status, communications };
}

function daysAgo(days: number): string {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

describe("needsFollowUp", () => {
  it("is false for a business that isn't in 'contacted' status", () => {
    const b = business("drafted", [communication({ occurredAt: daysAgo(30) })]);
    expect(needsFollowUp(b, NOW)).toBe(false);
  });

  it("is false with no outbound communications on file", () => {
    const b = business("contacted", []);
    expect(needsFollowUp(b, NOW)).toBe(false);
  });

  it(`is false when the last outbound message was fewer than ${FOLLOW_UP_DAYS} days ago`, () => {
    const b = business("contacted", [communication({ occurredAt: daysAgo(2) })]);
    expect(needsFollowUp(b, NOW)).toBe(false);
  });

  it(`is true once ${FOLLOW_UP_DAYS}+ days have passed since the last outbound message`, () => {
    const b = business("contacted", [communication({ occurredAt: daysAgo(FOLLOW_UP_DAYS) })]);
    expect(needsFollowUp(b, NOW)).toBe(true);
  });

  it("uses the most recent outbound message when there are several", () => {
    const b = business("contacted", [
      communication({ id: "old", occurredAt: daysAgo(60) }),
      communication({ id: "recent", occurredAt: daysAgo(1) }),
    ]);
    expect(needsFollowUp(b, NOW)).toBe(false);
  });

  it("status flips to 'responded' once a reply is logged, which this function already treats as no-follow-up-needed", () => {
    const b = business("responded", [
      communication({ direction: "outbound", occurredAt: daysAgo(30) }),
      communication({ id: "reply", direction: "inbound", occurredAt: daysAgo(29) }),
    ]);
    expect(needsFollowUp(b, NOW)).toBe(false);
  });
});
