import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/session";
import {
  appendMessage,
  getThread,
  markThreadRead,
  unreadCount,
  type MessageThread,
  type ThreadViewer,
} from "@/lib/data/messages";
import { getVillaBySlugWithHidden } from "@/lib/data/villas";
import { notifyNewMessage } from "@/lib/notify";

/** A user may be both a guest elsewhere and a host — resolve per-thread. */
function viewerFor(thread: MessageThread, userId: string): ThreadViewer | null {
  if (thread.guestUserId === userId) return "guest";
  if (thread.hostId === userId) return "host";
  return null;
}

async function authorize(threadId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 }) };
  const thread = await getThread(threadId);
  if (!thread) return { error: NextResponse.json({ ok: false, error: "Thread not found" }, { status: 404 }) };
  const viewer = viewerFor(thread, user.id);
  if (!viewer) return { error: NextResponse.json({ ok: false, error: "Not your conversation" }, { status: 403 }) };
  return { thread, viewer };
}

/** Poll the thread. Opening/polling it counts as reading it. */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ threadId: string }> },
) {
  const { threadId } = await ctx.params;
  const auth = await authorize(threadId);
  if ("error" in auth) return auth.error;

  await markThreadRead(auth.thread.id, auth.viewer);
  return NextResponse.json({
    ok: true,
    messages: auth.thread.messages,
    lastMessageAt: auth.thread.lastMessageAt,
  });
}

const SendSchema = z.object({ body: z.string().trim().min(1).max(2000) });

export async function POST(
  req: Request,
  ctx: { params: Promise<{ threadId: string }> },
) {
  const { threadId } = await ctx.params;
  const auth = await authorize(threadId);
  if ("error" in auth) return auth.error;

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = SendSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Message can't be empty" }, { status: 422 });
  }

  // Whether the recipient had anything unread BEFORE this message decides
  // if we email them (first new message only — not every line of a chat).
  const recipientViewer: ThreadViewer = auth.viewer === "host" ? "guest" : "host";
  const hadUnreadBefore = unreadCount(auth.thread, recipientViewer) > 0;

  const updated = await appendMessage(threadId, auth.viewer, parsed.data.body);

  if (updated) {
    const user = await getCurrentUser();
    const villa = getVillaBySlugWithHidden(updated.villaSlug);
    await notifyNewMessage({
      recipientUserId: recipientViewer === "host" ? updated.hostId : updated.guestUserId,
      senderName: user?.name ?? "Your host",
      villaName: villa?.name ?? updated.villaSlug,
      body: parsed.data.body,
      recipientIsHost: recipientViewer === "host",
      threadId: updated.id,
      hadUnreadBefore,
    });
  }

  return NextResponse.json({ ok: true, messages: updated?.messages ?? [] });
}
