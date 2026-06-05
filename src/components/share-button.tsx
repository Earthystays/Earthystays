"use client";

import { Share2, Link2, Mail, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.198-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

export function ShareButton({
  title,
  description = "",
  url,
  variant = "overlay",
  size = "default",
}: {
  title: string;
  description?: string;
  url?: string;
  variant?: "overlay" | "inline";
  size?: "default" | "sm";
}) {
  function getUrl() {
    return url || (typeof window !== "undefined" ? window.location.href : "");
  }

  async function copy(e?: React.MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();
    try {
      await navigator.clipboard.writeText(getUrl());
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Could not copy link");
    }
  }

  function whatsapp(e?: React.MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();
    const text = encodeURIComponent(`${title}\n${getUrl()}`);
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  }

  function sms(e?: React.MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();
    const text = encodeURIComponent(`${title} — ${getUrl()}`);
    window.location.href = `sms:?body=${text}`;
  }

  function email(e?: React.MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();
    const subject = encodeURIComponent(title);
    const body = encodeURIComponent(
      `${description ? description + "\n\n" : ""}${getUrl()}`,
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  async function native(e?: React.MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title, text: description, url: getUrl() });
      } catch {
        // user cancelled
      }
    } else {
      copy();
    }
  }

  const triggerClass =
    variant === "overlay"
      ? `inline-flex ${size === "sm" ? "h-8 w-8" : "h-9 w-9"} items-center justify-center rounded-full bg-white/90 text-foreground shadow-sm transition-all hover:bg-white hover:scale-110`
      : "inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm text-foreground hover:bg-muted";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        onClick={(e) => e.stopPropagation()}
        className={triggerClass}
        aria-label="Share this property"
      >
        <Share2 className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
        {variant === "inline" && <span>Share</span>}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-52 p-2"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenuItem onClick={whatsapp} className="gap-3 px-3 py-2.5 text-sm">
          <WhatsAppGlyph className="h-4 w-4 text-emerald-600" />
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={sms} className="gap-3 px-3 py-2.5 text-sm">
          <MessageCircle className="h-4 w-4 text-foreground" />
          Message (SMS)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={email} className="gap-3 px-3 py-2.5 text-sm">
          <Mail className="h-4 w-4 text-foreground" />
          Email
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copy} className="gap-3 px-3 py-2.5 text-sm">
          <Link2 className="h-4 w-4 text-foreground" />
          Copy link
        </DropdownMenuItem>
        <DropdownMenuItem onClick={native} className="gap-3 px-3 py-2.5 text-sm">
          <Share2 className="h-4 w-4 text-foreground" />
          More…
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
