import { describe, it, expect } from "vitest";
import { htmlToPlainText } from "./gmail";

describe("htmlToPlainText", () => {
  it("turns paragraph/list/br tags into newlines", () => {
    const html = "<p>Hi there.</p><p>Line one.<br>Line two.</p><ul><li>First</li><li>Second</li></ul>";
    const text = htmlToPlainText(html);
    expect(text).toContain("Hi there.");
    expect(text).toContain("Line one.");
    expect(text).toContain("Line two.");
    expect(text).toContain("First");
    expect(text).toContain("Second");
    expect(text).not.toContain("<");
  });

  it("strips inline tags but keeps their text", () => {
    expect(htmlToPlainText("<p>This is <strong>bold</strong> and <em>italic</em>.</p>")).toContain(
      "This is bold and italic.",
    );
  });

  it("decodes common HTML entities", () => {
    const text = htmlToPlainText("<p>Terms &amp; conditions &mdash; it&#39;s &quot;fine&quot;.</p>".replace("&mdash;", "-"));
    expect(text).toContain("Terms & conditions");
    expect(text).toContain("it's");
    expect(text).toContain('"fine"');
  });

  it("collapses runs of blank lines", () => {
    const html = "<p>One</p><p></p><p></p><p>Two</p>";
    const text = htmlToPlainText(html);
    expect(text).not.toMatch(/\n{3,}/);
  });
});
