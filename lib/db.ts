import { getStore } from "@netlify/blobs";

export type Contact = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
};

export type Draft = {
  id: string;
  contactId: string | null;
  subject: string;
  body: string;
  status: "pending" | "sent" | "discarded";
  createdAt: string;
  reviewedAt: string | null;
  sentAt: string | null;
};

export type Communication = {
  id: string;
  contactId: string | null;
  draftId: string | null;
  direction: string;
  channel: string;
  subject: string | null;
  body: string | null;
  occurredAt: string;
};

export type Business = {
  id: string;
  name: string;
  category: string | null;
  city: string | null;
  address: string | null;
  website: string | null;
  sourceNote: string | null;
  gapSummary: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  contacts: Contact[];
  drafts: Draft[];
  communications: Communication[];
};

const BUSINESS_PREFIX = "business/";
const STATUS_ORDER = ["new-lead", "drafted", "contacted", "responded"];

export function store() {
  return getStore("outreach");
}

function sortBusinesses(a: Business, b: Business) {
  const aRank = STATUS_ORDER.indexOf(a.status);
  const bRank = STATUS_ORDER.indexOf(b.status);
  const aOrder = aRank === -1 ? STATUS_ORDER.length : aRank;
  const bOrder = bRank === -1 ? STATUS_ORDER.length : bRank;
  if (aOrder !== bOrder) return aOrder - bOrder;
  return b.createdAt.localeCompare(a.createdAt);
}

export async function listBusinesses(): Promise<Business[]> {
  const s = store();
  const { blobs } = await s.list({ prefix: BUSINESS_PREFIX });
  const businesses = await Promise.all(
    blobs.map((b) => s.get(b.key, { type: "json" }) as Promise<Business | null>),
  );
  return businesses.filter((b): b is Business => b != null).sort(sortBusinesses);
}

export async function getBusiness(id: string): Promise<Business | null> {
  return (await store().get(BUSINESS_PREFIX + id, { type: "json" })) as Business | null;
}

export async function saveBusiness(business: Business): Promise<void> {
  await store().setJSON(BUSINESS_PREFIX + business.id, business);
}

export async function createBusiness(data: {
  name: string;
  category?: string | null;
  city?: string | null;
  address?: string | null;
  website?: string | null;
  sourceNote?: string | null;
  gapSummary?: string | null;
  status?: string;
}): Promise<Business> {
  const now = new Date().toISOString();
  const business: Business = {
    id: crypto.randomUUID(),
    name: data.name,
    category: data.category ?? null,
    city: data.city ?? null,
    address: data.address ?? null,
    website: data.website ?? null,
    sourceNote: data.sourceNote ?? null,
    gapSummary: data.gapSummary ?? null,
    status: data.status ?? "new-lead",
    createdAt: now,
    updatedAt: now,
    contacts: [],
    drafts: [],
    communications: [],
  };
  await saveBusiness(business);
  return business;
}

export type QueueRow = { business: Business; draft: Draft; contact: Contact | null };

export async function listPendingDrafts(): Promise<QueueRow[]> {
  const businesses = await listBusinesses();
  const rows: QueueRow[] = [];
  for (const business of businesses) {
    for (const draft of business.drafts) {
      if (draft.status === "pending") {
        const contact = business.contacts.find((c) => c.id === draft.contactId) ?? null;
        rows.push({ business, draft, contact });
      }
    }
  }
  rows.sort((a, b) => a.draft.createdAt.localeCompare(b.draft.createdAt));
  return rows;
}
