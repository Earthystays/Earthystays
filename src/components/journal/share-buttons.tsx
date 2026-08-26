"use client";

import { useEffect, useState } from "react";
import { Link2, Share2, Check } from "lucide-react";
import { toast } from "sonner";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.198-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884" />
    </svg>
  );
}
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07" />
    </svg>
  );
}
function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.46l8.6-9.83L0 1.15h7.6l5.24 6.93 6.06-6.93Zm-1.29 19.5h2.04L6.48 3.24H4.29L17.61 20.65Z" />
    </svg>
  );
}

export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [href, setHref] = useState(url);
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHref(window.location.href);
      setCanNativeShare(!!navigator.share);
    }
  }, []);

  const enc = encodeURIComponent(href);
  const encTitle = encodeURIComponent(title);

  async function copy() {
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy the link");
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({ title, url: href });
    } catch {
      /* user cancelled */
    }
  }

  const btn =
    "inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-forest hover:text-forest";

  return (
    <div className="flex items-center gap-2">
      <a className={btn} href={`https://wa.me/?text=${encTitle}%20${enc}`} target="_blank" rel="noopener noreferrer" aria-label="Share on WhatsApp">
        <WhatsAppIcon className="h-4 w-4" />
      </a>
      <a className={btn} href={`https://www.facebook.com/sharer/sharer.php?u=${enc}`} target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook">
        <FacebookIcon className="h-4 w-4" />
      </a>
      <a className={btn} href={`https://twitter.com/intent/tweet?url=${enc}&text=${encTitle}`} target="_blank" rel="noopener noreferrer" aria-label="Share on X">
        <XIcon className="h-4 w-4" />
      </a>
      <button type="button" className={btn} onClick={copy} aria-label="Copy link">
        {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
      </button>
      {canNativeShare && (
        <button type="button" className={btn} onClick={nativeShare} aria-label="Share">
          <Share2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
