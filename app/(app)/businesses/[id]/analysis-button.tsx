"use client";

import { useFormStatus } from "react-dom";

export function AnalysisButton({ hasWebsite }: { hasWebsite: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      disabled={pending}
      className="rounded-md bg-neutral-900 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Analyzing…" : hasWebsite ? "Run stack analysis" : "Generate pitch report"}
    </button>
  );
}
