"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Menu, Phone, Send, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { UserMenu } from "@/components/user-menu";
import { PropertyTypeMenu } from "@/components/property-type-menu";
import { CallbackModal } from "@/components/callback-modal";
import type { CityIndexState } from "@/lib/data/villas";

const DISCOVER_GROUP = [
  { href: "/collections", label: "Collections" },
  { href: "/locations", label: "Locations" },
  { href: "/experiences", label: "Experiences" },
] as const;

const SECONDARY_NAV = [
  { href: "/partner", label: "Partner with us" },
];

const PHONE_E164 = "+919657100004";
const PHONE_DISPLAY = "+91 9657100004";
const WHATSAPP_URL = `https://wa.me/${PHONE_E164.replace("+", "")}`;

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.198-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

function DiscoverMenu({ isOverlay }: { isOverlay: boolean }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={`group inline-flex items-center gap-1.5 text-base transition-colors lg:text-lg ${
          isOverlay
            ? "text-white/95 hover:text-white"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Discover
        <ChevronDown className="h-4 w-4 transition-transform group-data-[popup-open]:rotate-180" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={10} className="w-52 p-1.5">
        {DISCOVER_GROUP.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-md px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted/60"
          >
            {item.label}
          </Link>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function GetInTouchMenu() {
  const [callbackOpen, setCallbackOpen] = useState(false);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="group inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-base text-background transition-colors hover:bg-foreground/90"
        >
          <Phone className="h-4 w-4" />
          Get in touch
          <ChevronDown className="h-4 w-4 transition-transform group-data-[popup-open]:rotate-180" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8} className="w-60 p-2">
          <DropdownMenuItem
            onClick={() => {
              window.location.href = `tel:${PHONE_E164}`;
            }}
            className="gap-3 px-3 py-2.5 text-sm"
          >
            <Phone className="h-4 w-4 text-foreground" />
            {PHONE_DISPLAY}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              window.open(WHATSAPP_URL, "_blank", "noopener,noreferrer");
            }}
            className="gap-3 px-3 py-2.5 text-sm"
          >
            <WhatsAppIcon className="h-4 w-4 text-emerald-600" />
            Whatsapp
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setCallbackOpen(true)}
            className="gap-3 px-3 py-2.5 text-sm"
          >
            <Send className="h-4 w-4 text-foreground" />
            Make an enquiry
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {/* Controlled callback modal — dropdown menu items can't host their
          own trigger, so we render the modal here and let the item toggle it. */}
      <CallbackModal open={callbackOpen} onOpenChange={setCallbackOpen} />
    </>
  );
}

export function SiteHeader({
  user,
  transparent = false,
  villaStates = [],
  apartmentStates = [],
}: {
  user: { name: string; email: string } | null;
  transparent?: boolean;
  villaStates?: CityIndexState[];
  apartmentStates?: CityIndexState[];
}) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileCallbackOpen, setMobileCallbackOpen] = useState(false);

  // Toggle scrolled state for transparent mode (turn solid when past 80px)
  useEffect(() => {
    if (!transparent) return;
    function onScroll() {
      setScrolled(window.scrollY > 80);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [transparent]);

  const isOverlay = transparent && !scrolled;

  return (
    <header
      className={`sticky top-0 z-40 transition-colors duration-300 ${
        isOverlay
          ? "bg-transparent border-transparent"
          : "bg-chrome border-b border-border/60 shadow-sm"
      }`}
    >
      <div className="container-page flex h-20 items-center justify-between gap-6">
        <Link href="/" aria-label="Earthy Stays — home" className="flex items-center">
          <Image
            src="/brand/logo.png"
            alt="Earthy Stays"
            width={1200}
            height={937}
            priority
            className={`h-24 w-auto sm:h-28 md:h-32 transition-[filter] duration-300 ${
              isOverlay ? "brightness-0 invert" : ""
            }`}
          />
        </Link>

        <nav className="hidden md:flex items-center gap-9 lg:gap-10">
          <PropertyTypeMenu
            label="Villas"
            href="/villas"
            states={villaStates}
            isOverlay={isOverlay}
          />
          <PropertyTypeMenu
            label="Apartments"
            href="/apartments"
            states={apartmentStates}
            isOverlay={isOverlay}
          />
          <DiscoverMenu isOverlay={isOverlay} />
          {SECONDARY_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-base lg:text-lg transition-colors ${
                isOverlay
                  ? "text-white/95 hover:text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <UserMenu user={user} variant={isOverlay ? "overlay" : "default"} />
          <GetInTouchMenu />
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          {/* Mobile-only cluster — Call Us pill + hamburger sit tight
              against each other (gap-1.5) instead of being separated by
              the parent header's gap-6. */}
          <div className="flex items-center gap-1.5 md:hidden">
            <a
              href={`tel:${PHONE_E164}`}
              aria-label={`Call ${PHONE_DISPLAY}`}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                isOverlay
                  ? "border-white/50 text-white hover:bg-white/10"
                  : "border-foreground/40 text-foreground hover:bg-muted"
              }`}
            >
              <Phone className="h-3.5 w-3.5" />
              Call us
            </a>
            <SheetTrigger
              className={`inline-flex items-center justify-center rounded-md p-2 transition-colors ${
                isOverlay ? "text-white" : "text-foreground"
              }`}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
          </div>
          <SheetContent side="right" className="w-full sm:max-w-sm">
            <SheetHeader>
              <SheetTitle>
                <Image
                  src="/brand/logo.png"
                  alt="Earthy Stays"
                  width={1200}
                  height={937}
                  className="h-20 w-auto"
                />
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-6 flex flex-col gap-1 px-4">
              <MobileTypeGroup
                label="Villas"
                href="/villas"
                states={villaStates}
                onNavigate={() => setOpen(false)}
              />
              <MobileTypeGroup
                label="Apartments"
                href="/apartments"
                states={apartmentStates}
                onNavigate={() => setOpen(false)}
              />
              <div className="px-3 pb-1 pt-4 text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80">
                Discover
              </div>
              {DISCOVER_GROUP.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-3 text-base hover:bg-muted"
                >
                  {item.label}
                </Link>
              ))}
              {SECONDARY_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-3 text-base hover:bg-muted"
                >
                  {item.label}
                </Link>
              ))}

              <div className="mt-6 border-t border-border/60 pt-4 grid gap-1 text-sm">
                {user ? (
                  <>
                    <Link
                      href="/wishlist"
                      onClick={() => setOpen(false)}
                      className="rounded-md px-3 py-3 hover:bg-muted"
                    >
                      Wishlist ({user.email})
                    </Link>
                    <form action="/api/auth/logout" method="post">
                      <button type="submit" className="w-full text-left rounded-md px-3 py-3 hover:bg-muted">
                        Sign out
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setOpen(false)}
                      className="rounded-md px-3 py-3 hover:bg-muted"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setOpen(false)}
                      className="rounded-md px-3 py-3 hover:bg-muted"
                    >
                      Create account
                    </Link>
                  </>
                )}
                <a
                  href={`tel:${PHONE_E164}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-md px-3 py-3 hover:bg-muted"
                >
                  <Phone className="h-4 w-4" />
                  {PHONE_DISPLAY}
                </a>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-md px-3 py-3 hover:bg-muted"
                >
                  <WhatsAppIcon className="h-4 w-4 text-emerald-600" />
                  Whatsapp
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    // Defer opening the modal until the sheet finishes its
                    // close animation so focus lands cleanly on the modal.
                    setTimeout(() => setMobileCallbackOpen(true), 200);
                  }}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left hover:bg-muted"
                >
                  <Send className="h-4 w-4" />
                  Make an enquiry
                </button>
              </div>
            </nav>
          </SheetContent>
        </Sheet>

        {/* Callback modal triggered from the mobile drawer's "Make an enquiry" */}
        <CallbackModal
          open={mobileCallbackOpen}
          onOpenChange={setMobileCallbackOpen}
        />
      </div>
    </header>
  );
}

function MobileTypeGroup({
  label,
  href,
  states,
  onNavigate,
}: {
  label: string;
  href: string;
  states: CityIndexState[];
  onNavigate: () => void;
}) {
  const singular = label.replace(/s$/, "");
  return (
    <div>
      <Link
        href={href}
        onClick={onNavigate}
        className="block rounded-md px-3 py-3 text-base hover:bg-muted"
      >
        {label}
      </Link>
      {states.length > 0 && (
        <div className="ml-3 mt-1 mb-2 grid gap-px border-l border-border/40 pl-3">
          {states.flatMap((s) =>
            s.cities.map((c) => (
              <Link
                key={`${s.stateSlug}/${c.slug}`}
                href={`${href}?state=${s.stateSlug}&city=${c.slug}`}
                onClick={onNavigate}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {singular}s in {c.name}
              </Link>
            )),
          )}
        </div>
      )}
    </div>
  );
}
