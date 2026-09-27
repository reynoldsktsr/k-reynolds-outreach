-- Run this once in the Supabase SQL editor (Project -> SQL Editor -> New query).
-- Mirrors the shape already used in lib/db.ts (Netlify Blobs version), so the
-- app code changes without changing what the data means.

create table businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  city text,
  address text,
  website text,
  source_note text,
  gap_summary text,
  status text not null default 'new-lead',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table contacts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text,
  email text,
  phone text,
  role text
);

create table drafts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  contact_id uuid references contacts(id) on delete set null,
  subject text not null,
  body text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  sent_at timestamptz
);

create table communications (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  contact_id uuid references contacts(id) on delete set null,
  draft_id uuid references drafts(id) on delete set null,
  direction text not null default 'outbound',
  channel text not null default 'email',
  subject text,
  body text,
  occurred_at timestamptz not null default now()
);

create table oauth_tokens (
  provider text primary key,
  refresh_token text not null,
  account_email text,
  updated_at timestamptz not null default now()
);

create index idx_contacts_business_id on contacts(business_id);
create index idx_drafts_business_id on drafts(business_id);
create index idx_drafts_status on drafts(status);
create index idx_communications_business_id on communications(business_id);

-- RLS enabled with no policies: only the service_role key (used server-side
-- only, in lib/supabase/admin.ts) can read/write. Anon/browser access is
-- blocked entirely, which is enough for a staff-only prototype - revisit
-- with real per-row policies once a client portal needs browser-side access.
alter table businesses enable row level security;
alter table contacts enable row level security;
alter table drafts enable row level security;
alter table communications enable row level security;
alter table oauth_tokens enable row level security;

-- Re-seed the researched Old Town Tustin businesses (same data as the old
-- /api/admin/seed endpoint, which this migration replaces).
insert into businesses (name, category, city, address, website, gap_summary, source_note, status) values
  ('Rasta-Cowboy Records', 'Record shop', 'Tustin, CA', '155 E. Main St', null,
   'No working website - the domain resolves to a dead placeholder page linking to an unrelated ''CyndirAI'' page.',
   '4.8 stars / 69 reviews confirm an active, well-regarded business with no real site.', 'new-lead'),
  ('Grace Music & Violin Shop', 'Music shop', 'Tustin, CA', '130 W. Main St', null,
   'No dedicated website found anywhere, despite being established since 1990.',
   'Checked directory listings and general search - no dedicated site found.', 'new-lead'),
  ('Tsurukawa Udon', 'Restaurant', 'Tustin, CA', 'The District at Tustin Legacy', null,
   'No dedicated website - only an Instagram account and aggregator listings (Yelp, etc.).',
   'Checked directory listings and general search - no dedicated site found.', 'new-lead'),
  ('Blondies Style', 'Clothing store', 'Tustin, CA', '155 El Camino Real', 'https://blondiesstyle.com',
   'Site returns completely empty content on repeated automated fetch attempts, despite being established since 1983.',
   'Confirmed empty response on two separate automated fetch attempts.', 'new-lead'),
  ('Johnny Jeans', 'Clothing store', 'Tustin, CA', null, 'https://clothingstoretustinca.com',
   'No e-commerce; a visible, unrendered {{placeholder_retargeting_pixel}} template tag is left live on the site.',
   'Confirmed via direct page fetch - template placeholder text renders on the live page.', 'new-lead'),
  ('Time Palace Jewelers', 'Jewelry / watch repair', 'Tustin, CA', null, 'https://1stwatchrepair.com',
   'No booking or e-commerce functionality on the site.',
   'Confirmed via direct page fetch.', 'new-lead'),
  ('Saddleback Flower Shop', 'Florist', 'Tustin, CA', null, 'https://saddlebackflowershop.net',
   'Site returns HTTP 403 to automated checks - couldn''t verify further remotely, needs an in-person look.',
   'Confirmed 403 response on automated fetch. Verify in person before pitching.', 'new-lead'),
  ('Surfas Ltd. Furriers', 'Furrier', 'Tustin, CA', null, 'https://surfasltdfurriers.com',
   'Domain permanently redirects to a different business (calfurandleather.com) - possible closure or rebrand, needs verification.',
   'Confirmed redirect via direct fetch. Verify the business still operates under this name before pitching.', 'new-lead'),
  ('Main Street Men''s Clothing', 'Clothing store', 'Tustin, CA', '148 W. Main St', null,
   'No dedicated website, and an August 2025 Facebook post said ''Saturday will be the last day'' - possible closure, needs verification.',
   'No site found in search; closure risk flagged from a public Facebook post. Verify the business is still open before pitching.', 'new-lead');
