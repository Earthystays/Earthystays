"use server";

import { revalidatePath } from "next/cache";
import { readJson, writeJson } from "@/lib/storage";
import { getCurrentUser } from "@/lib/session";
import { getVillasByHost } from "@/lib/data/villas";
import { ensureThread } from "@/lib/data/messages";
import { notifyGuestOfDecision } from "@/lib/notify";
import type { StoredInquiry } from "@/app/api/inquiries/route";

export async function decideRequest(
  inquiryId: string,
  decision: "accepted" | "declined",
): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user?.isHost) return { ok: false, error: "Not signed in as a host" };

  const mySlugs = new Set(getVillasByHost(user.id).map((v) => v.slug));
  const inquiries = await readJson<StoredInquiry[]>("inquiries.json", []);
  const idx = inquiries.findIndex((q) => q.id === inquiryId);
  if (idx < 0) return { ok: false, error: "Request not found" };
  if (!inquiries[idx].villa || !mySlugs.has(inquiries[idx].villa)) {
    return { ok: false, error: "This request isn't for one of your listings" };
  }

  inquiries[idx].hostDecision = decision;
  inquiries[idx].updatedAt = new Date().toISOString();
  await writeJson("inquiries.json", inquiries);

  const villa = getVillasByHost(user.id).find((v) => v.slug === inquiries[idx].villa);
  if (villa) await notifyGuestOfDecision(villa, inquiries[idx], decision);

  revalidatePath("/host");
  revalidatePath("/host/bookings");
  revalidatePath("/admin/inquiries");
  return { ok: true };
}

/** Find or create the message thread for a booking request on one of the
 *  host's listings, so the UI can navigate straight into the conversation. */
export async function openThreadForInquiry(
  inquiryId: string,
): Promise<{ ok: boolean; threadId?: string; error?: string }> {
  const user = await getCurrentUser();
  if (!user?.isHost) return { ok: false, error: "Not signed in as a host" };

  const mySlugs = new Set(getVillasByHost(user.id).map((v) => v.slug));
  const inquiries = await readJson<StoredInquiry[]>("inquiries.json", []);
  const inquiry = inquiries.find((q) => q.id === inquiryId);
  if (!inquiry) return { ok: false, error: "Request not found" };
  if (!inquiry.villa || !mySlugs.has(inquiry.villa)) {
    return { ok: false, error: "This request isn't for one of your listings" };
  }
  if (!inquiry.guestUserId) {
    return { ok: false, error: "This guest booked without an account — reach them via the concierge team" };
  }

  const thread = await ensureThread({
    inquiryId: inquiry.id,
    villaSlug: inquiry.villa,
    hostId: user.id,
    guestUserId: inquiry.guestUserId,
  });
  return { ok: true, threadId: thread.id };
}
