"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RichTextEditor } from "./rich-text-editor";
import { updateDraft, approveAndSendDraft, discardDraft } from "@/lib/actions";

export function PendingDraftCard({
  businessId,
  draftId,
  initialSubject,
  initialBody,
  canSend,
}: {
  businessId: string;
  draftId: string;
  initialSubject: string;
  initialBody: string;
  canSend: boolean;
}) {
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [dirty, setDirty] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [savedNotice, setSavedNotice] = useState(false);
  const router = useRouter();

  function save() {
    startTransition(async () => {
      await updateDraft(businessId, draftId, { subject, body });
      setDirty(false);
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2000);
      router.refresh();
    });
  }

  function send() {
    startTransition(async () => {
      if (dirty) await updateDraft(businessId, draftId, { subject, body });
      await approveAndSendDraft(businessId, draftId);
      router.refresh();
    });
  }

  function discard() {
    startTransition(async () => {
      await discardDraft(businessId, draftId);
      router.refresh();
    });
  }

  return (
    <li className="rounded-lg border border-neutral-200 p-4">
      <input
        value={subject}
        onChange={(e) => {
          setSubject(e.target.value);
          setDirty(true);
        }}
        className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-semibold text-neutral-900"
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
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={send}
          disabled={isPending || !canSend}
          className="rounded-md bg-neutral-900 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Working…" : canSend ? "Approve & send" : "No contact email on file"}
        </button>
        <button
          onClick={discard}
          disabled={isPending}
          className="rounded-md border border-neutral-300 px-3.5 py-1.5 text-sm font-medium hover:bg-neutral-100 disabled:opacity-60"
        >
          Discard
        </button>
        <button
          onClick={save}
          disabled={isPending || !dirty}
          className="rounded-md border border-neutral-300 px-3.5 py-1.5 text-sm font-medium hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Save changes
        </button>
        {savedNotice && <span className="text-xs text-neutral-500">Saved</span>}
      </div>
    </li>
  );
}
