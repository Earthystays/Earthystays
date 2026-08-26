import type { TripStatus } from "@/lib/trips/types";
import { STATUS_LABEL } from "./format";

const TONE: Record<TripStatus, string> = {
  upcoming: "bg-primary/10 text-primary ring-primary/20",
  in_progress: "bg-terracotta/10 text-terracotta ring-terracotta/20",
  past: "bg-muted text-muted-foreground ring-border",
  cancelled: "bg-destructive/10 text-destructive ring-destructive/20",
};

export function TripStatusBadge({ status }: { status: TripStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${TONE[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
