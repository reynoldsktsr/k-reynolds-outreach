"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { editBusiness } from "@/lib/actions";
import { useServerAction } from "@/lib/use-action";
import { TextField, TextAreaField } from "@/components/field";
import type { Business } from "@/lib/db";

export function EditDetailsForm({ business }: { business: Business }) {
  const [open, setOpen] = useState(false);
  const { isPending, run } = useServerAction();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: String(formData.get("name") ?? ""),
      category: String(formData.get("category") ?? ""),
      city: String(formData.get("city") ?? ""),
      address: String(formData.get("address") ?? ""),
      website: String(formData.get("website") ?? ""),
      gapSummary: String(formData.get("gapSummary") ?? ""),
      sourceNote: String(formData.get("sourceNote") ?? ""),
    };
    run(
      async () => {
        await editBusiness(business.id, data);
        router.refresh();
      },
      { successMessage: "Business details saved.", errorPrefix: "Couldn't save" },
    );
  }

  return (
    <details className="mt-4 group" open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary className="cursor-pointer text-sm font-medium text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100">
        Edit details
      </summary>
      <form onSubmit={handleSubmit} className="mt-3 grid grid-cols-2 gap-2.5 rounded-xl border border-neutral-200 bg-white p-5 text-sm shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="col-span-2">
          <TextField label="Name" name="name" defaultValue={business.name} />
        </div>
        <TextField label="Category" name="category" defaultValue={business.category ?? ""} />
        <TextField label="City" name="city" defaultValue={business.city ?? ""} />
        <div className="col-span-2">
          <TextField label="Address" name="address" defaultValue={business.address ?? ""} />
        </div>
        <div className="col-span-2">
          <TextField label="Website" name="website" defaultValue={business.website ?? ""} placeholder="https://…" />
        </div>
        <div className="col-span-2">
          <TextAreaField label="Gap summary" name="gapSummary" defaultValue={business.gapSummary ?? ""} rows={2} />
        </div>
        <div className="col-span-2">
          <TextAreaField label="Source note" name="sourceNote" defaultValue={business.sourceNote ?? ""} rows={2} />
        </div>
        <button type="submit" disabled={isPending} className="btn-primary col-span-2 self-start">
          {isPending ? "Saving…" : "Save changes"}
        </button>
      </form>
    </details>
  );
}
