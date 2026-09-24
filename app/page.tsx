import Link from "next/link";
import { listBusinesses } from "@/lib/db";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  "new-lead": "bg-amber-100 text-amber-800",
  drafted: "bg-blue-100 text-blue-800",
  contacted: "bg-violet-100 text-violet-800",
  responded: "bg-teal-100 text-teal-800",
  "not-interested": "bg-neutral-200 text-neutral-600",
  won: "bg-green-100 text-green-800",
};

export default async function DashboardPage() {
  const businesses = await listBusinesses();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Businesses</h1>
        <span className="text-sm text-neutral-500">{businesses.length} tracked</span>
      </div>

      {businesses.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
          No businesses yet. The daily research function will start populating this list once
          it&apos;s deployed and scheduled.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Business</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Gap</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {businesses.map((b) => (
                <tr key={b.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/businesses/${b.id}`} className="font-medium hover:underline">
                      {b.name}
                    </Link>
                    {b.website && (
                      <a
                        href={b.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-xs text-neutral-400 hover:text-neutral-600"
                      >
                        site ↗
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{b.category ?? "—"}</td>
                  <td className="px-4 py-3 text-neutral-600">{b.city ?? "—"}</td>
                  <td className="max-w-[28ch] px-4 py-3 text-neutral-600">{b.gapSummary ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        STATUS_STYLES[b.status] ?? "bg-neutral-100 text-neutral-700"
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
