"use client";

import { useRouter } from "next/navigation";
import { updateBusinessStatus } from "@/lib/actions";
import { useServerAction } from "@/lib/use-action";

const STATUSES = ["new-lead", "drafted", "contacted", "responded", "not-interested", "won"];

export function StatusSelect({ businessId, currentStatus }: { businessId: string; currentStatus: string }) {
  const { isPending, run } = useServerAction();
  const router = useRouter();

  function handleChange(status: string) {
    run(
      async () => {
        await updateBusinessStatus(businessId, status);
        router.refresh();
      },
      { successMessage: `Status updated to "${status}".`, errorPrefix: "Couldn't update status" },
    );
  }

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Status</label>
      <select
        defaultValue={currentStatus}
        disabled={isPending}
        onChange={(e) => handleChange(e.target.value)}
        className="input w-auto py-1.5 disabled:opacity-60"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  );
}
