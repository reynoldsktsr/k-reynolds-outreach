import { signIn } from "@/lib/auth-actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center bg-neutral-50 px-6 dark:bg-neutral-950">
      <div className="card p-8">
        <h1 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">Outreach</h1>
        <p className="mt-1.5 text-sm text-neutral-600 dark:text-neutral-400">Sign in to continue.</p>
        {params.error && (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            {decodeURIComponent(params.error)}
          </p>
        )}
        <form action={signIn} className="mt-5 flex flex-col gap-2.5">
          <input type="hidden" name="next" value={params.next ?? "/businesses"} />
          <input type="email" name="email" placeholder="Email" autoFocus required className="input" />
          <input type="password" name="password" placeholder="Password" required className="input" />
          <button className="btn-primary mt-1">Sign in</button>
        </form>
      </div>
    </div>
  );
}
