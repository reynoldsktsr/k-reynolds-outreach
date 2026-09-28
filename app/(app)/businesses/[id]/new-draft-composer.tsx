"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RichTextEditor } from "./rich-text-editor";
import { createDraft } from "@/lib/actions";
import type { Contact } from "@/lib/db";

export function NewDraftComposer({ businessId, contacts }: { businessId: string; contacts: Contact[] }) {
  const [contactId, setContactId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("<p></p>");
  const [editorKey, setEditorKey] = useState(0);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function save() {
    if (!subject.trim()) return;
    startTransition(async () => {
      await createDraft(businessId, { contactId: contactId || null, subject, body });
      setSubject("");
      setBody("<p></p>");
      setEditorKey((k) => k + 1);
      router.refresh();
    });
  }

  return (
    <div className="mt-3 flex flex-col gap-2.5 text-sm">
      <select
        value={contactId}
        onChange={(e) => setContactId(e.target.value)}
        className="rounded-md border border-neutral-300 px-3 py-2"
      >
        <option value="">No contact selected</option>
        {contacts.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name ?? c.email} {c.email ? `(${c.email})` : ""}
          </option>
        ))}
      </select>
      <input
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Subject"
        className="rounded-md border border-neutral-300 px-3 py-2"
      />
      <RichTextEditor key={editorKey} initialHtml={body} onChange={setBody} />
      <button
        onClick={save}
        disabled={isPending || !subject.trim()}
        className="self-start rounded-md bg-neutral-900 px-4 py-2 font-medium text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Saving…" : "Save to review queue"}
      </button>
    </div>
  );
}
