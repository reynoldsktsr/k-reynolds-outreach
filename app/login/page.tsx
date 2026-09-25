export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="text-xl font-semibold">Outreach</h1>
      <p className="mt-1 text-sm text-neutral-600">Enter the password to continue.</p>
      {params.error && (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Wrong password.
        </p>
      )}
      <form action="/api/session" method="POST" className="mt-4 flex flex-col gap-2">
        <input type="hidden" name="next" value={params.next ?? "/"} />
        <input
          type="password"
          name="password"
          autoFocus
          required
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <button className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-700">
          Continue
        </button>
      </form>
    </div>
  );
}
