import { redirect } from "next/navigation";

/** The standalone messages list became the Inbox. */
export default function LegacyHostMessagesPage() {
  redirect("/host/inbox");
}
