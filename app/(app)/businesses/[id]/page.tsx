import { notFound } from "next/navigation";
import { getBusiness, listReports } from "@/lib/db";
import { generateReport, findContact, generatePitch } from "@/lib/actions";
import { pickDemoSite } from "@/lib/analysis";
import { DomainCheck } from "./domain-check";
import { ReportContent } from "./report-content";
import { PendingDraftCard } from "./pending-draft-card";
import { NewDraftComposer } from "./new-draft-composer";
import { AiActionButton } from "./ai-action-button";
import { StatusSelect } from "./status-select";
import { EditDetailsForm } from "./edit-details-form";
import { AddContactModal } from "./add-contact-modal";

export const dynamic = "force-dynamic";

const REPORT_LABELS: Record<string, string> = {
  "no-site-pitch": "Why they need a site",
  "stack-analysis": "Stack analysis",
  "contact-discovery": "Contact search",
};

export default async function BusinessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: businessId } = await params;

  const [business, reports] = await Promise.all([getBusiness(businessId), listReports(businessId)]);
  if (!business) notFound();

  const demoSite = pickDemoSite(business.category);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{business.name}</h1>
            <p className="mt-1.5 text-sm text-neutral-600 dark:text-neutral-400">
              {[business.category, business.city].filter(Boolean).join(" · ") || "No category/city on file"}
            </p>
          </div>
          {business.website && (
            <a
              href={business.website}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
            >
              Visit site &#8599;
            </a>
          )}
        </div>
        {business.gapSummary && (
          <p className="mt-3 max-w-[70ch] text-[15px] leading-relaxed text-neutral-800 dark:text-neutral-200">
            {business.gapSummary}
          </p>
        )}
        <div className="mt-4">
          <StatusSelect businessId={businessId} currentStatus={business.status} />
        </div>
        <EditDetailsForm business={business} />
      </div>

      <section className="card p-6">
        <h2 className="text-base font-semibold">Domains</h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Candidate domain names based on the business name, checked against real registry availability.
        </p>
        <div className="mt-4">
          <DomainCheck businessName={business.name} />
        </div>
      </section>

      <section className="card p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Analysis reports</h2>
          <AiActionButton
            businessId={businessId}
            action={generateReport}
            idleLabel={business.website ? "Run stack analysis" : "Generate pitch report"}
            pendingLabel="Analyzing…"
            successMessage="Analysis complete."
          />
        </div>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          {business.website
            ? "Fetches the live site and analyzes the likely stack, how its dynamic features are probably run, and concrete functional gaps."
            : "No website on file, so this generates the business case for why they need one. Add a website above and re-run for a stack analysis instead."}
        </p>
        <ul className="mt-4 flex flex-col gap-3">
          {reports.length === 0 && <li className="text-sm text-neutral-500 dark:text-neutral-400">No reports yet.</li>}
          {reports.map((r) => (
            <li key={r.id} className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
              <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                <span className="font-medium text-neutral-700 dark:text-neutral-300">{REPORT_LABELS[r.kind] ?? r.kind}</span>
                <span>{new Date(r.createdAt).toLocaleString()}</span>
              </div>
              <ReportContent content={r.content} />
            </li>
          ))}
        </ul>
      </section>

      <section className="card p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Contacts</h2>
          <div className="flex items-center gap-2">
            <AddContactModal businessId={businessId} />
            {business.contacts.length === 0 && (
              <AiActionButton
                businessId={businessId}
                action={findContact}
                idleLabel="Find contact"
                pendingLabel="Searching…"
                successMessage="Contact search complete."
                variant="secondary"
              />
            )}
          </div>
        </div>
        <ul className="mt-4 flex flex-col gap-2 text-sm">
          {business.contacts.length === 0 && (
            <li className="text-neutral-500 dark:text-neutral-400">
              No contacts on file yet. &quot;Find contact&quot; searches their public listings (Google/Yelp/
              Facebook/Instagram) for an email, phone, or owner name.
            </li>
          )}
          {business.contacts.map((c) => (
            <li key={c.id} className="rounded-lg border border-neutral-200 px-4 py-2.5 dark:border-neutral-800">
              <span className="font-medium text-neutral-900 dark:text-neutral-100">{c.name ?? "Unnamed"}</span>
              {c.role && <span className="text-neutral-500 dark:text-neutral-400"> · {c.role}</span>}
              <div className="text-neutral-700 dark:text-neutral-300">
                {c.email ?? "no email"} {c.phone && `· ${c.phone}`}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="card p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">New draft</h2>
          <AiActionButton
            businessId={businessId}
            action={generatePitch}
            idleLabel="Generate pitch email"
            pendingLabel="Writing…"
            successMessage="Pitch email drafted."
          />
        </div>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Writes a personal, non-templated draft grounded in the latest analysis on this business — noticed,
          suggested, how you&apos;d help, then a low-pressure invite to talk. Auto-includes the{" "}
          <a href={demoSite.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-neutral-900 dark:hover:text-neutral-100">
            {demoSite.label} demo
          </a>{" "}
          as their closest example. Lands in the queue below — nothing sends until you approve it.
        </p>

        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100">
            Or write one manually
          </summary>
          <NewDraftComposer businessId={businessId} contacts={business.contacts} />
        </details>
      </section>

      {business.drafts.some((d) => d.status === "pending") && (
        <section className="card p-6">
          <h2 className="text-base font-semibold">Pending drafts</h2>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Read the whole thing before sending, and edit anything that&apos;s off — this is the actual email,
            not a preview.
          </p>
          <ul className="mt-4 flex flex-col gap-4">
            {business.drafts
              .filter((d) => d.status === "pending")
              .map((d) => (
                <PendingDraftCard
                  key={d.id}
                  businessId={businessId}
                  draftId={d.id}
                  initialSubject={d.subject}
                  initialBody={d.body}
                  canSend={Boolean(business.contacts[0]?.email)}
                />
              ))}
          </ul>
        </section>
      )}

      <section className="card p-6">
        <h2 className="text-base font-semibold">History</h2>
        <ul className="mt-4 flex flex-col gap-2 text-sm">
          {business.drafts
            .filter((d) => d.status !== "pending")
            .map((d) => (
              <li key={d.id} className="rounded-lg border border-neutral-200 px-4 py-2.5 dark:border-neutral-800">
                <span className="font-medium text-neutral-900 dark:text-neutral-100">{d.subject}</span>{" "}
                <span className="text-neutral-500 dark:text-neutral-400">({d.status})</span>
              </li>
            ))}
          {business.communications.map((c) => (
            <li key={`c${c.id}`} className="rounded-lg border border-neutral-200 px-4 py-2.5 text-neutral-700 dark:border-neutral-800 dark:text-neutral-300">
              Sent {new Date(c.occurredAt).toLocaleString()}: {c.subject}
            </li>
          ))}
          {business.drafts.filter((d) => d.status !== "pending").length === 0 &&
            business.communications.length === 0 && <li className="text-neutral-500 dark:text-neutral-400">Nothing yet.</li>}
        </ul>
      </section>
    </div>
  );
}
