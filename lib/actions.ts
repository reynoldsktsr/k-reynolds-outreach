"use server";

import { revalidatePath } from "next/cache";
import { getBusiness, saveBusiness } from "@/lib/db";
import { sendGmail } from "@/lib/gmail";

export async function updateBusinessStatus(businessId: string, status: string) {
  const business = await getBusiness(businessId);
  if (!business) throw new Error("Business not found");
  business.status = status;
  business.updatedAt = new Date().toISOString();
  await saveBusiness(business);
  revalidatePath("/");
  revalidatePath(`/businesses/${businessId}`);
}

export async function createContact(
  businessId: string,
  data: { name?: string; email?: string; phone?: string; role?: string },
) {
  const business = await getBusiness(businessId);
  if (!business) throw new Error("Business not found");
  business.contacts.push({
    id: crypto.randomUUID(),
    name: data.name || null,
    email: data.email || null,
    phone: data.phone || null,
    role: data.role || null,
  });
  business.updatedAt = new Date().toISOString();
  await saveBusiness(business);
  revalidatePath(`/businesses/${businessId}`);
}

export async function createDraft(
  businessId: string,
  data: { contactId?: string | null; subject: string; body: string },
) {
  const business = await getBusiness(businessId);
  if (!business) throw new Error("Business not found");
  const now = new Date().toISOString();
  business.drafts.unshift({
    id: crypto.randomUUID(),
    contactId: data.contactId ?? null,
    subject: data.subject,
    body: data.body,
    status: "pending",
    createdAt: now,
    reviewedAt: null,
    sentAt: null,
  });
  business.status = "drafted";
  business.updatedAt = now;
  await saveBusiness(business);
  revalidatePath("/queue");
  revalidatePath("/");
  revalidatePath(`/businesses/${businessId}`);
}

export async function discardDraft(businessId: string, draftId: string) {
  const business = await getBusiness(businessId);
  if (!business) throw new Error("Business not found");
  const draft = business.drafts.find((d) => d.id === draftId);
  if (draft) {
    draft.status = "discarded";
    draft.reviewedAt = new Date().toISOString();
    await saveBusiness(business);
  }
  revalidatePath("/queue");
}

export async function approveAndSendDraft(businessId: string, draftId: string) {
  const business = await getBusiness(businessId);
  if (!business) throw new Error("Business not found");
  const draft = business.drafts.find((d) => d.id === draftId);
  if (!draft) throw new Error("Draft not found");
  const contact = business.contacts.find((c) => c.id === draft.contactId) ?? null;
  if (!contact?.email) {
    throw new Error("This draft has no contact email on file yet — add one before sending.");
  }

  await sendGmail({ to: contact.email, subject: draft.subject, body: draft.body });

  const now = new Date().toISOString();
  draft.status = "sent";
  draft.reviewedAt = now;
  draft.sentAt = now;
  business.communications.unshift({
    id: crypto.randomUUID(),
    contactId: contact.id,
    draftId: draft.id,
    direction: "outbound",
    channel: "email",
    subject: draft.subject,
    body: draft.body,
    occurredAt: now,
  });
  business.status = "contacted";
  business.updatedAt = now;
  await saveBusiness(business);

  revalidatePath("/queue");
  revalidatePath("/");
  revalidatePath(`/businesses/${businessId}`);
}
