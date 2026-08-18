"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { formatINR } from "@/lib/format";
import { ExperienceInquiryCard } from "./experience-inquiry-card";

export function ExperienceMobileBar({
  experienceSlug,
  experienceName,
  priceFrom,
  city,
}: {
  experienceSlug: string;
  experienceName: string;
  priceFrom?: number;
  city?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 border-t border-border/60 bg-card/95 px-5 py-3 backdrop-blur lg:hidden">
        <div>
          {typeof priceFrom === "number" ? (
            <p className="font-numeric text-lg font-semibold tabular-nums">
              {formatINR(priceFrom)}
              <span className="text-xs font-normal text-muted-foreground"> / person</span>
            </p>
          ) : (
            <p className="text-sm font-medium">Send an inquiry</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Send Inquiry
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-background p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-title font-semibold text-xl">{experienceName}</h3>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="rounded-full p-1.5 hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ExperienceInquiryCard
              experienceSlug={experienceSlug}
              experienceName={experienceName}
              priceFrom={priceFrom}
              city={city}
            />
          </div>
        </div>
      )}
    </>
  );
}
