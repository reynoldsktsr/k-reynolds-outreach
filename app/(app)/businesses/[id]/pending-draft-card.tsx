"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RichTextEditor } from "./rich-text-editor";
import { updateDraft, approveAndSendDraft, discardDraft } from "@/lib/actions";
import { useServerAction } from "@/lib/use-action";
import type { Contact } from "@/lib/db";

export function PendingDraftCard({
  businessId,
  draftId,
  initialSubject,
  initialBody,
  initialContactId,
  contacts,
}: {
  businessId: string;
  draftId: string;
  initialSubject: string;
  initialBody: string;
  initialContactId: string | null;
  contacts: Contact[];
}) {
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [contactId, setContactId] = useState(initialContactId ?? "");
  const [dirty, setDirty] = useState(false);
  const { isPending, run } = useServerAction();
  const router = useRouter();

  const contactsWithEmail = contacts.filter((c) => c.email);
  // Mirrors the server's own resolution in approveAndSendDraft: an explicit
  // selection wins, otherwise only auto-resolve when there's exactly one
  // contact with an email on file - never guess among several.
  const resolvedEmail = contactId
    ? contacts.find((c) => c.id === contactId)?.email
    : contactsWithEmail.length === 1
      ? contactsWithEmail[0].email
      : null;
  const needsContactChoice = !contactId && contactsWithEmail.length > 1;

  function save() {
    run(
      async () => {
        await updateDraft(businessId, draftId, { subject, body, contactId: contactId || null });
        setDirty(false);
        router.refresh();
      },
      { successMessage: "Draft saved.", errorPrefix: "Couldn't save draft" },
    );
  }

  function send() {
    run(
      async () => {
        if (dirty) await updateDraft(businessId, draftId, { subject, body, contactId: contactId || null });
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
    <li className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      {contacts.length > 1 && (
        <select
          value={contactId}
          onChange={(e) => {
            setContactId(e.target.value);
            setDirty(true);
          }}
          className="input mb-2 text-sm"
        >
          <option value="">No contact selected</option>
          {contacts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name ?? c.email ?? "Unnamed"} {c.email ? `(${c.email})` : "(no email)"}
            </option>
          ))}
        </select>
      )}
      <input
        value={subject}
        onChange={(e) => {
          setSubject(e.target.value);
          setDirty(true);
        }}
        className="input text-sm font-semibold text-neutral-900 dark:text-neutral-100"
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
        <button onClick={send} disabled={isPending || !resolvedEmail} className="btn-primary">
          {isPending
            ? "Working…"
            : resolvedEmail
              ? "Approve & send"
              : needsContactChoice
                ? "Pick a contact above"
                : "No contact email on file"}
        </button>
        <button onClick={discard} disabled={isPending} className="btn-secondary">
          Discard
        </button>
        <button onClick={save} disabled={isPending || !dirty} className="btn-secondary">
          Save changes
        </button>
      </div>
    </li>
  );
}
