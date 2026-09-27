import { supabaseAdmin } from "@/lib/supabase/admin";

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

export type Report = {
  id: string;
  businessId: string;
  kind: "no-site-pitch" | "stack-analysis";
  content: string;
  createdAt: string;
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

const STATUS_ORDER = ["new-lead", "drafted", "contacted", "responded"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapContact(row: any): Contact {
  return { id: row.id, name: row.name, email: row.email, phone: row.phone, role: row.role };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDraft(row: any): Draft {
  return {
    id: row.id,
    contactId: row.contact_id,
    subject: row.subject,
    body: row.body,
    status: row.status,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
    sentAt: row.sent_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCommunication(row: any): Communication {
  return {
    id: row.id,
    contactId: row.contact_id,
    draftId: row.draft_id,
    direction: row.direction,
    channel: row.channel,
    subject: row.subject,
    body: row.body,
    occurredAt: row.occurred_at,
  };
}

function mapBusiness(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  row: any,
  contacts: Contact[] = [],
  drafts: Draft[] = [],
  communications: Communication[] = [],
): Business {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    city: row.city,
    address: row.address,
    website: row.website,
    sourceNote: row.source_note,
    gapSummary: row.gap_summary,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    contacts,
    drafts,
    communications,
  };
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
  const { data, error } = await supabaseAdmin().from("businesses").select("*");
  if (error) throw error;
  return (data ?? []).map((r) => mapBusiness(r)).sort(sortBusinesses);
}

export async function getBusiness(id: string): Promise<Business | null> {
  const db = supabaseAdmin();
  const [
    { data: biz, error: bizErr },
    { data: contacts, error: cErr },
    { data: drafts, error: dErr },
    { data: comms, error: coErr },
  ] = await Promise.all([
    db.from("businesses").select("*").eq("id", id).maybeSingle(),
    db.from("contacts").select("*").eq("business_id", id).order("id"),
    db.from("drafts").select("*").eq("business_id", id).order("created_at", { ascending: false }),
    db.from("communications").select("*").eq("business_id", id).order("occurred_at", { ascending: false }),
  ]);
  if (bizErr) throw bizErr;
  if (!biz) return null;
  if (cErr) throw cErr;
  if (dErr) throw dErr;
  if (coErr) throw coErr;

  return mapBusiness(
    biz,
    (contacts ?? []).map(mapContact),
    (drafts ?? []).map(mapDraft),
    (comms ?? []).map(mapCommunication),
  );
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
  const { data: row, error } = await supabaseAdmin()
    .from("businesses")
    .insert({
      name: data.name,
      category: data.category ?? null,
      city: data.city ?? null,
      address: data.address ?? null,
      website: data.website ?? null,
      source_note: data.sourceNote ?? null,
      gap_summary: data.gapSummary ?? null,
      status: data.status ?? "new-lead",
    })
    .select()
    .single();
  if (error) throw error;
  return mapBusiness(row);
}

export async function updateBusinessFields(
  id: string,
  data: {
    name: string;
    category: string | null;
    city: string | null;
    address: string | null;
    website: string | null;
    gapSummary: string | null;
    sourceNote: string | null;
  },
): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("businesses")
    .update({
      name: data.name,
      category: data.category,
      city: data.city,
      address: data.address,
      website: data.website,
      gap_summary: data.gapSummary,
      source_note: data.sourceNote,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapReport(row: any): Report {
  return {
    id: row.id,
    businessId: row.business_id,
    kind: row.kind,
    content: row.content,
    createdAt: row.created_at,
  };
}

export async function listReports(businessId: string): Promise<Report[]> {
  const { data, error } = await supabaseAdmin()
    .from("reports")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapReport);
}

export async function createReport(
  businessId: string,
  kind: Report["kind"],
  content: string,
): Promise<Report> {
  const { data, error } = await supabaseAdmin()
    .from("reports")
    .insert({ business_id: businessId, kind, content })
    .select()
    .single();
  if (error) throw error;
  return mapReport(data);
}

export type QueueRow = { business: Business; draft: Draft; contact: Contact | null };

export async function listPendingDrafts(): Promise<QueueRow[]> {
  const { data, error } = await supabaseAdmin()
    .from("drafts")
    .select("*, businesses(*), contacts(*)")
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  if (error) throw error;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => ({
    business: mapBusiness(row.businesses),
    draft: mapDraft(row),
    contact: row.contacts ? mapContact(row.contacts) : null,
  }));
}
