"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendGmail } from "@/lib/gmail";
import { getBusiness, createBusiness, createReport, listReports, updateBusinessFields, listBusinessNames } from "@/lib/db";
import { analyzeBusiness, discoverContact, generatePitchEmail } from "@/lib/analysis";
import { checkDomainAvailability, type DomainStatus } from "@/lib/domains";
import { runLeadResearch } from "@/lib/lead-research";

export async function getBusinessesForPalette(): Promise<{ id: string; name: string }[]> {
  return listBusinessNames();
}

export async function addBusiness(data: {
  name: string;
  category?: string;
  city?: string;
  address?: string;
  website?: string;
  gapSummary?: string;
}): Promise<{ id: string }> {
  if (!data.name.trim()) throw new Error("A business name is required.");
  const business = await createBusiness({
    name: data.name.trim(),
    category: data.category || null,
    city: data.city || null,
    address: data.address || null,
    website: data.website || null,
    gapSummary: data.gapSummary || null,
    sourceNote: "added manually",
    status: "new-lead",
  });
  revalidatePath("/businesses");
  return { id: business.id };
}

export async function markReplied(businessId: string, note?: string) {
  const now = new Date().toISOString();
  const db = supabaseAdmin();

  const { error: commErr } = await db.from("communications").insert({
    business_id: businessId,
    direction: "inbound",
    channel: "email",
    subject: null,
    body: note?.trim() || null,
    occurred_at: now,
  });
  if (commErr) throw commErr;

  const { error: bizErr } = await db
    .from("businesses")
    .update({ status: "responded", updated_at: now })
    .eq("id", businessId);
  if (bizErr) throw bizErr;

  revalidatePath("/businesses");
  revalidatePath(`/businesses/${businessId}`);
}

export async function runLeadResearchNow(): Promise<{ inserted: number; candidatesFound: number }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set.");

  const city = process.env.OUTREACH_CITY ?? "Tustin, CA";
  const result = await runLeadResearch({ apiKey, city, maxNew: 5 });
  revalidatePath("/businesses");
  return result;
}

export async function bulkUpdateStatus(businessIds: string[], status: string): Promise<{ updated: number }> {
  if (businessIds.length === 0) return { updated: 0 };
  const { error, count } = await supabaseAdmin()
    .from("businesses")
    .update({ status, updated_at: new Date().toISOString() }, { count: "exact" })
    .in("id", businessIds);
  if (error) throw error;
  revalidatePath("/businesses");
  return { updated: count ?? businessIds.length };
}

export async function updateBusinessStatus(businessId: string, status: string) {
  const { error } = await supabaseAdmin()
    .from("businesses")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", businessId);
  if (error) throw error;
  revalidatePath("/businesses");
  revalidatePath(`/businesses/${businessId}`);
}

export async function generateReport(businessId: string) {
  const business = await getBusiness(businessId);
  if (!business) throw new Error("Business not found");

  const result = await analyzeBusiness(business);
  await createReport(businessId, result.kind, result.content);

  if (business.contacts.length === 0 && (result.extractedEmail || result.extractedPhone)) {
    const { error } = await supabaseAdmin().from("contacts").insert({
      business_id: businessId,
      email: result.extractedEmail,
      phone: result.extractedPhone,
    });
    if (error) throw error;
  }

  revalidatePath(`/businesses/${businessId}`);
}

export async function checkDomains(businessName: string): Promise<DomainStatus[]> {
  return checkDomainAvailability(businessName);
}

export async function findContact(businessId: string) {
  const business = await getBusiness(businessId);
  if (!business) throw new Error("Business not found");

  const result = await discoverContact(business);
  await createReport(businessId, "contact-discovery", result.summary);

  if (business.contacts.length === 0 && (result.email || result.phone || result.name)) {
    const { error } = await supabaseAdmin().from("contacts").insert({
      business_id: businessId,
      name: result.name,
      email: result.email,
      phone: result.phone,
    });
    if (error) throw error;
  }

  revalidatePath(`/businesses/${businessId}`);
}

export async function generatePitch(businessId: string, contactId?: string | null) {
  const business = await getBusiness(businessId);
  if (!business) throw new Error("Business not found");

  const reports = await listReports(businessId);
  const latestAnalysis = reports.find((r) => r.kind === "no-site-pitch" || r.kind === "stack-analysis");
  // An explicit contactId picks who this pitch is for. Otherwise only
  // default to a contact when there's exactly one on file - with several
  // contacts, guessing which person the email is "for" is worse than
  // addressing the business generically and letting the sender pick a
  // contact when they send it.
  const contact = contactId
    ? (business.contacts.find((c) => c.id === contactId) ?? null)
    : business.contacts.length === 1
      ? business.contacts[0]
      : null;

  const { subject, body } = await generatePitchEmail(business, latestAnalysis?.content ?? null, contact?.name ?? null);

  const { error: draftErr } = await supabaseAdmin().from("drafts").insert({
    business_id: businessId,
    contact_id: contact?.id ?? null,
    subject,
    body,
    status: "pending",
  });
  if (draftErr) throw draftErr;

  const { error: bizErr } = await supabaseAdmin()
    .from("businesses")
    .update({ status: "drafted", updated_at: new Date().toISOString() })
    .eq("id", businessId);
  if (bizErr) throw bizErr;

  revalidatePath("/queue");
  revalidatePath("/businesses");
  revalidatePath(`/businesses/${businessId}`);
}

