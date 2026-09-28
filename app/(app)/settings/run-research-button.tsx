"use client";

import { useRouter } from "next/navigation";
import { runLeadResearchNow } from "@/lib/actions";
import { useServerAction } from "@/lib/use-action";

export function RunResearchButton() {
  const { isPending, run } = useServerAction();
  const router = useRouter();

  function handleClick() {
    run(
      async () => {
        const result = await runLeadResearchNow();
        router.refresh();
        return result;
      },
      {
        successMessage: ({ inserted, candidatesFound }) =>
          inserted > 0
            ? `Added ${inserted} new business${inserted === 1 ? "" : "es"} (${candidatesFound} found).`
            : `No new businesses added (${candidatesFound} found, all already tracked).`,
        errorPrefix: "Lead research failed",
      },
    );
  }

  return (
    <button type="button" onClick={handleClick} disabled={isPending} className="btn-secondary">
      {isPending ? "Researching…" : "Run lead research now"}
    </button>
  );
}
