/**
 * Admin audit log — an append-only record of who changed what, when.
 *
 * Deliberately records only *identifiers and outcomes*: entity type, entity id,
 * a short human summary, and the acting session id. Never passwords, tokens,
 * payment secrets, cookie values, or full request bodies.
 */
import { headers } from "next/headers";
import { readJson, writeJson } from "./storage";
import { getAdminSession } from "./admin-auth";
import { clientKeyFromHeaders } from "./admin-rate-limit";

const AUDIT_FILE = "admin-audit.json";
/** Keep the log bounded; the file store is not a time-series database. */
const MAX_ENTRIES = 5000;

/** The actions worth recording. Extend as new admin surfaces land. */
export type AuditAction =
  | "admin.login"
  | "admin.login_failed"
  | "admin.logout"
  | "property.created"
  | "property.edited"
  | "property.published"
  | "property.unpublished"
  | "property.deleted"
  | "property.approved"
  | "property.rejected"
  | "inquiry.status_changed"
  | "inquiry.note_saved"
  | "review.moderated"
  | "review.edited"
  | "review.deleted"
  | "review.replied"
  | "review.flagged"
  | "user.edited"
  | "user.deleted"
  | "user.host_granted"
  | "user.host_revoked"
  | "experience.created"
  | "experience.edited"
  | "experience.deleted"
  | "experience.status_changed"
  | "experience_host.edited"
  | "experience_host.deleted"
  | "journal.article_saved"
  | "journal.article_published"
  | "journal.article_unpublished"
  | "journal.article_deleted"
  | "collection.created"
  | "collection.edited"
  | "collection.deleted"
  | "location.created"
  | "location.deleted"
  | "amenity.changed"
  | "banner.changed";

export type AuditEntry = {
  id: string;
  at: string;
  action: AuditAction;
  /** Which record was touched, e.g. "villa" / "review" / "user". */
  entity?: string;
  entityId?: string;
  /** Short human-readable description shown in the admin UI. */
  summary?: string;
  /** Acting admin session id — ties a burst of changes to one login. */
  sid?: string;
  ip?: string;
};

/**
 * Appends one entry. Never throws: an audit failure must not take down the
 * admin action it was recording.
 */
export async function logAdminAction(input: {
  action: AuditAction;
  entity?: string;
  entityId?: string;
  summary?: string;
  /** Set explicitly for login/logout, where the session isn't resolvable yet. */
  sid?: string;
}): Promise<void> {
  try {
    let sid = input.sid;
    let ip: string | undefined;

    try {
      const h = await headers();
      ip = clientKeyFromHeaders(h);
    } catch {
      // Outside a request scope — fine, the entry just has no IP.
    }

    if (!sid) {
      try {
        sid = (await getAdminSession())?.sid;
      } catch {
        // Ditto.
      }
    }

    const entry: AuditEntry = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      at: new Date().toISOString(),
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      summary: input.summary,
      sid,
      ip,
    };

    const existing = await readJson<AuditEntry[]>(AUDIT_FILE, []);
    existing.unshift(entry); // newest first
    await writeJson(AUDIT_FILE, existing.slice(0, MAX_ENTRIES));
  } catch (err) {
    console.error("[admin-audit] failed to record entry", err);
  }
}

/** Reads the log, newest first. */
export async function getAuditLog(limit = 200): Promise<AuditEntry[]> {
  const all = await readJson<AuditEntry[]>(AUDIT_FILE, []);
  return all.slice(0, limit);
}
