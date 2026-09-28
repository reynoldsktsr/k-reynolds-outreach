"use client";

import { useRouter } from "next/navigation";
import { bulkUpdateStatus } from "@/lib/actions";
import { useServerAction } from "@/lib/use-action";

export function BulkActionsBar({ selectedIds, clearSelection }: { selectedIds: string[]; clearSelection: () => void }) {
  const { isPending, run } = useServerAction();
  const router = useRouter();

  function markNotInterested() {
    if (!window.confirm(`Mark ${selectedIds.length} business${selectedIds.length === 1 ? "" : "es"} as not interested?`)) {
      return;
    }
    run(
      async () => {
        const { updated } = await bulkUpdateStatus(selectedIds, "not-interested");
        clearSelection();
        router.refresh();
        return updated;
      },
      {
        successMessage: (updated) => `Marked ${updated} business${updated === 1 ? "" : "es"} as not interested.`,
        errorPrefix: "Couldn't update",
      },
    );
  }

  return (
    <button type="button" onClick={markNotInterested} disabled={isPending} className="btn-secondary">
      {isPending ? "Updating…" : "Mark not interested"}
    </button>
  );
}
