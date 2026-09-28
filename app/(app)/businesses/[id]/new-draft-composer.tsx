"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RichTextEditor } from "./rich-text-editor";
import { createDraft } from "@/lib/actions";
import { useServerAction } from "@/lib/use-action";
import type { Contact } from "@/lib/db";

function isBodyEmpty(html: string): boolean {
  return (
    html
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim().length === 0
  );
}

export function NewDraftComposer({ businessId, contacts }: { businessId: string; contacts: Contact[] }) {
  const [contactId, setContactId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("<p></p>");
  const [editorKey, setEditorKey] = useState(0);
  const { isPending, run } = useServerAction();
  const router = useRouter();

  const canSave = subject.trim().length > 0 && !isBodyEmpty(body);

  function save() {
    if (!canSave) return;
    run(
      async () => {
        await createDraft(businessId, { contactId: contactId || null, subject, body });
        setSubject("");
        setBody("<p></p>");
        setEditorKey((k) => k + 1);
        router.refresh();
      },
      { successMessage: "Draft saved to review queue.", errorPrefix: "Couldn't save draft" },
    );
  }

  return (
    <div className="mt-3 flex flex-col gap-2.5 text-sm">
      <select value={contactId} onChange={(e) => setContactId(e.target.value)} className="input">
        <option value="">No contact selected</option>
        {contacts.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name ?? c.email} {c.email ? `(${c.email})` : ""}
          </option>
        ))}
      </select>
      <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="input" />
      <RichTextEditor key={editorKey} initialHtml={body} onChange={setBody} />
      <button onClick={save} disabled={isPending || !canSave} className="btn-primary self-start">
        {isPending ? "Saving…" : "Save to review queue"}
      </button>
    </div>
  );
}
