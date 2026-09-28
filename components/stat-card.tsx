export function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card p-5">
      <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">{value}</p>
    </div>
  );
}
