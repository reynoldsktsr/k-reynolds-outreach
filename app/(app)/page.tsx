import Link from "next/link";
import { listBusinesses } from "@/lib/db";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  "new-lead": "bg-amber-100 text-amber-900",
  drafted: "bg-blue-100 text-blue-900",
  contacted: "bg-violet-100 text-violet-900",
  responded: "bg-teal-100 text-teal-900",
  "not-interested": "bg-neutral-200 text-neutral-700",
  won: "bg-green-100 text-green-900",
};

export default async function DashboardPage() {
  const businesses = await listBusinesses();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Businesses</h1>
        <span className="text-sm font-medium text-neutral-500">{businesses.length} tracked</span>
      </div>

      {businesses.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center text-sm text-neutral-500">
          No businesses yet. The daily research function will start populating this list once
          it&apos;s deployed and scheduled.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-neutral-200 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-5 py-3.5">Business</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">City</th>
                <th className="px-5 py-3.5">Gap</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {businesses.map((b) => (
                <tr key={b.id} className="hover:bg-neutral-50">
                  <td className="px-5 py-4">
                    <Link href={`/businesses/${b.id}`} className="font-medium text-neutral-900 hover:underline">
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
                  <td className="px-5 py-4 text-neutral-700">{b.category ?? "—"}</td>
                  <td className="px-5 py-4 text-neutral-700">{b.city ?? "—"}</td>
                  <td className="max-w-[32ch] px-5 py-4 text-neutral-700">{b.gapSummary ?? "—"}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
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
