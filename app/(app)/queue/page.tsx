import { listPendingDrafts } from "@/lib/db";
import { QueueDraftCard } from "./queue-draft-card";

export const dynamic = "force-dynamic";

export default async function QueuePage() {
  const rows = await listPendingDrafts();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Review queue</h1>
        <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{rows.length} awaiting approval</span>
      </div>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Nothing here sends on its own. Read each draft, fix anything off, then approve and send.
      </p>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400">
          Queue is empty.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {rows.map(({ business, draft }) => (
            <QueueDraftCard
              key={draft.id}
              businessId={business.id}
              businessName={business.name}
              contacts={business.contacts}
              draftId={draft.id}
              initialSubject={draft.subject}
              initialBody={draft.body}
              initialContactId={draft.contactId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
