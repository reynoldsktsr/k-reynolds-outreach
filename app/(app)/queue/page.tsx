import { listPendingDrafts } from "@/lib/db";
import { approveAndSendDraft, discardDraft } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function QueuePage() {
  const rows = await listPendingDrafts();

  async function send(formData: FormData) {
    "use server";
    await approveAndSendDraft(String(formData.get("businessId")), String(formData.get("draftId")));
  }

  async function discard(formData: FormData) {
    "use server";
    await discardDraft(String(formData.get("businessId")), String(formData.get("draftId")));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Review queue</h1>
        <span className="text-sm font-medium text-neutral-500">{rows.length} awaiting approval</span>
      </div>
      <p className="text-sm text-neutral-600">
        Nothing here sends on its own. Read each draft, fix anything off, then approve and send.
      </p>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center text-sm text-neutral-500">
          Queue is empty.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {rows.map(({ business, draft, contact }) => (
            <div key={draft.id} className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-neutral-900">{business.name}</p>
                  <p className="text-sm text-neutral-600">
                    To: {contact?.name ?? "unknown"}{" "}
                    {contact?.email ? `<${contact.email}>` : "(no email on file)"}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm font-semibold text-neutral-900">{draft.subject}</p>
              <div
                className="prose prose-sm prose-neutral mt-1.5 max-w-none rounded-lg bg-neutral-50 p-4 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: draft.body }}
              />
              <div className="mt-4 flex gap-2">
                <form action={send}>
                  <input type="hidden" name="businessId" value={business.id} />
                  <input type="hidden" name="draftId" value={draft.id} />
                  <button
                    disabled={!contact?.email}
                    className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Approve &amp; send
                  </button>
                </form>
                <form action={discard}>
                  <input type="hidden" name="businessId" value={business.id} />
                  <input type="hidden" name="draftId" value={draft.id} />
                  <button className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-100">
                    Discard
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
