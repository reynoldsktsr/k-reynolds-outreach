"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generatePitch } from "@/lib/actions";
import { useServerAction } from "@/lib/use-action";
import type { Contact } from "@/lib/db";

export function PitchGenerationControl({ businessId, contacts }: { businessId: string; contacts: Contact[] }) {
  const [contactId, setContactId] = useState("");
  const { isPending, run } = useServerAction();
  const router = useRouter();

  function handleClick() {
    run(
      async () => {
        await generatePitch(businessId, contactId || null);
        router.refresh();
      },
      { successMessage: "Pitch email drafted.", errorPrefix: "Couldn't write pitch" },
    );
  }

  return (
    <div className="flex items-center gap-2">
      <select value={contactId} onChange={(e) => setContactId(e.target.value)} className="input w-auto py-1.5 text-sm">
        <option value="">Address the business generally</option>
        {contacts.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name ?? c.email ?? "Unnamed"}
          </option>
        ))}
      </select>
      <button type="button" onClick={handleClick} disabled={isPending} className="btn-primary">
        {isPending ? "Writing…" : "Generate pitch email"}
      </button>
    </div>
  );
}
