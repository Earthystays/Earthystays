import { randomBytes } from "crypto";
import { readJson, writeJson } from "@/lib/storage";

export type ThreadMessage = {
  id: string;
  sender: "guest" | "host";
  body: string;
  at: string; // ISO timestamp
};

/**
 * One thread per booking request (inquiry). Only inquiries submitted by a
 * signed-in guest are messageable — anonymous inquiries have no account to
 * deliver replies to, so no thread is ever created for them.
 */
export type MessageThread = {
  id: string;
  inquiryId: string;
  villaSlug: string;
  hostId: string;
  guestUserId: string;
  createdAt: string;
  lastMessageAt: string;
  /** Last time each side opened the thread — drives unread indicators. */
  guestReadAt?: string;
  hostReadAt?: string;
  messages: ThreadMessage[];
};

export type ThreadViewer = "guest" | "host";

const FILE = "message-threads.json";

/**
 * Serialize all read-modify-write cycles on the threads file. Polling GETs
 * (mark read) and sends (append) can land in the same tick; without this,
 * one write clobbers the other's update.
 */
let writeQueue: Promise<unknown> = Promise.resolve();
function withThreadsLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = writeQueue.then(fn, fn);
  writeQueue = run.catch(() => undefined);
  return run;
}

export async function getThreads(): Promise<MessageThread[]> {
  return readJson<MessageThread[]>(FILE, []);
}

export async function getThread(id: string): Promise<MessageThread | undefined> {
  const threads = await getThreads();
  return threads.find((t) => t.id === id);
}

export async function getThreadByInquiry(inquiryId: string): Promise<MessageThread | undefined> {
  const threads = await getThreads();
  return threads.find((t) => t.inquiryId === inquiryId);
}

function byLastMessage(a: MessageThread, b: MessageThread): number {
  return a.lastMessageAt < b.lastMessageAt ? 1 : -1;
}

export async function getThreadsForHost(hostId: string): Promise<MessageThread[]> {
  const threads = await getThreads();
  return threads.filter((t) => t.hostId === hostId).sort(byLastMessage);
}

export async function getThreadsForGuest(guestUserId: string): Promise<MessageThread[]> {
  const threads = await getThreads();
  return threads.filter((t) => t.guestUserId === guestUserId).sort(byLastMessage);
}

/** Find the thread for a booking request, creating an empty one if needed. */
export async function ensureThread(input: {
  inquiryId: string;
  villaSlug: string;
  hostId: string;
  guestUserId: string;
}): Promise<MessageThread> {
  return withThreadsLock(async () => {
    const threads = await getThreads();
    const existing = threads.find((t) => t.inquiryId === input.inquiryId);
    if (existing) return existing;

    const now = new Date().toISOString();
    const thread: MessageThread = {
      id: `thr_${Date.now()}_${randomBytes(4).toString("hex")}`,
      ...input,
      createdAt: now,
      lastMessageAt: now,
      messages: [],
    };
    threads.push(thread);
    await writeJson(FILE, threads);
    return thread;
  });
}

export async function appendMessage(
  threadId: string,
  sender: ThreadViewer,
  body: string,
): Promise<MessageThread | undefined> {
  return withThreadsLock(async () => {
    const threads = await getThreads();
    const thread = threads.find((t) => t.id === threadId);
    if (!thread) return undefined;

    const now = new Date().toISOString();
    thread.messages.push({
      id: `msg_${Date.now()}_${randomBytes(3).toString("hex")}`,
      sender,
      body,
      at: now,
    });
    thread.lastMessageAt = now;
    // Sending implies you've seen everything up to now.
    if (sender === "guest") thread.guestReadAt = now;
    else thread.hostReadAt = now;
    await writeJson(FILE, threads);
    return thread;
  });
}

export async function markThreadRead(threadId: string, viewer: ThreadViewer): Promise<void> {
  return withThreadsLock(async () => {
    const threads = await getThreads();
    const thread = threads.find((t) => t.id === threadId);
    // Polls call this every few seconds — only touch disk when something
    // is actually unread.
    if (!thread || unreadCount(thread, viewer) === 0) return;
    const now = new Date().toISOString();
    if (viewer === "guest") thread.guestReadAt = now;
    else thread.hostReadAt = now;
    await writeJson(FILE, threads);
  });
}

/** Messages from the other side newer than the viewer's last read. */
export function unreadCount(thread: MessageThread, viewer: ThreadViewer): number {
  const readAt = viewer === "guest" ? thread.guestReadAt : thread.hostReadAt;
  const other = viewer === "guest" ? "host" : "guest";
  return thread.messages.filter((m) => m.sender === other && (!readAt || m.at > readAt)).length;
}