export async function editBusiness(
  businessId: string,
  data: {
    name: string;
    category: string;
    city: string;
    address: string;
    website: string;
    gapSummary: string;
    sourceNote: string;
  },
) {
  await updateBusinessFields(businessId, {
    name: data.name,
    category: data.category || null,
    city: data.city || null,
    address: data.address || null,
    website: data.website || null,
    gapSummary: data.gapSummary || null,
    sourceNote: data.sourceNote || null,
  });
  revalidatePath("/businesses");
  revalidatePath(`/businesses/${businessId}`);
}

export async function createContact(
  businessId: string,
  data: { name?: string; email?: string; phone?: string; role?: string },
) {
  const { error } = await supabaseAdmin().from("contacts").insert({
    business_id: businessId,
    name: data.name || null,
    email: data.email || null,
    phone: data.phone || null,
    role: data.role || null,
  });
  if (error) throw error;
  revalidatePath(`/businesses/${businessId}`);
}

export async function createDraft(
  businessId: string,
  data: { contactId?: string | null; subject: string; body: string },
) {
  const db = supabaseAdmin();
  const { error: draftErr } = await db.from("drafts").insert({
    business_id: businessId,
    contact_id: data.contactId ?? null,
    subject: data.subject,
    body: data.body,
    status: "pending",
  });
  if (draftErr) throw draftErr;

  const { error: bizErr } = await db
    .from("businesses")
    .update({ status: "drafted", updated_at: new Date().toISOString() })
    .eq("id", businessId);
  if (bizErr) throw bizErr;

  revalidatePath("/queue");
  revalidatePath("/businesses");
  revalidatePath(`/businesses/${businessId}`);
}

export async function updateDraft(
  businessId: string,
  draftId: string,
  data: { subject: string; body: string; contactId?: string | null },
) {
  const update: { subject: string; body: string; contact_id?: string | null } = {
    subject: data.subject,
    body: data.body,
  };
  if (data.contactId !== undefined) update.contact_id = data.contactId;

  const { error } = await supabaseAdmin().from("drafts").update(update).eq("id", draftId);
  if (error) throw error;
  revalidatePath("/queue");
  revalidatePath(`/businesses/${businessId}`);
}

export async function discardDraft(businessId: string, draftId: string) {
  const { error } = await supabaseAdmin()
    .from("drafts")
    .update({ status: "discarded", reviewed_at: new Date().toISOString() })
    .eq("id", draftId);
  if (error) throw error;
  revalidatePath("/queue");
  revalidatePath(`/businesses/${businessId}`);
}

export async function approveAndSendDraft(businessId: string, draftId: string) {
  const db = supabaseAdmin();
  const { data: draft, error: draftErr } = await db
    .from("drafts")
    .select("*, contacts(*)")
    .eq("id", draftId)
    .single();
  if (draftErr) throw draftErr;

  // A draft generated before a contact was found has no email of its own to
  // fall back on - use the business's contact on file instead, but only
  // when that's unambiguous. With more than one contact, silently guessing
  // which real person gets the email is worse than asking - throw instead.
  let contactEmail = draft.contacts?.email as string | null | undefined;
  let contactId = draft.contact_id as string | null;
  if (!contactEmail) {
    const { data: candidates } = await db
      .from("contacts")
      .select("id, email")
      .eq("business_id", businessId)
      .not("email", "is", null);
    if (candidates && candidates.length === 1) {
      contactEmail = candidates[0].email;
      contactId = candidates[0].id;
    } else if (candidates && candidates.length > 1) {
      throw new Error(
        "This draft isn't linked to a specific contact and this business has more than one on file — edit the draft's contact before sending.",
      );
    }
  }
  if (!contactEmail) {
    throw new Error("This draft has no contact email on file yet — add one before sending.");
  }

  await sendGmail({ to: contactEmail, subject: draft.subject, body: draft.body });

  const now = new Date().toISOString();
  const { error: updateErr } = await db
    .from("drafts")
    .update({ status: "sent", reviewed_at: now, sent_at: now, contact_id: contactId })
    .eq("id", draftId);
  if (updateErr) throw updateErr;

  const { error: commErr } = await db.from("communications").insert({
    business_id: businessId,
    contact_id: contactId,
    draft_id: draftId,
    direction: "outbound",
    channel: "email",
    subject: draft.subject,
    body: draft.body,
    occurred_at: now,
  });
  if (commErr) throw commErr;

  const { error: bizErr } = await db
    .from("businesses")
    .update({ status: "contacted", updated_at: now })
    .eq("id", businessId);
  if (bizErr) throw bizErr;

  revalidatePath("/queue");
  revalidatePath("/businesses");
  revalidatePath(`/businesses/${businessId}`);
}
