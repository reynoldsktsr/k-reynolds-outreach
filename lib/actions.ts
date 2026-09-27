"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendGmail } from "@/lib/gmail";
import { getBusiness, createReport, updateBusinessFields } from "@/lib/db";
import { analyzeBusiness } from "@/lib/analysis";
import { checkDomainAvailability, type DomainStatus } from "@/lib/domains";

export async function updateBusinessStatus(businessId: string, status: string) {
  const { error } = await supabaseAdmin()
    .from("businesses")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", businessId);
  if (error) throw error;
  revalidatePath("/");
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
  revalidatePath("/");
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
  revalidatePath("/");
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
  if (!draft.contacts?.email) {
    throw new Error("This draft has no contact email on file yet — add one before sending.");
  }

  await sendGmail({ to: draft.contacts.email, subject: draft.subject, body: draft.body });

  const now = new Date().toISOString();
  const { error: updateErr } = await db
    .from("drafts")
    .update({ status: "sent", reviewed_at: now, sent_at: now })
    .eq("id", draftId);
  if (updateErr) throw updateErr;

  const { error: commErr } = await db.from("communications").insert({
    business_id: businessId,
    contact_id: draft.contact_id,
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
  revalidatePath("/");
  revalidatePath(`/businesses/${businessId}`);
}
