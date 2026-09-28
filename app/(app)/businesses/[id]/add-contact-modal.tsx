"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createContact } from "@/lib/actions";
import { useServerAction } from "@/lib/use-action";
import { Modal } from "@/components/modal";
import { TextField } from "@/components/field";

export function AddContactModal({ businessId }: { businessId: string }) {
  const [open, setOpen] = useState(false);
  const { isPending, run } = useServerAction();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      role: String(formData.get("role") ?? ""),
    };
    run(
      async () => {
        await createContact(businessId, data);
        router.refresh();
        setOpen(false);
      },
      { successMessage: "Contact added.", errorPrefix: "Couldn't add contact" },
    );
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-secondary">
        Add contact
      </button>
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Add contact"
        footer={
          <>
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" form="add-contact-form" disabled={isPending} className="btn-primary">
              {isPending ? "Saving…" : "Save contact"}
            </button>
          </>
        }
      >
        <form id="add-contact-form" onSubmit={handleSubmit} className="grid grid-cols-2 gap-2.5">
          <TextField label="Name" name="name" />
          <TextField label="Role" name="role" />
          <div className="col-span-2">
            <TextField label="Email" name="email" type="email" />
          </div>
          <div className="col-span-2">
            <TextField label="Phone" name="phone" type="tel" />
          </div>
        </form>
      </Modal>
    </>
  );
}
