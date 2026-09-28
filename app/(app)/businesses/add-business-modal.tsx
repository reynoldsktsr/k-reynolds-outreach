"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { addBusiness } from "@/lib/actions";
import { useServerAction } from "@/lib/use-action";
import { Modal } from "@/components/modal";
import { TextField, TextAreaField } from "@/components/field";

export function AddBusinessModal() {
  const [open, setOpen] = useState(false);
  const { isPending, run } = useServerAction();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Lets the command palette's "Add a business" action open this straight
  // from anywhere (it navigates to /businesses?add=1) without prop-drilling
  // modal state through the server-rendered page.
  useEffect(() => {
    if (searchParams.get("add") === "1") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing to an external source (the URL), not derived render state
      setOpen(true);
      router.replace("/businesses");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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
    };
    if (!data.name.trim()) return;

    run(
      async () => {
        const { id } = await addBusiness(data);
        setOpen(false);
        router.push(`/businesses/${id}`);
      },
      { errorPrefix: "Couldn't add business" },
    );
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-primary">
        Add business
      </button>
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Add a business"
        footer={
          <>
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" form="add-business-form" disabled={isPending} className="btn-primary">
              {isPending ? "Adding…" : "Add business"}
            </button>
          </>
        }
      >
        <form id="add-business-form" onSubmit={handleSubmit} className="grid grid-cols-2 gap-2.5">
          <div className="col-span-2">
            <TextField label="Name" name="name" required autoFocus />
          </div>
          <TextField label="Category" name="category" placeholder="e.g. coffee shop" />
          <TextField label="City" name="city" placeholder="e.g. Tustin, CA" />
          <div className="col-span-2">
            <TextField label="Address" name="address" />
          </div>
          <div className="col-span-2">
            <TextField label="Website" name="website" placeholder="https://… (leave blank if none)" />
          </div>
          <div className="col-span-2">
            <TextAreaField
              label="What you noticed"
              name="gapSummary"
              rows={2}
              placeholder="e.g. no online ordering, site looks broken on mobile…"
            />
          </div>
        </form>
      </Modal>
    </>
  );
}
