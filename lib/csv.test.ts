import { describe, it, expect } from "vitest";
import { escapeCsvField, toCsv } from "./csv";

describe("escapeCsvField", () => {
  it("leaves plain fields untouched", () => {
    expect(escapeCsvField("Coffee Shop")).toBe("Coffee Shop");
  });

  it("quotes and escapes a field containing a comma", () => {
    expect(escapeCsvField("Tustin, CA")).toBe('"Tustin, CA"');
  });

  it("doubles embedded quotes", () => {
    expect(escapeCsvField('Say "hi"')).toBe('"Say ""hi"""');
  });

  it("quotes a field containing a newline", () => {
    expect(escapeCsvField("line one\nline two")).toBe('"line one\nline two"');
  });
});

describe("toCsv", () => {
  it("builds a header row plus one row per item", () => {
    const rows = [
      { name: "Joe's Coffee", city: "Tustin, CA" },
      { name: "Plain Deli", city: "Irvine" },
    ];
    const csv = toCsv(rows, [
      { header: "Name", value: (r) => r.name },
      { header: "City", value: (r) => r.city },
    ]);
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe("Name,City");
    expect(lines[1]).toBe('Joe\'s Coffee,"Tustin, CA"');
    expect(lines[2]).toBe("Plain Deli,Irvine");
  });

  it("produces just a header row for an empty list", () => {
    const csv = toCsv([], [{ header: "Name", value: () => "" }]);
    expect(csv).toBe("Name");
  });
});
