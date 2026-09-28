export function escapeCsvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function toCsv<T>(rows: T[], columns: { header: string; value: (row: T) => string }[]): string {
  const lines = [columns.map((c) => escapeCsvField(c.header)).join(",")];
  for (const row of rows) {
    lines.push(columns.map((c) => escapeCsvField(c.value(row))).join(","));
  }
  return lines.join("\r\n");
}
