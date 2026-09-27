import { supabaseAdmin } from "@/lib/supabase/admin";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI = process.env.GOOGLE_OAUTH_REDIRECT_URI!;

export function getAuthUrl() {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: "https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function fetchJson<T>(url: string, init: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google request to ${url} failed (${res.status}): ${text.slice(0, 300)}`);
  }
  return res.json() as Promise<T>;
}

export async function exchangeCodeForTokens(code: string) {
  const tokens = await fetchJson<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  }>("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: REDIRECT_URI,
    }),
  });

  if (!tokens.refresh_token) {
    throw new Error(
      "Google didn't return a refresh token. Revoke prior access at myaccount.google.com/permissions and try connecting again.",
    );
  }

  const userinfo = await fetchJson<{ email?: string }>(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    { headers: { Authorization: `Bearer ${tokens.access_token}` } },
  );

  const { error } = await supabaseAdmin().from("oauth_tokens").upsert({
    provider: "google",
    refresh_token: tokens.refresh_token,
    account_email: userinfo.email ?? null,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;

  return userinfo.email ?? null;
}

export async function getConnectedAccountEmail(): Promise<string | null> {
  const { data } = await supabaseAdmin()
    .from("oauth_tokens")
    .select("account_email")
    .eq("provider", "google")
    .maybeSingle();
  return data?.account_email ?? null;
}

async function getAccessToken(refreshToken: string) {
  const tokens = await fetchJson<{ access_token: string }>("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  return tokens.access_token;
}

function toRawMessage(to: string, subject: string, body: string, fromEmail: string) {
  const lines = [
    `From: ${fromEmail}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "",
    body,
  ];
  return Buffer.from(lines.join("\r\n"))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function sendGmail({ to, subject, body }: { to: string; subject: string; body: string }) {
  const { data: record } = await supabaseAdmin()
    .from("oauth_tokens")
    .select("refresh_token, account_email")
    .eq("provider", "google")
    .maybeSingle();
  if (!record) {
    throw new Error("Gmail isn't connected yet. Visit /settings to connect your @k-reynolds.com account.");
  }

  const accessToken = await getAccessToken(record.refresh_token);
  const raw = toRawMessage(to, subject, body, record.account_email ?? "me");

  await fetchJson("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
  });
}
