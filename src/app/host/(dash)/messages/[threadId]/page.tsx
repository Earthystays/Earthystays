import { redirect } from "next/navigation";

/** Old thread URLs deep-link into the Inbox. */
export default async function LegacyHostThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  redirect(`/host/inbox?thread=${encodeURIComponent(threadId)}`);
}
