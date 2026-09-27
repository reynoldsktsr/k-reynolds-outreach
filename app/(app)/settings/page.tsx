import { getConnectedAccountEmail } from "@/lib/gmail";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const params = await searchParams;
  const connectedEmail = await getConnectedAccountEmail();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      {params.error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {decodeURIComponent(params.error)}
        </p>
      )}
      {params.connected && (
        <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Connected as {decodeURIComponent(params.connected)}.
        </p>
      )}

      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold">Gmail sending</h2>
        <p className="mt-1.5 text-sm text-neutral-700">
          {connectedEmail
            ? `Connected: sending from ${connectedEmail}.`
            : "Not connected yet. Approved drafts can't send until this account is connected."}
        </p>
        <a
          href="/api/auth/google/start"
          className="mt-4 inline-block rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          {connectedEmail ? "Reconnect" : "Connect @k-reynolds.com"}
        </a>
        <p className="mt-4 text-xs text-neutral-500">
          Requires GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_OAUTH_REDIRECT_URI set as
          environment variables (from a Google Cloud OAuth client with the Gmail API enabled and
          this account added as a test user, scope{" "}
          <code className="rounded bg-neutral-100 px-1">gmail.send</code>).
        </p>
      </div>
    </div>
  );
}
