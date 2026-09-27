import { notFound } from "next/navigation";
import { getBusiness } from "@/lib/db";
import { createContact, createDraft, updateBusinessStatus } from "@/lib/actions";

export const dynamic = "force-dynamic";

const DEMO_SITES = [
  {
    label: "Coffee / retail / food service",
    url: "https://k-reynolds-demo-coffee.netlify.app",
  },
  {
    label: "Restaurant / reservations",
    url: "https://k-reynolds-demo-restaurant.netlify.app",
  },
  {
    label: "Salon / spa / appointment-based",
    url: "https://k-reynolds-demo-booking.netlify.app",
  },
];

export default async function BusinessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: businessId } = await params;

  const business = await getBusiness(businessId);
  if (!business) notFound();

  async function addContact(formData: FormData) {
    "use server";
    await createContact(businessId, {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      role: String(formData.get("role") ?? ""),
    });
  }

  async function addDraft(formData: FormData) {
    "use server";
    const contactId = formData.get("contactId");
    await createDraft(businessId, {
      contactId: contactId ? String(contactId) : null,
      subject: String(formData.get("subject") ?? ""),
      body: String(formData.get("body") ?? ""),
    });
  }

  async function setStatus(formData: FormData) {
    "use server";
    await updateBusinessStatus(businessId, String(formData.get("status")));
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{business.name}</h1>
        <p className="mt-1.5 text-sm text-neutral-600">
          {[business.category, business.city].filter(Boolean).join(" · ") || "No category/city on file"}
        </p>
        {business.gapSummary && (
          <p className="mt-3 max-w-[70ch] text-[15px] leading-relaxed text-neutral-800">
            {business.gapSummary}
          </p>
        )}
        <form action={setStatus} className="mt-4 flex items-center gap-2">
          <label className="text-sm font-medium text-neutral-600">Status</label>
          <select
            name="status"
            defaultValue={business.status}
            className="rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm"
          >
            {["new-lead", "drafted", "contacted", "responded", "not-interested", "won"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium hover:bg-neutral-100">
            Update
          </button>
        </form>
      </div>

      <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold">Contacts</h2>
        <ul className="mt-4 flex flex-col gap-2 text-sm">
          {business.contacts.length === 0 && (
            <li className="text-neutral-500">No contacts on file yet.</li>
          )}
          {business.contacts.map((c) => (
            <li key={c.id} className="rounded-lg border border-neutral-200 px-4 py-2.5">
              <span className="font-medium text-neutral-900">{c.name ?? "Unnamed"}</span>
              {c.role && <span className="text-neutral-500"> · {c.role}</span>}
              <div className="text-neutral-700">
                {c.email ?? "no email"} {c.phone && `· ${c.phone}`}
              </div>
            </li>
          ))}
        </ul>
        <form action={addContact} className="mt-4 grid grid-cols-2 gap-2.5 text-sm">
          <input
            name="name"
            placeholder="Name"
            className="rounded-md border border-neutral-300 px-3 py-2"
          />
          <input
            name="role"
            placeholder="Role"
            className="rounded-md border border-neutral-300 px-3 py-2"
          />
          <input
            name="email"
            placeholder="Email"
            className="rounded-md border border-neutral-300 px-3 py-2"
          />
          <input
            name="phone"
            placeholder="Phone"
            className="rounded-md border border-neutral-300 px-3 py-2"
          />
          <button className="col-span-2 rounded-md bg-neutral-900 px-3 py-2 font-medium text-white hover:bg-neutral-700">
            Add contact
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold">New draft</h2>

        <div className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-600">
          <span className="font-medium text-neutral-700">Reference to link in the email:</span>{" "}
          {DEMO_SITES.map((d, i) => (
            <span key={d.url}>
              {i > 0 && " · "}
              <a href={d.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-neutral-900">
                {d.label}
              </a>
            </span>
          ))}
        </div>

        <form action={addDraft} className="mt-4 flex flex-col gap-2.5 text-sm">
          <select name="contactId" className="rounded-md border border-neutral-300 px-3 py-2">
            <option value="">No contact selected</option>
            {business.contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name ?? c.email} {c.email ? `(${c.email})` : ""}
              </option>
            ))}
          </select>
          <input
            name="subject"
            placeholder="Subject"
            required
            className="rounded-md border border-neutral-300 px-3 py-2"
          />
          <textarea
            name="body"
            placeholder="Email body"
            required
            rows={7}
            className="rounded-md border border-neutral-300 px-3 py-2 leading-relaxed"
          />
          <button className="self-start rounded-md bg-neutral-900 px-4 py-2 font-medium text-white hover:bg-neutral-700">
            Save to review queue
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold">Drafts &amp; history</h2>
        <ul className="mt-4 flex flex-col gap-2 text-sm">
          {business.drafts.map((d) => (
            <li key={d.id} className="rounded-lg border border-neutral-200 px-4 py-2.5">
              <span className="font-medium text-neutral-900">{d.subject}</span>{" "}
              <span className="text-neutral-500">({d.status})</span>
            </li>
          ))}
          {business.communications.map((c) => (
            <li key={`c${c.id}`} className="rounded-lg border border-neutral-200 px-4 py-2.5 text-neutral-700">
              Sent {new Date(c.occurredAt).toLocaleString()}: {c.subject}
            </li>
          ))}
          {business.drafts.length === 0 && business.communications.length === 0 && (
            <li className="text-neutral-500">Nothing yet.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
