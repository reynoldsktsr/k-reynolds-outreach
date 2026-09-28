import Link from "next/link";
import { listBusinesses, type Business } from "@/lib/db";
import { StatCard } from "@/components/stat-card";
import { DataTable, type DataTableColumn } from "@/components/data-table";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  "new-lead": "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300",
  drafted: "bg-blue-100 text-blue-900 dark:bg-blue-500/15 dark:text-blue-300",
  contacted: "bg-violet-100 text-violet-900 dark:bg-violet-500/15 dark:text-violet-300",
  responded: "bg-teal-100 text-teal-900 dark:bg-teal-500/15 dark:text-teal-300",
  "not-interested": "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  won: "bg-green-100 text-green-900 dark:bg-green-500/15 dark:text-green-300",
};

const STAT_GROUPS: { label: string; statuses: string[] }[] = [
  { label: "New leads", statuses: ["new-lead"] },
  { label: "In progress", statuses: ["drafted", "contacted", "responded"] },
  { label: "Won", statuses: ["won"] },
];

const columns: DataTableColumn<Business>[] = [
  {
    key: "name",
    header: "Business",
    accessor: (b) => b.name,
    sortable: true,
    render: (b) => (
      <>
        <Link href={`/businesses/${b.id}`} className="font-medium text-neutral-900 hover:underline dark:text-neutral-100">
          {b.name}
        </Link>
        {b.website && (
          <a
            href={b.website}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
          >
            site &#8599;
          </a>
        )}
      </>
    ),
  },
  { key: "category", header: "Category", accessor: (b) => b.category ?? "—", sortable: true },
  { key: "city", header: "City", accessor: (b) => b.city ?? "—", sortable: true },
  {
    key: "gap",
    header: "Gap",
    accessor: (b) => b.gapSummary ?? "",
    className: "max-w-[32ch]",
    render: (b) => b.gapSummary ?? "—",
  },
  {
    key: "status",
    header: "Status",
    accessor: (b) => b.status,
    sortable: true,
    render: (b) => (
      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[b.status] ?? "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"}`}>
        {b.status}
      </span>
    ),
  },
];

export default async function BusinessesPage() {
  const businesses = await listBusinesses();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Businesses</h1>
        <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{businesses.length} tracked</span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {STAT_GROUPS.map((group) => (
          <StatCard
            key={group.label}
            label={group.label}
            value={businesses.filter((b) => group.statuses.includes(b.status)).length}
          />
        ))}
      </div>

      {businesses.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400">
          No businesses yet. The daily research function will start populating this list once
          it&apos;s deployed and scheduled.
        </p>
      ) : (
        <DataTable
          columns={columns}
          rows={businesses}
          getRowId={(b) => b.id}
          searchPlaceholder="Search businesses..."
          emptyMessage="No businesses match your search."
          pageSize={10}
        />
      )}
    </div>
  );
}
