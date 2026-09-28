"use client";

import type { Business } from "@/lib/db";
import { toCsv } from "@/lib/csv";

const COLUMNS: { header: string; value: (b: Business) => string }[] = [
  { header: "Name", value: (b) => b.name },
  { header: "Category", value: (b) => b.category ?? "" },
  { header: "City", value: (b) => b.city ?? "" },
  { header: "Address", value: (b) => b.address ?? "" },
  { header: "Website", value: (b) => b.website ?? "" },
  { header: "Status", value: (b) => b.status },
  { header: "Gap summary", value: (b) => b.gapSummary ?? "" },
  { header: "Source note", value: (b) => b.sourceNote ?? "" },
  { header: "Created", value: (b) => b.createdAt },
];

export function ExportCsvButton({ businesses }: { businesses: Business[] }) {
  function handleClick() {
    const csv = toCsv(businesses, COLUMNS);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `businesses-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <button type="button" onClick={handleClick} className="btn-secondary">
      Export CSV
    </button>
  );
}
