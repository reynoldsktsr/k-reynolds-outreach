"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { markReplied } from "@/lib/actions";
import { useServerAction } from "@/lib/use-action";

export function MarkRepliedControl({ businessId }: { businessId: string }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const { isPending, run } = useServerAction();
  const router = useRouter();

  function submit() {
    run(
      async () => {
        await markReplied(businessId, note);
        setOpen(false);
        setNote("");
        router.refresh();
      },
      { successMessage: "Marked as replied.", errorPrefix: "Couldn't save" },
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-secondary self-start">
        Mark as replied
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="What did they say? (optional)"
        rows={2}
        className="input"
        autoFocus
      />
      <div className="flex gap-2">
        <button type="button" onClick={submit} disabled={isPending} className="btn-primary">
          {isPending ? "Saving…" : "Save reply"}
        </button>
        <button type="button" onClick={() => setOpen(false)} disabled={isPending} className="btn-secondary">
          Cancel
        </button>
      </div>
    </div>
  );
}
