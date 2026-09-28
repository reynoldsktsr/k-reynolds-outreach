"use client";

import { useState } from "react";
import { checkDomains } from "@/lib/actions";
import { useToast } from "@/components/toast";
import type { DomainStatus } from "@/lib/domains";

export function DomainCheck({ businessName }: { businessName: string }) {
  const [results, setResults] = useState<DomainStatus[] | null>(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  async function run() {
    setLoading(true);
    try {
      setResults(await checkDomains(businessName));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      showToast(`Couldn't check domains: ${message}`, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={run} disabled={loading} className="btn-secondary">
        {loading ? "Checking…" : "Suggest & check domains"}
      </button>

      {results && (
        <ul className="mt-3 grid grid-cols-2 gap-1.5 text-sm sm:grid-cols-3">
          {results.map((r) => (
            <li
              key={r.domain}
              className={`rounded-md border px-2.5 py-1.5 ${
                r.available === true
                  ? "border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-300"
                  : r.available === false
                    ? "border-neutral-200 bg-neutral-50 text-neutral-400 line-through dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-600"
                    : "border-neutral-200 bg-neutral-50 text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400"
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
