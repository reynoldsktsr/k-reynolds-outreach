import { notFound } from "next/navigation";
import { getBusiness, listReports } from "@/lib/db";
import { createContact, createDraft, updateBusinessStatus, editBusiness, generateReport } from "@/lib/actions";
import { DomainCheck } from "./domain-check";

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

const REPORT_LABELS: Record<string, string> = {
  "no-site-pitch": "Why they need a site",
  "stack-analysis": "Stack analysis",
};

export default async function BusinessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: businessId } = await params;

  const [business, reports] = await Promise.all([getBusiness(businessId), listReports(businessId)]);
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

  async function saveEdits(formData: FormData) {
    "use server";
    await editBusiness(businessId, {
      name: String(formData.get("name") ?? ""),
      category: String(formData.get("category") ?? ""),
      city: String(formData.get("city") ?? ""),
      address: String(formData.get("address") ?? ""),
      website: String(formData.get("website") ?? ""),
      gapSummary: String(formData.get("gapSummary") ?? ""),
      sourceNote: String(formData.get("sourceNote") ?? ""),
    });
  }

  async function runAnalysis() {
    "use server";
    await generateReport(businessId);
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{business.name}</h1>
            <p className="mt-1.5 text-sm text-neutral-600">
              {[business.category, business.city].filter(Boolean).join(" · ") || "No category/city on file"}
            </p>
          </div>
          {business.website && (
            <a
              href={business.website}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-sm font-medium text-neutral-500 hover:text-neutral-900"
            >
              Visit site ↗
            </a>
          )}
        </div>
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

        <details className="mt-4 group">
          <summary className="cursor-pointer text-sm font-medium text-neutral-500 hover:text-neutral-800">
            Edit details
          </summary>
          <form action={saveEdits} className="mt-3 grid grid-cols-2 gap-2.5 rounded-xl border border-neutral-200 bg-white p-5 text-sm shadow-sm">
            <label className="col-span-2 flex flex-col gap-1">
              Name
              <input name="name" defaultValue={business.name} className="rounded-md border border-neutral-300 px-3 py-2" />
            </label>
            <label className="flex flex-col gap-1">
              Category
              <input name="category" defaultValue={business.category ?? ""} className="rounded-md border border-neutral-300 px-3 py-2" />
            </label>
            <label className="flex flex-col gap-1">
              City
              <input name="city" defaultValue={business.city ?? ""} className="rounded-md border border-neutral-300 px-3 py-2" />
            </label>
            <label className="col-span-2 flex flex-col gap-1">
              Address
              <input name="address" defaultValue={business.address ?? ""} className="rounded-md border border-neutral-300 px-3 py-2" />
            </label>
            <label className="col-span-2 flex flex-col gap-1">
              Website
              <input
                name="website"
                defaultValue={business.website ?? ""}
                placeholder="https://…"
                className="rounded-md border border-neutral-300 px-3 py-2"
              />
            </label>
            <label className="col-span-2 flex flex-col gap-1">
              Gap summary
              <textarea
                name="gapSummary"
                defaultValue={business.gapSummary ?? ""}
                rows={2}
                className="rounded-md border border-neutral-300 px-3 py-2"
              />
            </label>
            <label className="col-span-2 flex flex-col gap-1">
              Source note
              <textarea
                name="sourceNote"
                defaultValue={business.sourceNote ?? ""}
                rows={2}
                className="rounded-md border border-neutral-300 px-3 py-2"
              />
            </label>
            <button className="col-span-2 self-start rounded-md bg-neutral-900 px-4 py-2 font-medium text-white hover:bg-neutral-700">
              Save changes
            </button>
          </form>
        </details>
      </div>

      <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold">Domains</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Candidate domain names based on the business name, checked against real registry availability.
        </p>
        <div className="mt-4">
          <DomainCheck businessName={business.name} />
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Analysis reports</h2>
          <form action={runAnalysis}>
            <button className="rounded-md bg-neutral-900 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-neutral-700">
              {business.website ? "Run stack analysis" : "Generate pitch report"}
            </button>
          </form>
        </div>
        <p className="mt-1 text-sm text-neutral-600">
          {business.website
            ? "Fetches the live site and analyzes the likely stack, how its dynamic features are probably run, and concrete functional gaps."
            : "No website on file, so this generates the business case for why they need one. Add a website above and re-run for a stack analysis instead."}
        </p>
        <ul className="mt-4 flex flex-col gap-3">
          {reports.length === 0 && <li className="text-sm text-neutral-500">No reports yet.</li>}
          {reports.map((r) => (
            <li key={r.id} className="rounded-lg border border-neutral-200 p-4">
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span className="font-medium text-neutral-700">{REPORT_LABELS[r.kind] ?? r.kind}</span>
                <span>{new Date(r.createdAt).toLocaleString()}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-neutral-800">
                {r.content}
              </p>
            </li>
          ))}
        </ul>
      </section>

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
