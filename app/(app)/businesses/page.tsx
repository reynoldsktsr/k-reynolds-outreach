import { listBusinesses } from "@/lib/db";
import { StatCard } from "@/components/stat-card";
import { AddBusinessModal } from "./add-business-modal";
import { ExportCsvButton } from "./export-csv-button";
import { BusinessesTable } from "./businesses-table";
import { needsFollowUp } from "@/lib/followup";

export const dynamic = "force-dynamic";

const STAT_GROUPS: { label: string; statuses: string[] }[] = [
  { label: "New leads", statuses: ["new-lead"] },
  { label: "In progress", statuses: ["drafted", "contacted", "responded"] },
  { label: "Won", statuses: ["won"] },
];

export default async function BusinessesPage() {
  const businesses = await listBusinesses();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Businesses</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{businesses.length} tracked</span>
          <ExportCsvButton businesses={businesses} />
          <AddBusinessModal />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_GROUPS.map((group) => (
          <StatCard
            key={group.label}
            label={group.label}
            value={businesses.filter((b) => group.statuses.includes(b.status)).length}
          />
        ))}
        <StatCard label="Needs follow-up" value={businesses.filter((b) => needsFollowUp(b)).length} />
      </div>

      {businesses.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400">
          No businesses yet. The daily research function will start populating this list once
          it&apos;s deployed and scheduled.
        </p>
      ) : (
        <BusinessesTable businesses={businesses} />
      )}
    </div>
  );
}
