"use client";

import { type ReactNode } from "react";

/**
 * Plain horizontal scroller — same scroll/snap behaviour as a raw div, just
 * exposed as a component so call sites stay symmetrical with the other
 * sliders that used to render prev/next arrows here. Arrows were removed
 * site-wide; the swipe / trackpad scroll still works.
 */
export function ScrollSlider({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}
