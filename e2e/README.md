# e2e tests

Playwright specs covering every page: login, the businesses dashboard (search/sort,
stat cards, follow-up badges, manual add, bulk actions, CSV export), business detail
(edit, add/select contact, domain check, analysis, contact search, pitch generation,
draft edit/save/send/discard, mark-as-replied), the review queue, settings (including
on-demand lead research), dark mode, the command palette, and navigation/sign-out.

Unit tests for the pure logic these pages depend on (domain slugging, text
extraction, demo-site matching, follow-up timing, CSV escaping) live alongside their
modules as `lib/*.test.ts` and run with `npm test` (Vitest) - much faster than a
browser test, so prefer adding there for anything that doesn't need a real page.

## Safety design

These tests run against the **real** Supabase project and Next.js app - there's no
separate staging environment. Two things keep that safe:

- **Isolated test data.** `global-setup.ts` seeds one uniquely-named business
  (`E2E Test Business <run id>`) before the suite runs and `global-teardown.ts` deletes
  it afterward. That delete cascades to any contacts/drafts/communications/reports
  created against it. The suite never touches the real seeded leads. The one exception
  is `new-features.spec.ts`'s manual-add test, which creates and immediately searches
  for its own throwaway business by a timestamped name - consider cleaning those up
  periodically if you run this suite often against a long-lived database.
- **Test-mode stubs.** The webServer is started with `E2E_TEST_MODE=1`, which makes
  `lib/gmail.ts` (`sendGmail`), `lib/analysis.ts` (`analyzeBusiness`,
  `discoverContact`, `generatePitchEmail`), and `lib/lead-research.ts`
  (`runLeadResearch`, used by the Settings page's on-demand trigger) return
  deterministic fake data instead of calling the real Gmail, Anthropic, or web search
  APIs. No real email ever sends and no API credits are spent by running this suite.

## Required environment variables

```
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SECRET_KEY
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
E2E_ADMIN_EMAIL         # a real staff login for the Supabase project under test
E2E_ADMIN_PASSWORD
```

The first three are the same values the app itself needs to run. Never hardcode
`E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD` anywhere - pass them as env vars (a local
`.env.local` that's gitignored, or CI secrets).

## Running

```bash
npm run test:e2e       # headless, against a locally started `next dev`
npm run test:e2e:ui    # Playwright's interactive UI mode
```

To run against an already-deployed environment instead of starting a local dev
server, set `E2E_BASE_URL` (e.g. `E2E_BASE_URL=https://outreach.k-reynolds.com`).
Note that on a real deployment, `E2E_TEST_MODE` needs to be set in that
environment's own env vars for the Gmail/Anthropic stubs to kick in - don't point
this at production without it, or "approve & send" will send a real email.
