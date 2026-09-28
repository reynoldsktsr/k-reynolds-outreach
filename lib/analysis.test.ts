import { describe, it, expect } from "vitest";
import { extractText, extractContactMarkers, pickDemoSite } from "./analysis";
import type Anthropic from "@anthropic-ai/sdk";

function textBlock(text: string) {
  return { type: "text", text } as Anthropic.Messages.ContentBlock;
}

describe("extractText", () => {
  it("joins multiple text blocks instead of only taking the first", () => {
    // Regression: .find() on the first text block silently grabbed
    // commentary instead of the final answer when a response has several
    // text blocks interleaved with tool use (e.g. web_search).
    const blocks = [textBlock("Let me search for that..."), textBlock("Here's what I found: CONTACT_EMAIL: a@b.com")];
    expect(extractText(blocks)).toBe("Let me search for that...\n\nHere's what I found: CONTACT_EMAIL: a@b.com");
  });

  it("ignores non-text blocks", () => {
    const blocks = [
      { type: "server_tool_use", id: "x", name: "web_search", input: {} } as unknown as Anthropic.Messages.ContentBlock,
      textBlock("the answer"),
    ];
    expect(extractText(blocks)).toBe("the answer");
  });

  it("returns an empty string when there's no text block", () => {
    expect(extractText([])).toBe("");
  });
});

describe("extractContactMarkers", () => {
  it("pulls email and phone marker lines out and strips them from the content", () => {
    const text = "Some report body.\nCONTACT_EMAIL: owner@shop.com\nCONTACT_PHONE: 555-0100";
    const result = extractContactMarkers(text);
    expect(result.email).toBe("owner@shop.com");
    expect(result.phone).toBe("555-0100");
    expect(result.content).toBe("Some report body.");
  });

  it("returns nulls when no markers are present", () => {
    const result = extractContactMarkers("Just a plain report, nothing found.");
    expect(result.email).toBeNull();
    expect(result.phone).toBeNull();
    expect(result.content).toBe("Just a plain report, nothing found.");
  });

  it("handles only one of the two markers", () => {
    const result = extractContactMarkers("Report.\nCONTACT_EMAIL: a@b.com");
    expect(result.email).toBe("a@b.com");
    expect(result.phone).toBeNull();
  });
});

describe("pickDemoSite", () => {
  it("matches a category via a whole word, not a substring", () => {
    // Regression: a plain .includes() check for "bar" (restaurant) would
    // false-positive on "barber shop" (a salon/booking-demo category).
    expect(pickDemoSite("Barber shop").label).toBe("salon/spa/booking");
    expect(pickDemoSite("Sports bar").label).toBe("restaurant");
  });

  it("matches professional services that need booking/scheduling", () => {
    expect(pickDemoSite("Dental practice").label).toBe("salon/spa/booking");
    expect(pickDemoSite("Law firm").label).toBe("salon/spa/booking");
    expect(pickDemoSite("Veterinary clinic").label).toBe("salon/spa/booking");
  });

  it("matches suffixed forms of a keyword (word-boundary at the start only... actually full word)", () => {
    expect(pickDemoSite("Landscaping").label).toBe("salon/spa/booking");
    expect(pickDemoSite("Photography studio").label).toBe("salon/spa/booking");
  });

  it("falls back to the coffee-shop demo and reports matched:false for an unrecognized category", () => {
    const result = pickDemoSite("Something completely unclassifiable");
    expect(result.label).toBe("coffee shop");
    expect(result.matched).toBe(false);
  });

  it("reports matched:true for a real match", () => {
    expect(pickDemoSite("Italian restaurant").matched).toBe(true);
  });

  it("treats a null category as unmatched", () => {
    expect(pickDemoSite(null).matched).toBe(false);
  });
});
