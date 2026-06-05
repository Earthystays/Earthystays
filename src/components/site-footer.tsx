import Link from "next/link";
import Image from "next/image";
import { AtSign, Mail, Phone } from "lucide-react";
import { CallbackModal } from "@/components/callback-modal";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-chrome">
      <div className="container-page grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <Image
            src="/brand/logo.png"
            alt="Earthy Stays"
            width={1200}
            height={937}
            className="h-40 w-auto"
          />
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            Handpicked private homes across the subcontinent — for slow weekends,
            milestone gatherings, and the occasional escape.
          </p>
          <div className="mt-5 flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="mailto:reservations@earthyrooms.com" className="inline-flex items-center gap-2 hover:text-foreground">
              <Mail className="h-4 w-4" /> reservations@earthyrooms.com
            </Link>
            <Link href="tel:+919657100004" className="inline-flex items-center gap-2 hover:text-foreground">
              <Phone className="h-4 w-4" /> +91 9657100004
            </Link>
          </div>
        </div>

        <div>
          <h4 className="font-display text-base">Explore</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link href="/villas" className="hover:text-foreground">All villas</Link></li>
            <li><Link href="/locations" className="hover:text-foreground">Locations</Link></li>
            <li><Link href="/apartments" className="hover:text-foreground">Apartments</Link></li>
            <li><Link href="/about" className="hover:text-foreground">About us</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-base">Plan</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link href="/partner" className="hover:text-foreground">Concierge</Link></li>
            <li>
              <CallbackModal
                triggerLabel="Corporate retreats"
                showIcon={false}
                triggerClassName="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              />
            </li>
            <li><Link href="/partner" className="hover:text-foreground">List your villa</Link></li>
            <li>
              <Link href="https://instagram.com" className="inline-flex items-center gap-2 hover:text-foreground">
                <AtSign className="h-4 w-4" /> @earthystays
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border/60">
        <div className="container-page flex flex-col md:flex-row items-center justify-between gap-3 py-5 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Earthy Stays. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
