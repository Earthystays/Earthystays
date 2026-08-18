import { Phone } from "lucide-react";
import { TrackedTelLink } from "@/components/tracked-tel-link";

const PHONE_E164 = "+919657100004";
const PHONE_DISPLAY = "+91 9657100004";

/**
 * Compact "Connect with Host" bar that sits directly under the InquiryForm
 * on villa detail pages. Phone icon + label on the left, outlined "Call Now"
 * button on the right that opens the user's phone dialer via tel: link.
 */
export function ConnectWithHost() {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-gradient-to-r from-terracotta/5 via-card to-card px-4 py-3">
      <div className="inline-flex items-center gap-2 text-sm text-foreground">
        <Phone className="h-4 w-4 text-terracotta" strokeWidth={1.8} />
        <span className="font-medium">Connect with Host</span>
      </div>
      <TrackedTelLink
        href={`tel:${PHONE_E164}`}
        source="villa-sidebar"
        ariaLabel={`Call ${PHONE_DISPLAY}`}
        className="inline-flex items-center justify-center rounded-full border border-foreground/30 px-3.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-foreground hover:text-background"
      >
        Call Now
      </TrackedTelLink>
    </div>
  );
}
