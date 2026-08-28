import Link from "next/link";
import Image from "next/image";
import { AtSign, Mail, Phone } from "lucide-react";
import { CallbackModal } from "@/components/callback-modal";
import { TrackedTelLink } from "@/components/tracked-tel-link";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-chrome">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 md:grid-cols-4 md:py-14">
        <div className="sm:col-span-2">
          <Image
            src="/brand/logo.png"
            alt="Earthy Stays"
            /* Renders at most h-36 (~184px wide); 1200 forced an oversized
               srcset candidate. Ratio preserved. */
            width={480}
            height={375}
            loading="lazy"
            className="h-28 w-auto md:h-36"
          />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Handpicked private homes across the subcontinent — for slow weekends,
            milestone gatherings, and the occasional escape.
          </p>
          <div className="mt-6 flex flex-col gap-3 text-sm text-muted-foreground">
            <Link href="mailto:reservations@earthyrooms.com" className="inline-flex items-center gap-2.5 hover:text-foreground break-all">
              <Mail className="h-4 w-4 shrink-0" /> reservations@earthyrooms.com
            </Link>
            <TrackedTelLink href="tel:+919657100004" source="footer" className="inline-flex items-center gap-2.5 hover:text-foreground">
              <Phone className="h-4 w-4 shrink-0" /> +91 9657100004
            </TrackedTelLink>
            {/* Second line kept on its own tracking source so the two numbers
                stay distinguishable in the Contact event. */}
            <TrackedTelLink href="tel:+919657200004" source="footer-alt" className="inline-flex items-center gap-2.5 hover:text-foreground">
              <Phone className="h-4 w-4 shrink-0" /> +91 9657200004
            </TrackedTelLink>
          </div>
        </div>

        <div>
          <h4 className="font-display text-base">Explore</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <li><Link href="/villas" className="hover:text-foreground">All villas</Link></li>
            <li><Link href="/locations" className="hover:text-foreground">Locations</Link></li>
            <li><Link href="/apartments" className="hover:text-foreground">Apartments</Link></li>
            <li><Link href="/about" className="hover:text-foreground">About us</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-base">Plan</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <li><Link href="/partner" className="hover:text-foreground">Partner with us</Link></li>
            <li>
              <CallbackModal
                triggerLabel="Corporate retreats"
                showIcon={false}
                triggerClassName="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              />
            </li>
            <li>
              <a
                href="https://www.instagram.com/earthystays_official/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:text-foreground"
              >
                <AtSign className="h-4 w-4 shrink-0" aria-hidden="true" />
                @earthystays_official
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border/60">
        <div className="container-page flex flex-col-reverse items-center gap-4 py-6 text-center text-xs text-muted-foreground sm:flex-row sm:justify-between sm:text-left">
          <p>© {new Date().getFullYear()} Earthy Stays. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
