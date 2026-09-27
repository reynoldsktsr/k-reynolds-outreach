"use client";

import { useState } from "react";
import { checkDomains } from "@/lib/actions";
import type { DomainStatus } from "@/lib/domains";

export function DomainCheck({ businessName }: { businessName: string }) {
  const [results, setResults] = useState<DomainStatus[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    try {
      setResults(await checkDomains(businessName));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={run}
        disabled={loading}
        className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium hover:bg-neutral-100 disabled:opacity-50"
      >
        {loading ? "Checking…" : "Suggest & check domains"}
      </button>

      {results && (
        <ul className="mt-3 grid grid-cols-2 gap-1.5 text-sm sm:grid-cols-3">
          {results.map((r) => (
            <li
              key={r.domain}
              className={`rounded-md border px-2.5 py-1.5 ${
                r.available === true
                  ? "border-green-200 bg-green-50 text-green-800"
                  : r.available === false
                    ? "border-neutral-200 bg-neutral-50 text-neutral-400 line-through"
                    : "border-neutral-200 bg-neutral-50 text-neutral-500"
              }`}
            >
              {r.domain}
              <span className="ml-1 text-xs">
                {r.available === true ? "available" : r.available === false ? "taken" : "unknown"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
