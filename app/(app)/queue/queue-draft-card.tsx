"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RichTextEditor } from "../businesses/[id]/rich-text-editor";
import { updateDraft, approveAndSendDraft, discardDraft } from "@/lib/actions";
import { useServerAction } from "@/lib/use-action";

export function QueueDraftCard({
  businessId,
  businessName,
  contactLabel,
  contactEmail,
  draftId,
  initialSubject,
  initialBody,
}: {
  businessId: string;
  businessName: string;
  contactLabel: string;
  contactEmail: string | null;
  draftId: string;
  initialSubject: string;
  initialBody: string;
}) {
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [dirty, setDirty] = useState(false);
  const { isPending, run } = useServerAction();
  const router = useRouter();

  function save() {
    run(
      async () => {
        await updateDraft(businessId, draftId, { subject, body });
        setDirty(false);
        router.refresh();
      },
      { successMessage: "Draft saved.", errorPrefix: "Couldn't save draft" },
    );
  }

  function send() {
    run(
      async () => {
        if (dirty) await updateDraft(businessId, draftId, { subject, body });
        await approveAndSendDraft(businessId, draftId);
        router.refresh();
      },
      { successMessage: "Email sent.", errorPrefix: "Couldn't send" },
    );
  }

  function discard() {
    if (!window.confirm("Discard this draft? This can't be undone.")) return;
    run(
      async () => {
        await discardDraft(businessId, draftId);
        router.refresh();
      },
      { successMessage: "Draft discarded.", errorPrefix: "Couldn't discard draft" },
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href={`/businesses/${businessId}`} className="font-semibold text-neutral-900 hover:underline dark:text-neutral-100">
            {businessName}
          </Link>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            To: {contactLabel} {contactEmail ? `<${contactEmail}>` : "(no email on file)"}
          </p>
        </div>
      </div>
      <input
        value={subject}
        onChange={(e) => {
          setSubject(e.target.value);
          setDirty(true);
        }}
        className="input mt-4 text-sm font-semibold text-neutral-900 dark:text-neutral-100"
      />
      <div className="mt-2">
        <RichTextEditor
          initialHtml={initialBody}
          onChange={(html) => {
            setBody(html);
            setDirty(true);
          }}
        />
      </div>
      <div className="mt-4 flex gap-2">
        <button onClick={send} disabled={isPending || !contactEmail} className="btn-primary">
          {isPending ? "Working…" : contactEmail ? "Approve & send" : "No contact email on file"}
        </button>
        <button onClick={discard} disabled={isPending} className="btn-secondary">
          Discard
        </button>
        <button onClick={save} disabled={isPending || !dirty} className="btn-secondary">
          Save changes
        </button>
      </div>
    </div>
  );
}
