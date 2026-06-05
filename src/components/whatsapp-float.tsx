import { WhatsAppIcon } from "@/components/icons";

const PHONE_E164 = "919657100004";
const WHATSAPP_URL = `https://wa.me/${PHONE_E164}?text=${encodeURIComponent(
  "Hi Earthy Stays — I'd like to enquire about a villa.",
)}`;

export function WhatsAppFloat() {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Earthy Stays on WhatsApp"
      className="group fixed bottom-6 left-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg ring-4 ring-emerald-500/20 transition-all hover:scale-105 hover:bg-emerald-600 hover:ring-emerald-500/30"
    >
      <WhatsAppIcon className="h-7 w-7" />
      <span className="sr-only">Chat on WhatsApp</span>
    </a>
  );
}
