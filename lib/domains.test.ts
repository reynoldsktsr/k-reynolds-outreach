import { describe, it, expect } from "vitest";
import { candidateDomains } from "./domains";

describe("candidateDomains", () => {
  it("produces bare and hyphenated variants across all TLDs", () => {
    const domains = candidateDomains("Joe's Coffee Shop");
    expect(domains).toContain("joescoffeeshop.com");
    expect(domains).toContain("joes-coffee-shop.com");
    expect(domains).toContain("joescoffeeshop.net");
    expect(domains).toContain("joes-coffee-shop.shop");
  });

  it("normalizes hyphens in the source name instead of producing a bare mashup", () => {
    // Regression: hyphens weren't being turned into spaces before word-
    // splitting, producing a malformed "rasta-cowboyrecords" bare variant.
    const domains = candidateDomains("Rasta-Cowboy Records");
    expect(domains).toContain("rastacowboyrecords.com");
    expect(domains).toContain("rasta-cowboy-records.com");
    expect(domains).not.toContain("rasta-cowboyrecords.com");
  });

  it("strips a leading 'The'", () => {
    const domains = candidateDomains("The Coffee House");
    expect(domains).toContain("coffeehouse.com");
    expect(domains).not.toContain("thecoffeehouse.com");
  });

  it("converts '&' to 'and' and drops other punctuation", () => {
    const domains = candidateDomains("Smith & Sons, LLC.");
    expect(domains).toContain("smithandsonsllc.com");
  });

  it("dedupes when the bare and hyphenated forms are identical (single word)", () => {
    const domains = candidateDomains("Bistro");
    const bistroComCount = domains.filter((d) => d === "bistro.com").length;
    expect(bistroComCount).toBe(1);
  });
});
